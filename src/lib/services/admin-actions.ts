import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { mapUserDoc, USERS_COLLECTION } from "@/lib/firestore-users";
import { isRoleName, type RoleName } from "@/lib/roles";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { CHAT_INPUT_MAX_CHARS, DAILY_CHAT_CAP } from "@/lib/ai/chat-guard";
import { sendApprovalEmail } from "@/lib/email/waitlist";
import type { AdminMutationPayload } from "@/lib/validators";

const ADMIN_MUTATION_CAP = 60; // per hour

export async function consumeAdminMutationQuota(adminId: string): Promise<boolean> {
  if (!hasFirebaseAdminCredentials()) return true;
  const hour = new Date().toISOString().slice(0, 13);
  const ref = getAdminDb()
    .collection("users")
    .doc(adminId)
    .collection("rateLimits")
    .doc("adminMutations");
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const count = data.hour === hour ? Number(data.count || 0) : 0;
      if (count >= ADMIN_MUTATION_CAP) return false;
      tx.set(ref, { hour, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    });
  } catch {
    return false;
  }
}

export async function safeCount(collection: string): Promise<number> {
  try {
    const agg = await getAdminDb().collection(collection).count().get();
    return agg.data().count;
  } catch {
    try {
      const snap = await getAdminDb().collection(collection).limit(500).get();
      return snap.size;
    } catch {
      return 0;
    }
  }
}

export function locationKey(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > 80) return null;
  return t.replace(/\s+/g, " ");
}

