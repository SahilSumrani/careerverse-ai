import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate applications to Firestore. */
export async function GET() {
  try {
    await requireSession();
    return jsonOk({ items: [] });
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

export async function PATCH() {
  try {
    await requireSession();
    return jsonError("Applications are migrating to Firestore — tracking unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update application", 500);
  }
}
