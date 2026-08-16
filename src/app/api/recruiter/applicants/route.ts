import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { getUserById } from "@/lib/firestore-users";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

const APPLICANT_STATUSES = new Set(["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]);

/** Applicants for jobs created by this recruiter (or all for PLATFORM_ADMIN). */
export async function GET() {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.OPPORTUNITY_CREATE);
    const user = await getUserById(session.user.id);
    const isAdmin = user?.roles.includes("PLATFORM_ADMIN");
    if (!isAdmin && !user?.recruiterApproved) {
      return jsonError("Recruiter inbox requires admin approval", 403);
    }
    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({ items: [], source: "unconfigured" });
    }

    const db = getAdminDb();
    let jobIds: string[] = [];
    if (isAdmin) {
      const jobs = await db.collection("jobs").limit(100).get();
      jobIds = jobs.docs.map((d) => d.id);
    } else {
      const jobs = await db.collection("jobs").where("createdBy", "==", session.user.id).limit(50).get();
      jobIds = jobs.docs.map((d) => d.id);
    }

    if (!jobIds.length) return jsonOk({ items: [], source: "firestore" });

    // Firestore 'in' supports max 10 — batch
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
          updatedAt: data.updatedAt,
          matchScore: data.matchScore ?? null,
        });
      }
    }

    items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    const visible = items.slice(0, 80);
    const userIds = Array.from(new Set(visible.map((item) => String(item.userId || "")).filter(Boolean)));
    const users = new Map<string, { name: string | null; email: string | null }>();
    if (userIds.length) {
      const userSnaps = await db.getAll(...userIds.map((id) => db.collection("users").doc(id)));
      for (const snap of userSnaps) {
        const data = snap.data();
        users.set(snap.id, {
          name: typeof data?.name === "string" ? data.name : null,
          email: typeof data?.email === "string" ? data.email : null,
        });
      }
    }
    return jsonOk({
      items: visible.map((item) => ({ ...item, applicant: users.get(String(item.userId || "")) ?? null })),
      source: "firestore",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    return jsonError("Unable to load applicants", 500);
  }
}
