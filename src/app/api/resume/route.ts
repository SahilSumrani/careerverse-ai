import { nanoid } from "nanoid";
import {
  attachResumeMeta,
  deleteResumeStorageObject,
  getUserById,
  type ResumeMeta,
} from "@/lib/firestore-users";
import { extractResumeText, validateAndReadResume } from "@/lib/uploads";
import {
  computeProfileCompleteness,
  getCareerContext,
  jsonError,
  jsonOk,
  readRequestBody,
  requireSession,
  trackAnalytics,
} from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { consumeDailyQuota } from "@/lib/rate-limit";
import {
  hasFirebaseAdminCredentials,
  getAdminStorage,
  resolveStorageBucket,
} from "@/lib/firebase-admin";

const RESUME_ANALYZE_DAILY_CAP = Number(process.env.AI_RESUME_DAILY_CAP || 10);

async function tryUploadToStorage(
  uid: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ storagePath: string; storageUrl: string | null } | null> {
  if (!hasFirebaseAdminCredentials()) return null;
  const bucketName = resolveStorageBucket();
  if (!bucketName) return null;

  try {
    const storagePath = `resumes/${uid}/${Date.now()}-${fileName}`;
    const bucket = getAdminStorage().bucket(bucketName);
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
      metadata: { contentType: mimeType },
    });
    let storageUrl: string | null = null;
    try {
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      });
      storageUrl = url;
    } catch {
      storageUrl = `gs://${bucketName}/${storagePath}`;
    }
    return { storagePath, storageUrl };
  } catch (error) {
    console.warn("Firebase Storage upload skipped:", error);
    return null;
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getUserById(session.user.id);
    const resumes = (user?.resumes?.length
      ? user.resumes
      : user?.resume
        ? [user.resume]
        : []
    )
      .slice()
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
    return jsonOk({ resumes });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load resumes", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 5_242_880);
    const body = await readRequestBody(req, maxUploadBytes + 65_536);
    const bodyBuffer = new ArrayBuffer(body.byteLength);
    new Uint8Array(bodyBuffer).set(body);
    const form = await new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: bodyBuffer,
    }).formData();
    const file = form.get("file");
    const targetRole = String(form.get("targetRole") || "") || undefined;
    if (!(file instanceof File)) return jsonError("Resume file required", 400);
    if (targetRole && targetRole.length > 160) return jsonError("Target role is too long", 400);

    const quota = await consumeDailyQuota(session.user.id, "resumeAnalyze", RESUME_ANALYZE_DAILY_CAP);
    if (!quota.ok) {
      return jsonError("Daily resume analysis limit reached. Try again tomorrow.", 429);
    }

    const saved = await validateAndReadResume(file);
    const extractedText = await extractResumeText(saved.buffer, saved.mimeType);

    const cloud = await tryUploadToStorage(
      session.user.id,
      saved.fileName,
      saved.buffer,
      saved.mimeType,
    );

    if (!cloud) {
      return jsonError(
        "Resume storage is not configured. Set FIREBASE_STORAGE_BUCKET and Admin credentials, then retry.",
        503,
      );
    }

    const prev = await getUserById(session.user.id);
    if (prev?.resume?.storagePath && prev.resume.storagePath !== cloud.storagePath) {
      await deleteResumeStorageObject(prev.resume.storagePath);
    }

    const resumeId = nanoid();
    const uploadedAt = new Date().toISOString();

    const ctx = await getCareerContext(session.user.id);
    const [analysis, parsedProfile] = await Promise.all([
      aiService.resumeAnalysis({
        resumeText: extractedText || "No extractable text found.",
        targetRole,
        ctx: ctx ?? undefined,
      }),
      aiService.parseResumeProfile({ resumeText: extractedText }),
    ]);

    const analysisId = nanoid();
    const resume: ResumeMeta = {
      id: resumeId,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      storagePath: cloud.storagePath,
      storageUrl: cloud.storageUrl,
      extractedText: extractedText?.slice(0, 80_000) ?? null,
      uploadedAt,
      analyses: [
        {
          id: analysisId,
          targetRole: targetRole ?? null,
          score: analysis.score,
          resultJson: JSON.stringify(analysis),
          createdAt: uploadedAt,
        },
      ],
    };

    const completeness = computeProfileCompleteness({
      name: parsedProfile.name || session.user.name,
      education: parsedProfile.education || prev?.education,
      degree: parsedProfile.degree || prev?.degree,
      college: parsedProfile.college || prev?.college,
      graduationYear: parsedProfile.graduationYear ?? prev?.graduationYear,
      skillsCount: Math.max(parsedProfile.skills.length, prev?.skills.length ?? 0),
      interestsCount: Math.max(parsedProfile.interests.length, prev?.interests.length ?? 0),
      careerGoals: parsedProfile.careerGoals || prev?.careerGoals,
      experienceSummary: parsedProfile.experienceSummary || prev?.experienceSummary,
      preferredIndustriesCount: Math.max(
        parsedProfile.preferredIndustries.length,
        prev?.preferredIndustries.length ?? 0,
      ),
      preferredLocationsCount: Math.max(
        parsedProfile.preferredLocations.length,
        prev?.preferredLocations.length ?? 0,
      ),
      workPreference: prev?.workPreference,
      careerStage: prev?.careerStage,
      hasResume: true,
    });

    await attachResumeMeta(session.user.id, resume, completeness);

    await trackAnalytics("resume_uploaded", session.user.id);
    await trackAnalytics("resume_analysis_completed", session.user.id, { targetRole });
    return jsonOk({
      resume: { id: resume.id, fileName: resume.fileName },
      analysis,
      analysisId,
      parsedProfile,
      storage: "firebase" as const,
      remainingAnalyses: quota.remaining,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError(
      (e as Error).message || "Unable to analyze resume",
      status >= 400 && status < 500 ? status : 500,
    );
  }
}
