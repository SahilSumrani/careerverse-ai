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
    companyType?: string | null;
    registrationNumber?: string | null;
    gstNumber?: string | null;
    industry?: string | null;
    companyWebsite?: string | null;
    jobTitle?: string | null;
    companySize?: string | null;
    phone?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    pinCode?: string | null;
    companyDescription?: string | null;
    educationLevel?: string | null;
    institution?: string | null;
    course?: string | null;
    graduationYear?: number | null;
    preferredRole?: string | null;
    hasResume?: boolean;
    currentOrganization?: string | null;
    expertise?: string | null;
    yearsExperience?: number | null;
    mentoringExperience?: string | null;
    motivation?: string | null;
    achievements?: string | null;
    availabilityDays?: string | null;
    hoursPerWeek?: number | null;
    languages?: string | null;
    menteeAudience?: string | null;
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
    companyType: typeof r.companyType === "string" ? r.companyType : null,
    registrationNumber: typeof r.registrationNumber === "string" ? r.registrationNumber : null,
    gstNumber: typeof r.gstNumber === "string" ? r.gstNumber : null,
    industry: typeof r.industry === "string" ? r.industry : null,
    companyWebsite: typeof r.companyWebsite === "string" ? r.companyWebsite : null,
    jobTitle: typeof r.jobTitle === "string" ? r.jobTitle : null,
    companySize: typeof r.companySize === "string" ? r.companySize : null,
    phone: typeof r.phone === "string" ? r.phone : null,
    address1: typeof r.address1 === "string" ? r.address1 : null,
    address2: typeof r.address2 === "string" ? r.address2 : null,
    city: typeof r.city === "string" ? r.city : null,
    state: typeof r.state === "string" ? r.state : null,
    pinCode: typeof r.pinCode === "string" ? r.pinCode : null,
    companyDescription: typeof r.companyDescription === "string" ? r.companyDescription : null,
    educationLevel: typeof r.educationLevel === "string" ? r.educationLevel : null,
    institution: typeof r.institution === "string" ? r.institution : null,
    course: typeof r.course === "string" ? r.course : null,
    graduationYear: r.graduationYear == null ? null : Number(r.graduationYear),
    preferredRole: typeof r.preferredRole === "string" ? r.preferredRole : null,
    hasResume: Boolean(r.hasResume),
    currentOrganization: typeof r.currentOrganization === "string" ? r.currentOrganization : null,
    expertise: typeof r.expertise === "string" ? r.expertise : null,
    yearsExperience: r.yearsExperience == null ? null : Number(r.yearsExperience),
    mentoringExperience: typeof r.mentoringExperience === "string" ? r.mentoringExperience : null,
    motivation: typeof r.motivation === "string" ? r.motivation : null,
    achievements: typeof r.achievements === "string" ? r.achievements : null,
    availabilityDays: typeof r.availabilityDays === "string" ? r.availabilityDays : null,
    hoursPerWeek: r.hoursPerWeek == null ? null : Number(r.hoursPerWeek),
    languages: typeof r.languages === "string" ? r.languages : null,
    menteeAudience: typeof r.menteeAudience === "string" ? r.menteeAudience : null,
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

export type TopTalentStudent = {
  id: string;
  name: string | null;
  careerScore: number;
  skills: string[];
  percentileBand: "top_20";
};

export function isScoredStudent(user: CareerVerseUser): boolean {
  if (user.suspendedAt) return false;
  if (user.roles.includes("PLATFORM_ADMIN")) return false;
  const track = user.registration?.track;
  if (track === "hr" || track === "mentor") return false;
  if (user.roles.includes("HR") && !user.roles.includes("STUDENT")) return false;
  if (user.roles.includes("MENTOR") && !user.roles.includes("STUDENT")) return false;
  return typeof user.careerScore === "number" && Number.isFinite(user.careerScore);
}

/** Intersection of topFraction by score, then minScore. Pure so tests can pin the 90+ ∩ top 20% rule. */
export function selectTopTalent<T extends { careerScore: number }>(
  scored: T[],
  opts?: { minScore?: number; topFraction?: number; limit?: number },
): T[] {
  const minScore = opts?.minScore ?? 90;
  const topFraction = opts?.topFraction ?? 0.2;
  const limit = opts?.limit ?? 50;
  const sorted = [...scored].sort((a, b) => b.careerScore - a.careerScore);
  const n = sorted.length;
  if (!n) return [];
  const k = Math.max(1, Math.ceil(topFraction * n));
  return sorted.slice(0, k).filter((row) => row.careerScore >= minScore).slice(0, limit);
}

// ponytail: scan ceiling 500 scored users; upgrade when a careerScore index + pagination exists
const TOP_TALENT_SCAN = 500;

export async function listTopTalentStudents(opts?: {
  minScore?: number;
  topFraction?: number;
  limit?: number;
}): Promise<{ items: TopTalentStudent[]; scoredCount: number; cutoffK: number }> {
  const minScore = opts?.minScore ?? 90;
  const topFraction = opts?.topFraction ?? 0.2;
  const limit = opts?.limit ?? 50;
  const db = getAdminDb();
  let snap;
  try {
    snap = await db.collection(USERS_COLLECTION).orderBy("careerScore", "desc").limit(TOP_TALENT_SCAN).get();
  } catch {
    snap = await db.collection(USERS_COLLECTION).limit(TOP_TALENT_SCAN).get();
  }
  const scored = snap.docs
    .map((d) => mapUserDoc(d.id, d.data()))
    .filter((u): u is CareerVerseUser => u != null && isScoredStudent(u));
  const n = scored.length;
  const cutoffK = n ? Math.max(1, Math.ceil(topFraction * n)) : 0;
  const picked = selectTopTalent(
    scored.map((u) => ({
      id: u.id,
      name: u.name,
      careerScore: Number(u.careerScore),
      skills: u.skills.slice(0, 12),
      percentileBand: "top_20" as const,
    })),
    { minScore, topFraction, limit },
  );
  return { items: picked, scoredCount: n, cutoffK };
}
