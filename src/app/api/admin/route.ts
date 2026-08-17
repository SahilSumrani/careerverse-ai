import { jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { mapUserDoc, USERS_COLLECTION } from "@/lib/firestore-users";
import { adminMutationSchema } from "@/lib/validators";
import { isRoleName, type RoleName } from "@/lib/roles";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { CHAT_INPUT_MAX_CHARS, DAILY_CHAT_CAP } from "@/lib/ai/chat-guard";
import { sendApprovalEmail } from "@/lib/email/waitlist";

const ADMIN_MUTATION_CAP = 60; // per hour

async function consumeAdminMutationQuota(adminId: string): Promise<boolean> {
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

async function safeCount(collection: string): Promise<number> {
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

function locationKey(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > 80) return null;
  // Prefer explicit labels from preferredLocations — no invented geo.
  return t.replace(/\s+/g, " ");
}

/** Platform admin console data from Firestore. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({
        overview: { users: 0, applications: 0, opportunities: 0, aiEventsToday: 0 },
        recentUsers: [],
        locationBreakdown: [],
        aiUsage: [],
        registrationBreakdown: { students: 0, mentors: 0, recruiters: 0, pendingMentors: 0, pendingRecruiters: 0 },
        recentRegistrations: [],
        pendingQueue: [],
        recentActivity: [],
        flags: [],
        focusedUser: null,
        chatLimits: { dailyCap: DAILY_CHAT_CAP, maxInputChars: CHAT_INPUT_MAX_CHARS },
        note: "Firebase Admin credentials required for live metrics.",
        serverTime: new Date().toISOString(),
      });
    }

    const db = getAdminDb();
    const day = new Date().toISOString().slice(0, 10);

    const url = new URL(req.url);
    const focusUserId = url.searchParams.get("userId")?.trim() || "";

    const [usersCount, appsCount, jobsResult, usersSnap, aiSnap, analyticsSnap] = await Promise.all([
      safeCount(USERS_COLLECTION),
      safeCount("applications"),
      loadJobsFromFirestore(100),
      db.collection(USERS_COLLECTION).orderBy("createdAt", "desc").limit(80).get().catch(async () => {
        // Fallback if createdAt index/order missing
        return db.collection(USERS_COLLECTION).limit(80).get();
      }),
      db
        .collection("aiUsage")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get()
        .catch(async () => db.collection("aiUsage").limit(40).get()),
      db
        .collection("analyticsEvents")
        .orderBy("createdAt", "desc")
        .limit(60)
        .get()
        .catch(async () => db.collection("analyticsEvents").limit(60).get()),
    ]);

    const recentUsers = usersSnap.docs
      .map((d) => mapUserDoc(d.id, d.data()))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roles: u.roles,
        recruiterApproved: u.recruiterApproved ?? false,
        mentorApproved: u.mentorApproved ?? false,
        registration: u.registration ?? null,
        suspendedAt: u.suspendedAt ?? null,
        onboardingComplete: u.onboardingComplete,
        careerScore: u.careerScore ?? null,
        preferredLocations: u.preferredLocations.slice(0, 5),
        createdAt: u.createdAt,
      }));

    const [hrSnap, mentorSnap] = await Promise.all([
      db.collection(USERS_COLLECTION).where("roles", "array-contains", "HR").limit(80).get().catch(() => null),
      db.collection(USERS_COLLECTION).where("roles", "array-contains", "MENTOR").limit(80).get().catch(() => null),
    ]);
    const pendingSeen = new Set<string>();
    const pendingQueue: Array<{
      id: string;
      name: string | null;
      email: string;
      kind: "mentor" | "recruiter";
      companyName: string | null;
      expertise: string | null;
      careerScore: number | null;
      createdAt: string | null;
    }> = [];
    const considerPending = (u: (typeof recentUsers)[number]) => {
      if (pendingSeen.has(u.id) || u.suspendedAt) return;
      const isMentor = u.registration?.track === "mentor" || u.roles.includes("MENTOR");
      const isHr = u.registration?.track === "hr" || u.roles.includes("HR");
      if (isMentor && !u.mentorApproved) {
        pendingSeen.add(u.id);
        pendingQueue.push({
          id: u.id,
          name: u.name ?? null,
          email: u.email,
          kind: "mentor",
          companyName: u.registration?.currentOrganization ?? null,
          expertise: u.registration?.expertise ?? null,
          careerScore: u.careerScore ?? null,
          createdAt: u.createdAt ?? null,
        });
      } else if (isHr && !u.recruiterApproved) {
        pendingSeen.add(u.id);
        pendingQueue.push({
          id: u.id,
          name: u.name ?? null,
          email: u.email,
          kind: "recruiter",
          companyName: u.registration?.companyName ?? null,
          expertise: u.registration?.jobTitle ?? null,
          careerScore: u.careerScore ?? null,
          createdAt: u.createdAt ?? null,
        });
      }
    };
    for (const u of recentUsers) considerPending(u);
    for (const snap of [hrSnap, mentorSnap]) {
      if (!snap) continue;
      for (const d of snap.docs) {
        const mapped = mapUserDoc(d.id, d.data());
        if (!mapped) continue;
        considerPending({
          id: mapped.id,
          name: mapped.name,
          email: mapped.email,
          roles: mapped.roles,
          recruiterApproved: mapped.recruiterApproved ?? false,
          mentorApproved: mapped.mentorApproved ?? false,
          registration: mapped.registration ?? null,
          suspendedAt: mapped.suspendedAt ?? null,
          onboardingComplete: mapped.onboardingComplete,
          careerScore: mapped.careerScore ?? null,
          preferredLocations: mapped.preferredLocations.slice(0, 5),
          createdAt: mapped.createdAt,
        });
      }
    }
    pendingQueue.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const registrationBreakdown = { students: 0, mentors: 0, recruiters: 0, pendingMentors: 0, pendingRecruiters: 0 };
    for (const u of recentUsers) {
      const track = u.registration?.track;
      if (track === "mentor" || u.roles.includes("MENTOR")) {
        registrationBreakdown.mentors += 1;
        if (!u.mentorApproved) registrationBreakdown.pendingMentors += 1;
      } else if (track === "hr" || u.roles.includes("HR")) {
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

    // ponytail: heuristic flags only; upgrade when a dedicated abuse pipeline exists
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
      activity: typeof recentActivity;
      aiUsage: Array<{ id: string; operation: string; createdAt: string | null; success: boolean }>;
    } | null = null;

    if (focusUserId) {
      const focus = recentUsers.find((u) => u.id === focusUserId);
      const focusDoc = focus ? null : await db.collection(USERS_COLLECTION).doc(focusUserId).get().catch(() => null);
      const mapped = focus || (focusDoc?.exists ? mapUserDoc(focusDoc.id, focusDoc.data()) : null);
      if (mapped) {
        focusedUser = {
          id: mapped.id,
          name: mapped.name,
          email: mapped.email,
          roles: mapped.roles,
          activity: recentActivity.filter((a) => a.userId === mapped.id),
          aiUsage: aiSnap.docs
            .filter((d) => String(d.data()?.userId || "") === mapped.id)
            .map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                operation: String(data.operation || "unknown"),
                createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
                success: Boolean(data.success),
              };
            }),
        };
        if (focusedUser.activity.length === 0) {
          const userEvents = await db
            .collection("analyticsEvents")
            .where("userId", "==", mapped.id)
            .limit(40)
            .get()
            .catch(() => null);
          if (userEvents) {
            focusedUser.activity = userEvents.docs.map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                name: String(data.name || "event"),
                userId: mapped.id,
                props: (data.props as Record<string, unknown> | null) ?? null,
                createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
              };
            });
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
    // Also sample more users for location breakdown when possible
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

    return jsonOk({
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
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    console.error(e);
    return jsonError("Unable to load admin data", 500);
  }
}

/** Admin mutations — suspend / unsuspend / set roles. Never trust client role claims alone. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Admin backend unavailable", 503);
    }

    const allowed = await consumeAdminMutationQuota(session.user.id);
    if (!allowed) {
      return jsonError("Admin mutation rate limit exceeded. Try again later.", 429);
    }

    const body = await readJsonBody(req);
    const parsed = adminMutationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid admin action", 400);
    }

    const adminId = session.user.id;
    const { action } = parsed.data;

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
      return jsonOk({ ok: true, seeded: JOB_SEED_CATALOG.length });
    }

    const id = "id" in parsed.data ? parsed.data.id : "";
    if (!id) return jsonError("Invalid admin action", 400);

    if (id === adminId && (action === "suspend_user" || action === "set_roles" || action === "revoke_recruiter" || action === "revoke_mentor")) {
      return jsonError("You cannot modify your own admin account this way", 400);
    }

    const ref = getAdminDb().collection(USERS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("User not found", 404);
    const target = mapUserDoc(snap.id, snap.data());
    if (!target) return jsonError("User not found", 404);

    const now = new Date().toISOString();

    if (action === "suspend_user") {
      await ref.set({ suspendedAt: now, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, suspendedAt: now });
    }

    if (action === "unsuspend_user") {
      await ref.set({ suspendedAt: null, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, suspendedAt: null });
    }

    if (action === "approve_recruiter") {
      if (target.recruiterApproved) return jsonOk({ ok: true, id, recruiterApproved: true, idempotent: true });
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
      return jsonOk({ ok: true, id, recruiterApproved: true });
    }

    if (action === "revoke_recruiter") {
      await ref.set({ recruiterApproved: false, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, recruiterApproved: false });
    }

    if (action === "approve_mentor") {
      if (target.mentorApproved) return jsonOk({ ok: true, id, mentorApproved: true, idempotent: true });
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
      return jsonOk({ ok: true, id, mentorApproved: true });
    }

    if (action === "revoke_mentor") {
      const roles = (mapUserDoc(snap.id, snap.data())?.roles ?? []).filter((role) => role !== "MENTOR");
      await ref.set({ roles, mentorApproved: false, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, mentorApproved: false });
    }

    if (action !== "set_roles") return jsonError("Invalid admin action", 400);

    // set_roles
    const roles = parsed.data.roles.filter(isRoleName) as RoleName[];
    if (!roles.length) return jsonError("At least one valid role required", 400);
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
        return jsonError("Cannot remove the last PLATFORM_ADMIN", 400);
      }
    }
    await ref.set({ roles, updatedAt: now }, { merge: true });
    return jsonOk({ ok: true, id, roles });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    console.error(e);
    return jsonError("Unable to update", 500);
  }
}

/** Legacy PATCH kept for compatibility — same as POST. */
export async function PATCH(req: Request) {
  return POST(req);
}
