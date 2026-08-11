import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { DUMMY_JOBS } from "@/data/jobs";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

const STATUSES = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

type AppStatus = (typeof STATUSES)[number];

function demoApplications(userId: string) {
  return DUMMY_JOBS.slice(0, 3).map((job, i) => ({
    id: `demo-app-${userId}-${job.id}`,
    userId,
    status: (["SAVED", "PREPARING", "APPLIED"] as const)[i] || "SAVED",
    notes: null as string | null,
    nextAction:
      i === 0 ? "Tailor resume for this role" : i === 1 ? "Draft cover note" : "Follow up in 5 days",
    matchScore: 72 - i * 4,
    updatedAt: new Date().toISOString(),
    opportunity: {
      id: job.id,
      title: job.title,
      organizationName: job.company,
      type: job.type,
      isDemo: true,
    },
    isDemo: true,
  }));
}

async function listFromFirestore(userId: string) {
  if (!hasFirebaseAdminCredentials()) return null;
  try {
    const snap = await getAdminDb()
      .collection("applications")
      .where("userId", "==", userId)
      .limit(50)
      .get();
    if (snap.empty) return [];
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId,
        status: (STATUSES.includes(data.status) ? data.status : "SAVED") as AppStatus,
        notes: (data.notes as string | null) ?? null,
        nextAction: (data.nextAction as string | null) ?? null,
        matchScore: data.matchScore == null ? null : Number(data.matchScore),
        updatedAt: (data.updatedAt as string) || new Date().toISOString(),
        opportunity: data.opportunity || {
          id: data.opportunityId || d.id,
          title: data.title || "Opportunity",
          organizationName: data.organizationName || null,
          type: data.type || "Full-time",
          isDemo: Boolean(data.isDemo),
        },
        isDemo: Boolean(data.isDemo),
      };
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const fromFs = await listFromFirestore(session.user.id);
    if (fromFs && fromFs.length) {
      return jsonOk({ items: fromFs, demo: false, source: "firestore" });
    }
    // Seed demo docs once when collection empty and Admin available
    if (fromFs && fromFs.length === 0 && hasFirebaseAdminCredentials()) {
      const demos = demoApplications(session.user.id);
      try {
        const db = getAdminDb();
        const batch = db.batch();
        for (const app of demos) {
          const ref = db.collection("applications").doc(app.id);
          batch.set(ref, app, { merge: true });
        }
        await batch.commit();
        return jsonOk({ items: demos, demo: true, source: "firestore-seed" });
      } catch {
        // fall through to local demo
      }
    }
    return jsonOk({ items: demoApplications(session.user.id), demo: true, source: "local-demo" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load applications", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const opportunity = body.opportunity || {
      id: body.opportunityId || `opp-${Date.now()}`,
      title: body.title || "Saved opportunity",
      organizationName: body.organizationName || null,
      type: body.type || "Full-time",
      isDemo: true,
    };
    const now = new Date().toISOString();
    const payload = {
      userId: session.user.id,
      status: "SAVED" as AppStatus,
      notes: body.notes ?? null,
      nextAction: body.nextAction ?? "Review JD and tailor resume",
      matchScore: body.matchScore ?? null,
      updatedAt: now,
      createdAt: now,
      opportunity,
      isDemo: Boolean(opportunity.isDemo),
    };

    if (hasFirebaseAdminCredentials()) {
      const ref = await getAdminDb().collection("applications").add(payload);
      return jsonOk({ application: { id: ref.id, ...payload }, source: "firestore" });
    }
    return jsonOk({
      application: { id: `local-${Date.now()}`, ...payload },
      source: "local",
      note: "Persisted in client localStorage only until Firebase Admin is configured.",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create application", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const nextStatus = String(body.status || "SAVED");
    if (!id) return jsonError("Application id required", 400);
    if (!STATUSES.includes(nextStatus as AppStatus)) return jsonError("Invalid status", 400);

    const updatedAt = new Date().toISOString();
    if (hasFirebaseAdminCredentials()) {
      const ref = getAdminDb().collection("applications").doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() || {};
        if (data.userId && data.userId !== session.user.id) {
          return jsonError("Forbidden", 403);
        }
        await ref.set(
          {
            status: nextStatus,
            notes: body.notes ?? data.notes ?? null,
            nextAction: body.nextAction ?? data.nextAction ?? null,
            updatedAt,
          },
          { merge: true },
        );
        return jsonOk({
          application: {
            id,
            ...data,
            status: nextStatus,
            notes: body.notes ?? data.notes ?? null,
            nextAction: body.nextAction ?? data.nextAction ?? null,
            updatedAt,
          },
          source: "firestore",
        });
      }
    }

    const demo = demoApplications(session.user.id).find((a) => a.id === id);
    if (!demo) {
      return jsonOk({
        application: {
          id,
          status: nextStatus,
          notes: body.notes ?? null,
          nextAction: body.nextAction ?? null,
          updatedAt,
          opportunity: { id, title: "Application", organizationName: null, type: "Full-time", isDemo: true },
        },
        source: "local",
      });
    }
    return jsonOk({
      application: {
        ...demo,
        status: nextStatus,
        notes: body.notes ?? demo.notes,
        nextAction: body.nextAction ?? demo.nextAction,
        updatedAt,
      },
      source: hasFirebaseAdminCredentials() ? "firestore-upsert" : "local-demo",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update application", 500);
  }
}
