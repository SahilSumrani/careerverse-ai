import { jsonError, jsonOk, requireSession } from "@/lib/api";
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

function isDemoApp(id: string, data: Record<string, unknown>) {
  if (data.isDemo) return true;
  if (id.startsWith("demo-app-")) return true;
  const opp = data.opportunity as { isDemo?: boolean } | undefined;
  return Boolean(opp?.isDemo);
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
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        if (isDemoApp(d.id, data)) return null;
        return {
          id: d.id,
          userId,
          status: (STATUSES.includes(data.status as AppStatus) ? data.status : "SAVED") as AppStatus,
          notes: (data.notes as string | null) ?? null,
          nextAction: (data.nextAction as string | null) ?? null,
          matchScore: data.matchScore == null ? null : Number(data.matchScore),
          updatedAt: (data.updatedAt as string) || new Date().toISOString(),
          createdAt: (data.createdAt as string) || undefined,
          opportunity: data.opportunity || {
            id: data.opportunityId || d.id,
            title: data.title || "Opportunity",
            organizationName: data.organizationName || null,
            type: data.type || "Full-time",
            isDemo: false,
          },
          isDemo: false,
        };
      })
      .filter(Boolean);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const fromFs = await listFromFirestore(session.user.id);
    if (fromFs) {
      return jsonOk({ items: fromFs, demo: false, source: "firestore" });
    }
    return jsonOk({ items: [], demo: false, source: "unconfigured" });
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
      isDemo: false,
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
      opportunity: { ...opportunity, isDemo: false },
      isDemo: false,
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
    if (id.startsWith("demo-app-")) return jsonError("Demo applications are disabled", 400);

    const updatedAt = new Date().toISOString();
    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({
        application: {
          id,
          status: nextStatus,
          notes: body.notes ?? null,
          nextAction: body.nextAction ?? null,
          updatedAt,
        },
        source: "local",
      });
    }

    const ref = getAdminDb().collection("applications").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("Application not found", 404);
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
        isDemo: false,
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
        isDemo: false,
      },
      source: "firestore",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update application", 500);
  }
}