export async function getAdminConsoleData(reqUrl?: string) {
  const db = getAdminDb();
  const day = new Date().toISOString().slice(0, 10);

  const [usersCount, appsCount, jobsResult] = await Promise.all([
    safeCount(USERS_COLLECTION),
    safeCount("applications"),
    loadJobsFromFirestore(50),
  ]);

  const [recentUsersSnap, analyticsSnap, aiSnap] = await Promise.all([
    db.collection(USERS_COLLECTION).orderBy("updatedAt", "desc").limit(100).get(),
    db.collection("analytics").orderBy("createdAt", "desc").limit(30).get(),
    db.collection("aiUsage").orderBy("createdAt", "desc").limit(40).get(),
  ]);

  const recentUsers = recentUsersSnap.docs
    .map((d) => mapUserDoc(d.id, d.data()))
    .filter((u): u is NonNullable<typeof u> => u !== null);

  const pendingQueue: Array<{
    id: string;
    name?: string | null;
    email: string;
    track: "mentor" | "hr";
    createdAt?: string | null;
    status: "pending";
  }> = [];

  const registrationBreakdown = {
    total: recentUsers.length,
    students: 0,
    mentors: 0,
    recruiters: 0,
    pendingMentors: 0,
    pendingRecruiters: 0,
  };

  for (const u of recentUsers) {
    const track = u.registration?.track;
    if (track === "mentor" || u.roles.includes("MENTOR")) {
      if (!u.mentorApproved) {
        pendingQueue.push({
          id: u.id,
          name: u.name,
          email: u.email,
          track: "mentor",
          createdAt: u.createdAt ?? null,
          status: "pending",
        });
      }
      registrationBreakdown.mentors += 1;
      if (!u.mentorApproved) registrationBreakdown.pendingMentors += 1;
    } else if (track === "hr" || u.roles.includes("HR")) {
      if (!u.recruiterApproved) {
        pendingQueue.push({
          id: u.id,
          name: u.name,
          email: u.email,
          track: "hr",
          createdAt: u.createdAt ?? null,
          status: "pending",
        });
      }
      registrationBreakdown.recruiters += 1;
      if (!u.recruiterApproved) registrationBreakdown.pendingRecruiters += 1;
    } else {
      registrationBreakdown.students += 1;
    }
  }

  const recentRegistrations = recentUsers.slice(0, 25).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    track:
      u.registration?.track === "mentor" || u.roles.includes("MENTOR")
        ? "mentor"
        : u.registration?.track === "hr" || u.roles.includes("HR")
          ? "recruiter"
          : "student",
    createdAt: u.createdAt ?? null,
    pending:
      (u.registration?.track === "mentor" || u.roles.includes("MENTOR")) && !u.mentorApproved
        ? true
        : (u.registration?.track === "hr" || u.roles.includes("HR")) && !u.recruiterApproved
          ? true
          : false,
  }));

  const recentActivity = analyticsSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: String(data.name || "event"),
      userId: data.userId == null ? null : String(data.userId),
      props: (data.props as Record<string, unknown> | null) ?? null,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
    };
  });

  const flags: Array<{ id: string; severity: "warning" | "critical"; label: string; userId?: string }> = [];
  for (const u of recentUsers) {
    if (u.suspendedAt) {
      flags.push({ id: `sus-${u.id}`, severity: "critical", label: `Suspended: ${u.email}`, userId: u.id });
    }
    if ((u.registration?.track === "hr" || u.roles.includes("HR")) && !u.recruiterApproved) {
      flags.push({ id: `hr-${u.id}`, severity: "warning", label: `Recruiter pending: ${u.email}`, userId: u.id });
    }
    if ((u.registration?.track === "mentor" || u.roles.includes("MENTOR")) && !u.mentorApproved) {
      flags.push({ id: `men-${u.id}`, severity: "warning", label: `Mentor pending: ${u.email}`, userId: u.id });
    }
  }
  const failedAi = aiSnap.docs.filter((d) => d.data()?.success === false).length;
  if (failedAi >= 5) {
    flags.push({ id: "ai-fail", severity: "warning", label: `${failedAi} recent AI failures` });
  }

  let focusedUser: {
    id: string;
    name?: string | null;
    email: string;
    roles: string[];
    suspendedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    skillsCount: number;
    careerScore?: number | null;
    preferredLocations: string[];
    preferredIndustries: string[];
    careerGoals?: string | null;
    profileCompleteness: number;
    recruiterApproved?: boolean;
    mentorApproved?: boolean;
    recentEvents: Array<{ id: string; name: string; userId: string; props: Record<string, unknown> | null; createdAt: string | null }>;
  } | null = null;

  if (reqUrl) {
    const parsedUrl = new URL(reqUrl);
    const focusId = parsedUrl.searchParams.get("focus");
    if (focusId) {
      const doc = await db.collection(USERS_COLLECTION).doc(focusId).get();
      if (doc.exists) {
        const mapped = mapUserDoc(doc.id, doc.data());
        if (mapped) {
          const userEvents = await db
            .collection("analytics")
            .where("userId", "==", mapped.id)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()
            .catch(() => null);

          focusedUser = {
            id: mapped.id,
            name: mapped.name,
            email: mapped.email,
            roles: mapped.roles,
            suspendedAt: mapped.suspendedAt ?? null,
            createdAt: mapped.createdAt ?? null,
            updatedAt: mapped.updatedAt ?? null,
            skillsCount: mapped.skills.length,
            careerScore: mapped.careerScore ?? null,
            preferredLocations: mapped.preferredLocations,
            preferredIndustries: mapped.preferredIndustries,
            careerGoals: mapped.careerGoals ?? null,
            profileCompleteness: mapped.profileCompleteness,
            recruiterApproved: mapped.recruiterApproved,
            mentorApproved: mapped.mentorApproved,
            recentEvents: (userEvents?.docs || []).map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                name: String(data.name || "event"),
                userId: mapped.id,
                props: (data.props as Record<string, unknown> | null) ?? null,
                createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
              };
            }),
          };
        }
      }
    }
  }

  const locCounts = new Map<string, number>();
  for (const u of recentUsers) {
    for (const loc of u.preferredLocations) {
      const key = locationKey(loc);
      if (!key) continue;
      locCounts.set(key, (locCounts.get(key) || 0) + 1);
    }
  }

  try {
    const locSnap = await db.collection(USERS_COLLECTION).limit(200).get();
    locCounts.clear();
    for (const d of locSnap.docs) {
      const u = mapUserDoc(d.id, d.data());
      if (!u) continue;
      for (const loc of u.preferredLocations) {
        const key = locationKey(loc);
        if (!key) continue;
        locCounts.set(key, (locCounts.get(key) || 0) + 1);
      }
    }
  } catch {
    // keep counts from recentUsers only
  }

  const locationBreakdown = Array.from(locCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  let aiEventsToday = 0;
  const aiUsage = aiSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const createdAt = typeof data.createdAt === "string" ? data.createdAt : "";
    if (createdAt.startsWith(day)) aiEventsToday += 1;
    return {
      id: d.id,
      operation: String(data.operation || "unknown"),
      model: data.model == null ? null : String(data.model),
      tokensIn: Number(data.tokensIn || 0),
      tokensOut: Number(data.tokensOut || 0),
      success: Boolean(data.success),
      userId: data.userId == null ? null : String(data.userId),
      createdAt: createdAt || null,
    };
  });

  return {
    overview: {
      users: usersCount,
      applications: appsCount,
      opportunities: jobsResult.jobs.length,
      aiEventsToday,
    },
    recentUsers,
    locationBreakdown,
    aiUsage,
    registrationBreakdown,
    recentRegistrations,
    pendingQueue: pendingQueue.slice(0, 50),
    recentActivity,
    flags: flags.slice(0, 40),
    focusedUser,
    chatLimits: { dailyCap: DAILY_CHAT_CAP, maxInputChars: CHAT_INPUT_MAX_CHARS },
    jobsSource: jobsResult.source,
    serverTime: new Date().toISOString(),
  };
}

