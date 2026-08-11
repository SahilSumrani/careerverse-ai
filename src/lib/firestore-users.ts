import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RoleName } from "@/lib/roles";
import { isRoleName } from "@/lib/roles";

export const USERS_COLLECTION = "users";

export type ResumeMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string | null;
  storageUrl?: string | null;
  extractedText?: string | null;
  uploadedAt: string;
  analyses?: Array<{
    id: string;
    targetRole?: string | null;
    score: number;
    resultJson: string;
    createdAt: string;
  }>;
};

export type CareerVerseUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: string | null;
  passwordHash?: string | null;
  roles: RoleName[];
  onboardingComplete: boolean;
  profileCompleteness: number;
  headline?: string | null;
  about?: string | null;
  education?: string | null;
  degree?: string | null;
  college?: string | null;
  graduationYear?: number | null;
  experienceSummary?: string | null;
  careerGoals?: string | null;
  skills: string[];
  interests: string[];
  preferredIndustries: string[];
  preferredLocations: string[];
  workPreference?: string | null;
  careerStage?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  careerScore?: number | null;
  careerAnalysisJson?: string | null;
  analysisUpdatedAt?: string | null;
  resume?: ResumeMeta | null;
  resumes?: ResumeMeta[];
  suspendedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asRoles(value: unknown): RoleName[] {
  const roles = asStringArray(value).filter(isRoleName);
  return roles.length ? roles : ["STUDENT"];
}

export function mapUserDoc(id: string, data: DocumentData | undefined): CareerVerseUser | null {
  if (!data || typeof data.email !== "string") return null;
  return {
    id,
    email: data.email,
    name: (data.name as string | null) ?? null,
    image: (data.image as string | null) ?? null,
    emailVerified: tsToIso(data.emailVerified),
    passwordHash: (data.passwordHash as string | null | undefined) ?? null,
    roles: asRoles(data.roles),
    onboardingComplete: Boolean(data.onboardingComplete),
    profileCompleteness: Number(data.profileCompleteness ?? 0),
    headline: (data.headline as string | null) ?? null,
    about: (data.about as string | null) ?? null,
    education: (data.education as string | null) ?? null,
    degree: (data.degree as string | null) ?? null,
    college: (data.college as string | null) ?? null,
    graduationYear: data.graduationYear == null ? null : Number(data.graduationYear),
    experienceSummary: (data.experienceSummary as string | null) ?? null,
    careerGoals: (data.careerGoals as string | null) ?? null,
    skills: asStringArray(data.skills),
    interests: asStringArray(data.interests),
    preferredIndustries: asStringArray(data.preferredIndustries),
    preferredLocations: asStringArray(data.preferredLocations),
    workPreference: (data.workPreference as string | null) ?? null,
    careerStage: (data.careerStage as string | null) ?? null,
    linkedinUrl: (data.linkedinUrl as string | null) ?? null,
    portfolioUrl: (data.portfolioUrl as string | null) ?? null,
    githubUrl: (data.githubUrl as string | null) ?? null,
    careerScore: data.careerScore == null ? null : Number(data.careerScore),
    careerAnalysisJson: (data.careerAnalysisJson as string | null) ?? null,
    analysisUpdatedAt: tsToIso(data.analysisUpdatedAt),
    resume: (data.resume as ResumeMeta | null) ?? null,
    resumes: Array.isArray(data.resumes) ? (data.resumes as ResumeMeta[]) : [],
    suspendedAt: tsToIso(data.suspendedAt),
    createdAt: tsToIso(data.createdAt) || new Date().toISOString(),
    updatedAt: tsToIso(data.updatedAt) || new Date().toISOString(),
  };
}

export async function getUserById(uid: string): Promise<CareerVerseUser | null> {
  const snap = await getAdminDb().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return mapUserDoc(snap.id, snap.data());
}

export async function getUserByEmail(email: string): Promise<CareerVerseUser | null> {
  const normalized = email.toLowerCase();
  const snap = await getAdminDb()
    .collection(USERS_COLLECTION)
    .where("email", "==", normalized)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapUserDoc(doc.id, doc.data());
}

export async function createEmailPasswordUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role: RoleName;
}): Promise<CareerVerseUser> {
  const id = nanoid();
  const now = new Date().toISOString();
  const data = {
    email: input.email.toLowerCase(),
    name: input.name,
    image: null,
    emailVerified: null,
    passwordHash: input.passwordHash,
    roles: [input.role],
    onboardingComplete: false,
    profileCompleteness: 10,
    skills: [] as string[],
    interests: [] as string[],
    preferredIndustries: [] as string[],
    preferredLocations: [] as string[],
    resume: null,
    resumes: [] as ResumeMeta[],
    suspendedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await getAdminDb().collection(USERS_COLLECTION).doc(id).set(data);
  return mapUserDoc(id, data)!;
}

export type OnboardingUpdate = {
  name: string;
  education: string;
  degree: string;
  college: string;
  graduationYear: number;
  careerGoals: string;
  experienceSummary?: string | null;
  preferredIndustries: string[];
  preferredLocations: string[];
  workPreference?: string | null;
  careerStage?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  skills: string[];
  interests: string[];
  profileCompleteness: number;
  careerScore?: number | null;
  careerAnalysisJson?: string | null;
};

export async function completeOnboarding(uid: string, update: OnboardingUpdate): Promise<void> {
  const now = new Date().toISOString();
  await getAdminDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .set(
      {
        name: update.name,
        education: update.education,
        degree: update.degree,
        college: update.college,
        graduationYear: update.graduationYear,
        careerGoals: update.careerGoals,
        experienceSummary: update.experienceSummary || null,
        preferredIndustries: update.preferredIndustries,
        preferredLocations: update.preferredLocations,
        workPreference: update.workPreference || null,
        careerStage: update.careerStage || null,
        linkedinUrl: update.linkedinUrl || null,
        portfolioUrl: update.portfolioUrl || null,
        githubUrl: update.githubUrl || null,
        skills: update.skills.map((s) => s.toLowerCase()),
        interests: update.interests,
        onboardingComplete: true,
        profileCompleteness: update.profileCompleteness,
        ...(update.careerAnalysisJson
          ? {
              careerScore: update.careerScore ?? null,
              careerAnalysisJson: update.careerAnalysisJson,
              analysisUpdatedAt: now,
            }
          : {}),
        updatedAt: now,
      },
      { merge: true },
    );
}

export async function updateCareerAnalysis(
  uid: string,
  analysis: { careerScore: number; careerAnalysisJson: string },
): Promise<void> {
  await getAdminDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .set(
      {
        careerScore: analysis.careerScore,
        careerAnalysisJson: analysis.careerAnalysisJson,
        analysisUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function attachResumeMeta(
  uid: string,
  resume: ResumeMeta,
  profileCompleteness?: number,
): Promise<void> {
  const ref = getAdminDb().collection(USERS_COLLECTION).doc(uid);
  await ref.set(
    {
      resume,
      resumes: FieldValue.arrayUnion(resume),
      ...(profileCompleteness != null ? { profileCompleteness } : {}),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function listDirectoryUsers(excludeId: string, limit = 4): Promise<CareerVerseUser[]> {
  const snap = await getAdminDb().collection(USERS_COLLECTION).limit(Math.max(limit + 5, 10)).get();
  return snap.docs
    .map((d) => mapUserDoc(d.id, d.data()))
    .filter((u): u is CareerVerseUser => u != null && u.id !== excludeId && !u.suspendedAt)
    .slice(0, limit);
}
