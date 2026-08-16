import { type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import {
  getAdminDb,
  getAdminStorage,
  hasFirebaseAdminCredentials,
  resolveStorageBucket,
} from "@/lib/firebase-admin";
import { sanitizeExperiences, type ExperienceEntry } from "@/lib/experiences";
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
  /** Structured experiences JSON array on the user profile. */
  experiences: ExperienceEntry[];
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
  recruiterApproved?: boolean;
  mentorApproved?: boolean;
  /** Role-track registration payload (company / mentor profile). */
  registration?: {
    track?: "student" | "mentor" | "hr";
    companyName?: string | null;
    companyWebsite?: string | null;
    jobTitle?: string | null;
    companySize?: string | null;
    phone?: string | null;
    expertise?: string | null;
    yearsExperience?: number | null;
    submittedAt?: string | null;
  } | null;
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
  // Founders may set "ADMIN" in Console — treat as PLATFORM_ADMIN (no separate role).
  const raw = asStringArray(value).map((r) => (r === "ADMIN" ? "PLATFORM_ADMIN" : r));
  const roles = raw.filter(isRoleName);
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
    // Never expose to API clients — auth compares hash server-side only.
    passwordHash: null,
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
    experiences: sanitizeExperiences(data.experiences),
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
    resume: sanitizeResumeForClient((data.resume as ResumeMeta | null) ?? null),
    resumes: Array.isArray(data.resumes)
      ? (data.resumes as ResumeMeta[]).map(sanitizeResumeForClient).filter(Boolean) as ResumeMeta[]
      : [],
    suspendedAt: tsToIso(data.suspendedAt),
    recruiterApproved: Boolean(data.recruiterApproved),
    mentorApproved: Boolean(data.mentorApproved),
    registration: sanitizeRegistration(data.registration),
    createdAt: tsToIso(data.createdAt) || new Date().toISOString(),
    updatedAt: tsToIso(data.updatedAt) || new Date().toISOString(),
  };
}

function sanitizeRegistration(raw: unknown): CareerVerseUser["registration"] {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const track = r.track === "student" || r.track === "mentor" || r.track === "hr" ? r.track : undefined;
  return {
    track,
    companyName: typeof r.companyName === "string" ? r.companyName : null,
    companyWebsite: typeof r.companyWebsite === "string" ? r.companyWebsite : null,
    jobTitle: typeof r.jobTitle === "string" ? r.jobTitle : null,
    companySize: typeof r.companySize === "string" ? r.companySize : null,
    phone: typeof r.phone === "string" ? r.phone : null,
    expertise: typeof r.expertise === "string" ? r.expertise : null,
    yearsExperience: r.yearsExperience == null ? null : Number(r.yearsExperience),
    submittedAt: typeof r.submittedAt === "string" ? r.submittedAt : null,
  };
}

function sanitizeResumeForClient(resume: ResumeMeta | null): ResumeMeta | null {
  if (!resume) return null;
  return {
    ...resume,
    extractedText: null,
  };
}

/** Server-only: include passwordHash for credential auth. */
export function mapUserDocWithSecrets(id: string, data: DocumentData | undefined): CareerVerseUser | null {
  const base = mapUserDoc(id, data);
  if (!base || !data) return base;
  return {
    ...base,
    passwordHash: (data.passwordHash as string | null | undefined) ?? null,
    resume: (data.resume as ResumeMeta | null) ?? null,
    resumes: Array.isArray(data.resumes) ? (data.resumes as ResumeMeta[]) : [],
  };
}

export async function getUserById(uid: string): Promise<CareerVerseUser | null> {
  const snap = await getAdminDb().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return mapUserDoc(snap.id, snap.data());
}

/** Credential sign-in only — includes passwordHash. */
export async function getUserByEmailForAuth(email: string): Promise<CareerVerseUser | null> {
  const normalized = email.toLowerCase();
  const snap = await getAdminDb()
    .collection(USERS_COLLECTION)
    .where("email", "==", normalized)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapUserDocWithSecrets(doc.id, doc.data());
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
  onboardingComplete?: boolean;
  profileCompleteness?: number;
  recruiterApproved?: boolean;
  mentorApproved?: boolean;
  headline?: string | null;
  about?: string | null;
  linkedinUrl?: string | null;
  skills?: string[];
  registration?: CareerVerseUser["registration"];
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
    onboardingComplete: Boolean(input.onboardingComplete),
    profileCompleteness: input.profileCompleteness ?? 10,
    headline: input.headline ?? null,
    about: input.about ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    skills: input.skills ?? ([] as string[]),
    interests: [] as string[],
    experiences: [] as ExperienceEntry[],
    preferredIndustries: [] as string[],
    preferredLocations: [] as string[],
    resume: null,
    resumes: [] as ResumeMeta[],
    suspendedAt: null,
    recruiterApproved: Boolean(input.recruiterApproved),
    mentorApproved: Boolean(input.mentorApproved),
    registration: input.registration ?? null,
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
  experiences?: ExperienceEntry[];
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
        experiences: sanitizeExperiences(update.experiences ?? []),
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
  // Cap extracted text so user docs stay under Firestore 1 MiB.
  const capped: ResumeMeta = {
    ...resume,
    extractedText: resume.extractedText
      ? resume.extractedText.slice(0, 80_000)
      : resume.extractedText,
    analyses: (resume.analyses || []).slice(-3),
  };
  // Replace (not arrayUnion) — one active resume + short history.
  const snap = await ref.get();
  const prev = snap.data() as { resume?: ResumeMeta; resumes?: ResumeMeta[] } | undefined;
  const history = [capped, ...(prev?.resumes || []).filter((r) => r.id !== capped.id)].slice(0, 3);

  await ref.set(
    {
      resume: capped,
      resumes: history,
      ...(profileCompleteness != null ? { profileCompleteness } : {}),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** Best-effort delete of a previous Storage object (ignore missing). */
export async function deleteResumeStorageObject(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath || storagePath.includes("/tmp") || !hasFirebaseAdminCredentials()) return;
  const bucketName = resolveStorageBucket();
  if (!bucketName) return;
  try {
    await getAdminStorage().bucket(bucketName).file(storagePath).delete({ ignoreNotFound: true });
  } catch {
    // ignore
  }
}

export async function listDirectoryUsers(excludeId: string, limit = 4): Promise<CareerVerseUser[]> {
  const snap = await getAdminDb().collection(USERS_COLLECTION).limit(Math.max(limit + 5, 10)).get();
  return snap.docs
    .map((d) => mapUserDoc(d.id, d.data()))
    .filter((u): u is CareerVerseUser => u != null && u.id !== excludeId && !u.suspendedAt)
    .slice(0, limit);
}
