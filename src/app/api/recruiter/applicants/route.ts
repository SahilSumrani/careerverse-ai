import { jsonError, jsonOk, readJsonBody, requireSession, trackAnalytics } from "@/lib/api";
import { deterministicJobMatch } from "@/lib/ai/service";
import type { UserCareerContext } from "@/lib/ai/types";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { getUserById } from "@/lib/firestore-users";
import { consumeDailyQuota } from "@/lib/rate-limit";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { recruiterApplicantPatchSchema } from "@/lib/validators";

const APPLICANT_STATUSES = new Set([
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
]);

const RECRUITER_MUTATION_CAP = 80;

type JobMeta = {
  id: string;
  createdBy: string;
  title: string;
  company: string;
  type: string;
  tags: string[];
  blurb: string;
};

function ctxFromUserData(data: Record<string, unknown> | undefined): UserCareerContext {
  return {
    name: typeof data?.name === "string" ? data.name : null,
    skills: Array.isArray(data?.skills) ? data.skills.map(String) : [],
    interests: Array.isArray(data?.interests) ? data.interests.map(String) : [],
    careerGoals: typeof data?.careerGoals === "string" ? data.careerGoals : null,
    preferredIndustries: Array.isArray(data?.preferredIndustries) ? data.preferredIndustries.map(String) : [],
    preferredLocations: Array.isArray(data?.preferredLocations) ? data.preferredLocations.map(String) : [],
    profileCompleteness: Number(data?.profileCompleteness ?? 0),
    careerScore: data?.careerScore == null ? null : Number(data.careerScore),
  };
}

async function requireApprovedRecruiter() {
  const session = await requireSession();
  await requirePermission(session.user.id, PERMISSIONS.OPPORTUNITY_CREATE);
  const user = await getUserById(session.user.id);
  const isAdmin = Boolean(user?.roles.includes("PLATFORM_ADMIN"));
  if (!isAdmin && !user?.recruiterApproved) {
    const err = Object.assign(new Error("Recruiter inbox requires admin approval"), {
      status: 403,
      companyName: user?.registration?.companyName ?? null,
    });
    throw err;
  }
  return { session, user, isAdmin };
}

async function loadOwnedJobs(recruiterId: string, isAdmin: boolean): Promise<Map<string, JobMeta>> {
  const db = getAdminDb();
  const snap = isAdmin
    ? await db.collection("jobs").limit(100).get()
    : await db.collection("jobs").where("createdBy", "==", recruiterId).limit(50).get();
  const jobs = new Map<string, JobMeta>();
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const tagsRaw = data.tags || data.skills;
    jobs.set(d.id, {
      id: d.id,
      createdBy: String(data.createdBy || ""),
      title: String(data.title || "Role"),
      company: String(data.company || data.organizationName || "Company"),
      type: String(data.type || "Full-time"),
      tags: Array.isArray(tagsRaw) ? tagsRaw.map(String) : [],
      blurb: String(data.blurb || data.description || ""),
    });
  }
  return jobs;
}

async function loadJobRecord(opportunityId: string): Promise<JobMeta | null> {
  const db = getAdminDb();
  const job = await db.collection("jobs").doc(opportunityId).get();
  if (job.exists) {
    const data = job.data() as Record<string, unknown>;
    const tagsRaw = data.tags || data.skills;
    return {
      id: job.id,
      createdBy: String(data.createdBy || ""),
      title: String(data.title || "Role"),
      company: String(data.company || "Company"),
      type: String(data.type || "Full-time"),
      tags: Array.isArray(tagsRaw) ? tagsRaw.map(String) : [],
      blurb: String(data.blurb || ""),
    };
  }
  const opp = await db.collection("opportunities").doc(opportunityId).get();
  if (!opp.exists) return null;
  const data = opp.data() as Record<string, unknown>;
  const tagsRaw = data.skills || data.tags;
  return {
    id: opp.id,
    createdBy: String(data.createdBy || ""),
    title: String(data.title || "Role"),
    company: String(data.organizationName || data.company || "Company"),
    type: String(data.type || "Full-time"),
    tags: Array.isArray(tagsRaw) ? tagsRaw.map(String) : [],
    blurb: String(data.description || data.blurb || ""),
  };
}

