import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserCareerContext } from "@/lib/ai/types";
import { parseJsonArray } from "@/lib/utils";

export { computeProfileCompleteness } from "@/lib/profile";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session;
}

export async function getCareerContext(userId: string): Promise<UserCareerContext | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
      user: {
        include: {
          resumes: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!profile) return null;
  return {
    name: profile.user.name,
    education: profile.education,
    degree: profile.degree,
    college: profile.college,
    graduationYear: profile.graduationYear,
    skills: profile.skills.map((s) => s.skill.name),
    interests: profile.interests.map((i) => i.interest.name),
    careerGoals: profile.careerGoals,
    experienceSummary: profile.experienceSummary,
    preferredIndustries: parseJsonArray(profile.preferredIndustries),
    preferredLocations: parseJsonArray(profile.preferredLocations),
    workPreference: profile.workPreference,
    careerStage: profile.careerStage,
    profileCompleteness: profile.profileCompleteness,
    resumeText: profile.user.resumes[0]?.extractedText ?? null,
  };
}

export async function trackAnalytics(name: string, userId?: string, props?: Record<string, unknown>) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        name,
        userId,
        propsJson: props ? JSON.stringify(props) : null,
      },
    });
  } catch {
    // ignore
  }
}
