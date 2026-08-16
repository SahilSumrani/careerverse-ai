import { jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { applicationCreateSchema, applicationPatchSchema } from "@/lib/validators";
import { getJobById } from "@/lib/jobs-firestore";
import { consumeDailyQuota } from "@/lib/rate-limit";

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

const APP_MUTATION_DAILY_CAP = 60;

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
        if (data.userId && data.userId !== userId) return null;
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
    const body = await readJsonBody(req);
    const parsed = applicationCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid application payload", 400);

    const quota = await consumeDailyQuota(session.user.id, "applicationMutations", APP_MUTATION_DAILY_CAP);
    if (!quota.ok) return jsonError("Daily application limit reached", 429);

    const opportunityId = parsed.data.opportunityId || parsed.data.opportunity?.id;
    if (!opportunityId) return jsonError("opportunityId required", 400);
    const job = await getJobById(opportunityId);
    if (!job) return jsonError("Opportunity not found", 404);
    const opportunity = {
      id: job.id,
      title: job.title,
      organizationName: job.company,
      type: job.type,
      isDemo: false,
    };

    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Applications backend unavailable", 503);
    }

    // Deduplicate by userId + opportunityId
    const existing = await getAdminDb()
      .collection("applications")
      .where("userId", "==", session.user.id)
      .where("opportunityId", "==", opportunity.id)
      .limit(1)
      .get()
      .catch(() => null);

    if (existing && !existing.empty) {
      const doc = existing.docs[0];
      return jsonOk({
        application: { id: doc.id, ...doc.data() },
        source: "firestore",
        deduped: true,
      });
    }

    const now = new Date().toISOString();
    const payload = {
      userId: session.user.id,
      opportunityId: opportunity.id,
      status: "SAVED" as AppStatus,
      notes: parsed.data.notes ?? null,
      nextAction: parsed.data.nextAction ?? "Review JD and tailor resume",
      matchScore: parsed.data.matchScore ?? null,
      updatedAt: now,
      createdAt: now,
      opportunity,
      isDemo: false,
    };

    const ref = await getAdminDb().collection("applications").add(payload);
    return jsonOk({ application: { id: ref.id, ...payload }, source: "firestore" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to create application", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await readJsonBody(req);
    const parsed = applicationPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid application update", 400);

    const { id, status: nextStatus } = parsed.data;
    if (id.startsWith("demo-app-")) return jsonError("Demo applications are disabled", 400);

    const quota = await consumeDailyQuota(session.user.id, "applicationMutations", APP_MUTATION_DAILY_CAP);
    if (!quota.ok) return jsonError("Daily application limit reached", 429);

    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Applications backend unavailable", 503);
    }

    const updatedAt = new Date().toISOString();
    const ref = getAdminDb().collection("applications").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return jsonError("Application not found", 404);
    const data = snap.data() || {};
    if (!data.userId || data.userId !== session.user.id) {
      return jsonError("Forbidden", 403);
    }
    await ref.set(
      {
        status: nextStatus,
        notes: parsed.data.notes ?? data.notes ?? null,
        nextAction: parsed.data.nextAction ?? data.nextAction ?? null,
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
        notes: parsed.data.notes ?? data.notes ?? null,
        nextAction: parsed.data.nextAction ?? data.nextAction ?? null,
        updatedAt,
        isDemo: false,
      },
      source: "firestore",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to update application", 500);
  }
}