/** Applicants for jobs created by this recruiter (or all for PLATFORM_ADMIN). */
export async function GET() {
  try {
    const { session, isAdmin } = await requireApprovedRecruiter();
    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({ items: [], source: "unconfigured" });
    }

    const db = getAdminDb();
    const jobs = await loadOwnedJobs(session.user.id, isAdmin);
    const jobIds = Array.from(jobs.keys());
    if (!jobIds.length) return jsonOk({ items: [], source: "firestore" });

    const items: Array<Record<string, unknown>> = [];
    for (let i = 0; i < jobIds.length; i += 10) {
      const chunk = jobIds.slice(i, i + 10);
      const snap = await db.collection("applications").where("opportunityId", "in", chunk).limit(50).get();
      for (const d of snap.docs) {
        const data = d.data();
        const opportunity = data.opportunity as { isDemo?: boolean } | undefined;
        if (data.isDemo || opportunity?.isDemo || !APPLICANT_STATUSES.has(String(data.status))) continue;
        items.push({
          id: d.id,
          status: data.status,
          userId: data.userId,
          opportunity: data.opportunity,
          opportunityId: data.opportunityId,
          updatedAt: data.updatedAt,
          matchScore: data.matchScore ?? null,
        });
      }
    }

    const visible = items.slice(0, 80);
    const userIds = Array.from(new Set(visible.map((item) => String(item.userId || "")).filter(Boolean)));
    const users = new Map<
      string,
      { name: string | null; email: string | null; careerScore: number | null; skills: string[]; ctx: UserCareerContext }
    >();
    if (userIds.length) {
      const userSnaps = await db.getAll(...userIds.map((id) => db.collection("users").doc(id)));
      for (const snap of userSnaps) {
        const data = snap.data() as Record<string, unknown> | undefined;
        const ctx = ctxFromUserData(data);
        users.set(snap.id, {
          name: typeof data?.name === "string" ? data.name : null,
          email: typeof data?.email === "string" ? data.email : null,
          careerScore: data?.careerScore == null ? null : Number(data.careerScore),
          skills: ctx.skills.slice(0, 12),
          ctx,
        });
      }
    }

    const enriched = visible.map((item) => {
      const profile = users.get(String(item.userId || ""));
      const job = jobs.get(String(item.opportunityId || ""));
      let matchScore = item.matchScore == null ? null : Number(item.matchScore);
      let matchReasons: string[] = [];
      if ((matchScore == null || Number.isNaN(matchScore)) && profile && job) {
        const match = deterministicJobMatch(profile.ctx, {
          title: job.title,
          description: job.blurb,
          skills: job.tags,
          type: job.type,
        });
        matchScore = match.score;
        matchReasons = match.reasons.slice(0, 2);
      }
      return {
        ...item,
        careerScore: profile?.careerScore ?? null,
        skills: profile?.skills ?? [],
        matchScore,
        matchReasons,
        applicant: profile ? { name: profile.name, email: profile.email } : null,
      };
    });

    enriched.sort((a, b) => {
      const matchDelta = Number(b.matchScore ?? -1) - Number(a.matchScore ?? -1);
      if (matchDelta) return matchDelta;
      return Number(b.careerScore ?? -1) - Number(a.careerScore ?? -1);
    });

    return jsonOk({ items: enriched, source: "firestore" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) {
      return jsonError("Recruiter inbox requires admin approval", 403, {
        pending: true,
        companyName: (e as { companyName?: string | null }).companyName ?? null,
      });
    }
    return jsonError("Unable to load applicants", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, isAdmin } = await requireApprovedRecruiter();
    const body = await readJsonBody(req);
    const parsed = recruiterApplicantPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid applicant update", 400);

    const quota = await consumeDailyQuota(session.user.id, "recruiterApplicantMutations", RECRUITER_MUTATION_CAP);
    if (!quota.ok) return jsonError("Daily recruiter update limit reached", 429);

    if (!hasFirebaseAdminCredentials()) return jsonError("Recruiter backend unavailable", 503);

    const { applicationId, status: nextStatus } = parsed.data;
    const db = getAdminDb();
    const ref = db.collection("applications").doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("Application not found", 404);
    const data = snap.data() || {};
    if (data.isDemo) return jsonError("Demo applications are disabled", 400);

    const opportunityId = String(data.opportunityId || "");
    if (!opportunityId) return jsonError("Application is missing a job", 400);
    const job = await loadJobRecord(opportunityId);
    if (!job) return jsonError("Job not found", 404);
    if (!isAdmin && job.createdBy !== session.user.id) return jsonError("Forbidden", 403);

    const updatedAt = new Date().toISOString();
    await ref.set({ status: nextStatus, updatedAt, isDemo: false }, { merge: true });
    void trackAnalytics(nextStatus === "HIRED" ? "recruiter_hired" : "recruiter_status_change", session.user.id, {
      applicationId,
      status: nextStatus,
      opportunityId,
    });
    return jsonOk({
      application: { id: applicationId, ...data, status: nextStatus, updatedAt, isDemo: false },
      source: "firestore",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to update applicant", 500);
  }
}
