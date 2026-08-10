import { prisma } from "@/lib/db";
import { getCareerContext, jsonError, jsonOk, requireSession, trackAnalytics, computeProfileCompleteness } from "@/lib/api";
import { onboardingSchema } from "@/lib/validators";
import { toJsonArray } from "@/lib/utils";
import { aiService } from "@/lib/ai/service";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) return jsonError("Please complete required onboarding fields", 400, { details: parsed.error.flatten() });

    const data = parsed.data;
    const resumeCount = await prisma.resume.count({ where: { userId: session.user.id } });
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
      hasResume: resumeCount > 0,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        education: data.education,
        degree: data.degree,
        college: data.college,
        graduationYear: data.graduationYear,
        careerGoals: data.careerGoals,
        experienceSummary: data.experienceSummary || null,
        preferredIndustries: toJsonArray(data.preferredIndustries),
        preferredLocations: toJsonArray(data.preferredLocations),
        workPreference: data.workPreference,
        careerStage: data.careerStage,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        onboardingComplete: true,
        profileCompleteness: completeness,
      },
      create: {
        userId: session.user.id,
        education: data.education,
        degree: data.degree,
        college: data.college,
        graduationYear: data.graduationYear,
        careerGoals: data.careerGoals,
        experienceSummary: data.experienceSummary || null,
        preferredIndustries: toJsonArray(data.preferredIndustries),
        preferredLocations: toJsonArray(data.preferredLocations),
        workPreference: data.workPreference,
        careerStage: data.careerStage,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        onboardingComplete: true,
        profileCompleteness: completeness,
      },
    });

    await prisma.userSkill.deleteMany({ where: { profileId: profile.id } });
    for (const skillName of data.skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName.toLowerCase() },
        update: {},
        create: { name: skillName.toLowerCase() },
      });
      await prisma.userSkill.create({
        data: { profileId: profile.id, skillId: skill.id, level: 3 },
      });
    }

    await prisma.userInterest.deleteMany({ where: { profileId: profile.id } });
    for (const interestName of data.interests) {
      const interest = await prisma.interest.upsert({
        where: { name: interestName },
        update: {},
        create: { name: interestName },
      });
      await prisma.userInterest.create({
        data: { profileId: profile.id, interestId: interest.id },
      });
    }

    const ctx = await getCareerContext(session.user.id);
    const analysis = ctx ? await aiService.careerAnalysis(ctx) : null;
    if (analysis) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          careerScore: analysis.careerScore,
          careerAnalysisJson: JSON.stringify(analysis),
          analysisUpdatedAt: new Date(),
        },
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
