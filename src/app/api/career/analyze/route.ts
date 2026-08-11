import { getUserById, updateCareerAnalysis } from "@/lib/firestore-users";
import { getCareerContext, jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getUserById(session.user.id);
    if (!user) return jsonError("Profile not found", 404);
    const analysis = user.careerAnalysisJson ? JSON.parse(user.careerAnalysisJson) : null;
    return jsonOk({
      profile: {
        id: user.id,
        userId: user.id,
        education: user.education,
        degree: user.degree,
        college: user.college,
        graduationYear: user.graduationYear,
        careerGoals: user.careerGoals,
        experienceSummary: user.experienceSummary,
        preferredIndustries: user.preferredIndustries,
        preferredLocations: user.preferredLocations,
        workPreference: user.workPreference,
        careerStage: user.careerStage,
        onboardingComplete: user.onboardingComplete,
        profileCompleteness: user.profileCompleteness,
        careerScore: user.careerScore,
        skills: user.skills.map((name) => ({ skill: { name } })),
        interests: user.interests.map((name) => ({ interest: { name } })),
      },
      analysis,
    });
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
    await updateCareerAnalysis(session.user.id, {
      careerScore: analysis.careerScore,
      careerAnalysisJson: JSON.stringify(analysis),
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
