import { prisma } from "@/lib/db";
import { extractResumeText, saveResumeFile } from "@/lib/uploads";
import { computeProfileCompleteness, getCareerContext, jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireSession();
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    });
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
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        storagePath: saved.storagePath,
        extractedText,
      },
    });

    const ctx = await getCareerContext(session.user.id);
    const analysis = await aiService.resumeAnalysis({
      resumeText: extractedText || "No extractable text found.",
      targetRole,
      ctx: ctx ?? undefined,
    });
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        targetRole,
        score: analysis.score,
        resultJson: JSON.stringify(analysis),
      },
    });

    if (ctx) {
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        include: { skills: true, interests: true },
      });
      if (profile) {
        const completeness = computeProfileCompleteness({
          name: session.user.name,
          education: profile.education,
          degree: profile.degree,
          college: profile.college,
          graduationYear: profile.graduationYear,
          skillsCount: profile.skills.length,
          interestsCount: profile.interests.length,
          careerGoals: profile.careerGoals,
          experienceSummary: profile.experienceSummary,
          preferredIndustriesCount: parseJsonArray(profile.preferredIndustries).length,
          preferredLocationsCount: parseJsonArray(profile.preferredLocations).length,
          workPreference: profile.workPreference,
          careerStage: profile.careerStage,
          hasResume: true,
        });
        await prisma.profile.update({
          where: { id: profile.id },
          data: { profileCompleteness: completeness },
        });
      }
    }

    await trackAnalytics("resume_uploaded", session.user.id);
    await trackAnalytics("resume_analysis_completed", session.user.id, { targetRole });
    return jsonOk({ resume: { id: resume.id, fileName: resume.fileName }, analysis, analysisId: savedAnalysis.id });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError((e as Error).message || "Unable to analyze resume", status >= 400 && status < 500 ? status : 500);
  }
}