export async function executeAdminMutation(
  adminId: string,
  payload: AdminMutationPayload,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string; status?: number }> {
  const { action } = payload;

  if (action === "seed_starter_jobs") {
    const { JOB_SEED_CATALOG } = await import("@/data/jobs");
    const db = getAdminDb();
    const batch = db.batch();
    const now = new Date().toISOString();
    for (const job of JOB_SEED_CATALOG) {
      const ref = db.collection("jobs").doc(job.id);
      batch.set(
        ref,
        {
          ...job,
          isDemo: false,
          status: "PUBLISHED",
          publishedAt: now,
          updatedAt: now,
          seededAt: now,
        },
        { merge: true },
      );
    }
    await batch.commit();
    return { success: true, data: { ok: true, seeded: JOB_SEED_CATALOG.length } };
  }

  const id = "id" in payload ? payload.id : "";
  if (!id) return { success: false, error: "Invalid admin action", status: 400 };

  if (
    id === adminId &&
    (action === "suspend_user" || action === "set_roles" || action === "revoke_recruiter" || action === "revoke_mentor")
  ) {
    return { success: false, error: "You cannot modify your own admin account this way", status: 400 };
  }

  const ref = getAdminDb().collection(USERS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { success: false, error: "User not found", status: 404 };
  const target = mapUserDoc(snap.id, snap.data());
  if (!target) return { success: false, error: "User not found", status: 404 };

  const now = new Date().toISOString();

  if (action === "suspend_user") {
    await ref.set({ suspendedAt: now, updatedAt: now }, { merge: true });
    return { success: true, data: { ok: true, id, suspendedAt: now } };
  }

  if (action === "unsuspend_user") {
    await ref.set({ suspendedAt: null, updatedAt: now }, { merge: true });
    return { success: true, data: { ok: true, id, suspendedAt: null } };
  }

  if (action === "approve_recruiter") {
    if (target.recruiterApproved) return { success: true, data: { ok: true, id, recruiterApproved: true, idempotent: true } };
    const roles = new Set(target.roles as string[]);
    roles.add("HR");
    await ref.set(
      { roles: Array.from(roles), recruiterApproved: true, updatedAt: now },
      { merge: true },
    );
    await sendApprovalEmail({
      to: target.email,
      name: target.name?.trim() || "there",
      role: "recruiter",
    });
    return { success: true, data: { ok: true, id, recruiterApproved: true } };
  }

  if (action === "revoke_recruiter") {
    await ref.set({ recruiterApproved: false, updatedAt: now }, { merge: true });
    return { success: true, data: { ok: true, id, recruiterApproved: false } };
  }

  if (action === "approve_mentor") {
    if (target.mentorApproved) return { success: true, data: { ok: true, id, mentorApproved: true, idempotent: true } };
    const roles = new Set(target.roles as string[]);
    roles.add("MENTOR");
    await ref.set(
      { roles: Array.from(roles), mentorApproved: true, updatedAt: now },
      { merge: true },
    );
    await sendApprovalEmail({
      to: target.email,
      name: target.name?.trim() || "there",
      role: "mentor",
    });
    return { success: true, data: { ok: true, id, mentorApproved: true } };
  }

  if (action === "revoke_mentor") {
    const roles = (mapUserDoc(snap.id, snap.data())?.roles ?? []).filter((role) => role !== "MENTOR");
    await ref.set({ roles, mentorApproved: false, updatedAt: now }, { merge: true });
    return { success: true, data: { ok: true, id, mentorApproved: false } };
  }

  if (action === "set_roles") {
    const roles = payload.roles.filter(isRoleName) as RoleName[];
    if (!roles.length) return { success: false, error: "At least one valid role required", status: 400 };
    const wasAdmin = target.roles.includes("PLATFORM_ADMIN");
    const staysAdmin = roles.includes("PLATFORM_ADMIN");
    if (wasAdmin && !staysAdmin) {
      const admins = await getAdminDb()
        .collection(USERS_COLLECTION)
        .where("roles", "array-contains", "PLATFORM_ADMIN")
        .limit(3)
        .get()
        .catch(() => null);
      if (admins && admins.size <= 1) {
        return { success: false, error: "Cannot remove the last PLATFORM_ADMIN", status: 400 };
      }
    }
    await ref.set({ roles, updatedAt: now }, { merge: true });
    return { success: true, data: { ok: true, id, roles } };
  }

  return { success: false, error: "Invalid admin action", status: 400 };
}
