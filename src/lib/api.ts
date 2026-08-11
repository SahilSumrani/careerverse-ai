import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/firestore-users";
import type { UserCareerContext } from "@/lib/ai/types";

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
  const user = await getUserById(userId);
  if (!user) return null;
  return {
    name: user.name,
    education: user.education ?? null,
    degree: user.degree ?? null,
    college: user.college ?? null,
    graduationYear: user.graduationYear ?? null,
    skills: user.skills,
    interests: user.interests,
    careerGoals: user.careerGoals ?? null,
    experienceSummary: user.experienceSummary ?? null,
    preferredIndustries: user.preferredIndustries,
    preferredLocations: user.preferredLocations,
    workPreference: user.workPreference ?? null,
    careerStage: user.careerStage ?? null,
    profileCompleteness: user.profileCompleteness,
    resumeText: user.resume?.extractedText ?? user.resumes?.[0]?.extractedText ?? null,
  };
}

/** Soft analytics — Firestore write is best-effort; never blocks student flows. */
export async function trackAnalytics(name: string, userId?: string, props?: Record<string, unknown>) {
  try {
    const { hasFirebaseAdminCredentials, getAdminDb } = await import("@/lib/firebase-admin");
    if (!hasFirebaseAdminCredentials()) return;
    await getAdminDb()
      .collection("analyticsEvents")
      .add({
        name,
        userId: userId ?? null,
        props: props ?? null,
        createdAt: new Date().toISOString(),
      });
  } catch {
    // ignore
  }
}
