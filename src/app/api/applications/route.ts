import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { DUMMY_JOBS } from "@/data/jobs";

/** Demo applications until Firestore tracking ships. */
function demoApplications() {
  return DUMMY_JOBS.slice(0, 3).map((job, i) => ({
    id: `demo-app-${job.id}`,
    status: (["SAVED", "PREPARING", "APPLIED"] as const)[i] || "SAVED",
    notes: null,
    nextAction: i === 0 ? "Tailor resume for this role" : i === 1 ? "Draft cover note" : "Follow up in 5 days",
    matchScore: 72 - i * 4,
    updatedAt: new Date().toISOString(),
    opportunity: {
      id: job.id,
      title: job.title,
      organizationName: job.company,
      type: job.type,
      isDemo: true,
    },
  }));
}

export async function GET() {
  try {
    await requireSession();
    return jsonOk({ items: demoApplications(), demo: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load applications", 500);
  }
}

export async function POST() {
  try {
    await requireSession();
    return jsonError("Applications are migrating to Firestore — tracking unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create application", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    const nextStatus = String(body.status || "SAVED");
    if (!id) return jsonError("Application id required", 400);
    const demo = demoApplications().find((a) => a.id === id);
    if (!demo) return jsonError("Application not found", 404);
    return jsonOk({
      application: {
        ...demo,
        status: nextStatus,
        notes: body.notes ?? demo.notes,
        nextAction: body.nextAction ?? demo.nextAction,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update application", 500);
  }
}
