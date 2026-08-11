import { nanoid } from "nanoid";
import {
  attachResumeMeta,
  getUserById,
  type ResumeMeta,
} from "@/lib/firestore-users";
import { extractResumeText, saveResumeFile } from "@/lib/uploads";
import {
  computeProfileCompleteness,
  getCareerContext,
  jsonError,
  jsonOk,
  requireSession,
  trackAnalytics,
} from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { hasFirebaseAdminCredentials, getAdminStorage } from "@/lib/firebase-admin";

async function tryUploadToStorage(
  uid: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ storagePath: string; storageUrl: string | null } | null> {
  if (!hasFirebaseAdminCredentials() && !process.env.FIREBASE_STORAGE_BUCKET && !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    return null;
  }
  try {
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) return null;
    const storagePath = `resumes/${uid}/${Date.now()}-${fileName}`;
    const bucket = getAdminStorage().bucket(bucketName);
    const file = bucket.file(storagePath);
    await file.save(buffer, { contentType: mimeType, resumable: false, metadata: { contentType: mimeType } });
    // Prefer signed URL when possible; otherwise store gs path only
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
    const resumes = user?.resumes?.length
      ? user.resumes
      : user?.resume
        ? [user.resume]
        : [];
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
    const form = await req.formData();
    const file = form.get("file");
    const targetRole = String(form.get("targetRole") || "") || undefined;
    if (!(file instanceof File)) return jsonError("Resume file required", 400);

    const saved = await saveResumeFile(file);
    const extractedText = await extractResumeText(saved.buffer, saved.mimeType);

    const cloud = await tryUploadToStorage(
      session.user.id,
      saved.fileName,
      saved.buffer,
      saved.mimeType,
    );

    const resumeId = nanoid();
    const uploadedAt = new Date().toISOString();

    const ctx = await getCareerContext(session.user.id);
    const analysis = await aiService.resumeAnalysis({
      resumeText: extractedText || "No extractable text found.",
      targetRole,
      ctx: ctx ?? undefined,
    });

    const analysisId = nanoid();
    const resume: ResumeMeta = {
      id: resumeId,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      // Local disk path is ephemeral on Vercel; prefer Storage when available
      storagePath: cloud?.storagePath ?? saved.storagePath,
      storageUrl: cloud?.storageUrl ?? null,
      extractedText,
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

    const user = await getUserById(session.user.id);
    const completeness = computeProfileCompleteness({
      name: session.user.name,
      education: user?.education,
      degree: user?.degree,
      college: user?.college,
      graduationYear: user?.graduationYear,
      skillsCount: user?.skills.length ?? 0,
      interestsCount: user?.interests.length ?? 0,
      careerGoals: user?.careerGoals,
      experienceSummary: user?.experienceSummary,
      preferredIndustriesCount: user?.preferredIndustries.length ?? 0,
      preferredLocationsCount: user?.preferredLocations.length ?? 0,
      workPreference: user?.workPreference,
      careerStage: user?.careerStage,
      hasResume: true,
    });

    await attachResumeMeta(session.user.id, resume, completeness);

    await trackAnalytics("resume_uploaded", session.user.id);
    await trackAnalytics("resume_analysis_completed", session.user.id, { targetRole });
    return jsonOk({
      resume: { id: resume.id, fileName: resume.fileName },
      analysis,
      analysisId,
      storage: cloud ? "firebase" : "local",
      note: cloud
        ? undefined
        : "File metadata saved in Firestore; binary stored locally (ephemeral on Vercel). Add Firebase Admin + Storage bucket for durable uploads.",
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
