import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { mapUserDoc, USERS_COLLECTION } from "@/lib/firestore-users";
import { adminMutationSchema } from "@/lib/validators";
import { isRoleName, type RoleName } from "@/lib/roles";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { CHAT_INPUT_MAX_CHARS, DAILY_CHAT_CAP } from "@/lib/ai/chat-guard";

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
    return true;
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
export async function GET() {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({
        overview: { users: 0, applications: 0, opportunities: 0, aiEventsToday: 0 },
        recentUsers: [],
        locationBreakdown: [],
        aiUsage: [],
        chatLimits: { dailyCap: DAILY_CHAT_CAP, maxInputChars: CHAT_INPUT_MAX_CHARS },
        note: "Firebase Admin credentials required for live metrics.",
      });
    }

    const db = getAdminDb();
    const day = new Date().toISOString().slice(0, 10);

    const [usersCount, appsCount, jobsResult, usersSnap, aiSnap] = await Promise.all([
      safeCount(USERS_COLLECTION),
      safeCount("applications"),
      loadJobsFromFirestore(100),
      db.collection(USERS_COLLECTION).orderBy("createdAt", "desc").limit(40).get().catch(async () => {
        // Fallback if createdAt index/order missing
        return db.collection(USERS_COLLECTION).limit(40).get();
      }),
      db
        .collection("aiUsage")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get()
        .catch(async () => db.collection("aiUsage").limit(40).get()),
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
        preferredLocations: u.preferredLocations.slice(0, 5),
        createdAt: u.createdAt,
      }));

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
      chatLimits: { dailyCap: DAILY_CHAT_CAP, maxInputChars: CHAT_INPUT_MAX_CHARS },
      jobsSource: jobsResult.source,
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

    const body = await req.json().catch(() => null);
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
      const roles = new Set((mapUserDoc(snap.id, snap.data())?.roles ?? []) as string[]);
      roles.add("HR");
      await ref.set(
        { roles: Array.from(roles), recruiterApproved: true, updatedAt: now },
        { merge: true },
      );
      return jsonOk({ ok: true, id, recruiterApproved: true });
    }

    if (action === "revoke_recruiter") {
      await ref.set({ recruiterApproved: false, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, recruiterApproved: false });
    }

    if (action === "approve_mentor") {
      const roles = new Set((mapUserDoc(snap.id, snap.data())?.roles ?? []) as string[]);
      roles.add("MENTOR");
      await ref.set(
        { roles: Array.from(roles), mentorApproved: true, updatedAt: now },
        { merge: true },
      );
      return jsonOk({ ok: true, id, mentorApproved: true });
    }

    if (action === "revoke_mentor") {
      await ref.set({ mentorApproved: false, updatedAt: now }, { merge: true });
      return jsonOk({ ok: true, id, mentorApproved: false });
    }

    if (action !== "set_roles") return jsonError("Invalid admin action", 400);

    // set_roles
    const roles = parsed.data.roles.filter(isRoleName) as RoleName[];
    if (!roles.length) return jsonError("At least one valid role required", 400);
    const target = mapUserDoc(snap.id, snap.data());
    const wasAdmin = target?.roles.includes("PLATFORM_ADMIN");
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
    console.error(e);
    return jsonError("Unable to update", 500);
  }
}

/** Legacy PATCH kept for compatibility — same as POST. */
export async function PATCH(req: Request) {
  return POST(req);
}
