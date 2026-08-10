import { prisma } from "@/lib/db";
import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { trackAnalytics } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: { include: { skill: true } },
        interests: { include: { interest: true } },
      },
    });
    if (!profile) return jsonError("Profile not found", 404);
    const analysis = profile.careerAnalysisJson ? JSON.parse(profile.careerAnalysisJson) : null;
    return jsonOk({ profile, analysis });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load profile", 500);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    const ctx = await getCareerContext(session.user.id);
    if (!ctx) return jsonError("Complete onboarding first", 400);
    const analysis = await aiService.careerAnalysis(ctx);
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        careerScore: analysis.careerScore,
        careerAnalysisJson: JSON.stringify(analysis),
        analysisUpdatedAt: new Date(),
      },
    });
    await trackAnalytics("career_analysis_generated", session.user.id);
    return jsonOk({ analysis });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to generate career analysis", 500);
  }
}
