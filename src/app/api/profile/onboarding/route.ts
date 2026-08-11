import {
  completeOnboarding,
  getUserById,
  updateCareerAnalysis,
} from "@/lib/firestore-users";
import {
  getCareerContext,
  jsonError,
  jsonOk,
  requireSession,
  trackAnalytics,
  computeProfileCompleteness,
} from "@/lib/api";
import { sanitizeExperiences } from "@/lib/experiences";
import { onboardingSchema } from "@/lib/validators";
import { aiService } from "@/lib/ai/service";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Please complete required onboarding fields", 400, {
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const existing = await getUserById(session.user.id);
    const hasResume = Boolean(existing?.resume || (existing?.resumes && existing.resumes.length > 0));
    const completeness = computeProfileCompleteness({
      name: data.name,
      education: data.education,
      degree: data.degree,
      college: data.college,
      graduationYear: data.graduationYear,
      skillsCount: data.skills.length,
      interestsCount: data.interests.length,
      careerGoals: data.careerGoals,
      experienceSummary: data.experienceSummary,
      preferredIndustriesCount: data.preferredIndustries.length,
      preferredLocationsCount: data.preferredLocations.length,
      workPreference: data.workPreference,
      careerStage: data.careerStage,
      hasResume,
    });

    await completeOnboarding(session.user.id, {
      name: data.name,
      education: data.education,
      degree: data.degree,
      college: data.college,
      graduationYear: data.graduationYear,
      careerGoals: data.careerGoals,
      experienceSummary: data.experienceSummary || null,
      experiences: sanitizeExperiences(data.experiences ?? []),
      preferredIndustries: data.preferredIndustries,
      preferredLocations: data.preferredLocations,
      workPreference: data.workPreference,
      careerStage: data.careerStage,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      githubUrl: data.githubUrl || null,
      skills: data.skills,
      interests: data.interests,
      profileCompleteness: completeness,
    });

    const ctx = await getCareerContext(session.user.id);
    const analysis = ctx ? await aiService.careerAnalysis(ctx) : null;
    if (analysis) {
      await updateCareerAnalysis(session.user.id, {
        careerScore: analysis.careerScore,
        careerAnalysisJson: JSON.stringify(analysis),
      });
    }

    await trackAnalytics("onboarding_complete", session.user.id);
    if (analysis) await trackAnalytics("career_analysis_generated", session.user.id);

    return jsonOk({ profileCompleteness: completeness, analysis });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to complete onboarding", 500);
  }
}
