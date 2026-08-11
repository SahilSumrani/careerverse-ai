import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate approvals to Firestore. */
export async function GET() {
  try {
    await requireSession();
    return jsonOk({ items: [], institutions: [] });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load approvals", 500);
  }
}

export async function POST() {
  try {
    await requireSession();
    return jsonError("Approvals are migrating to Firestore", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create approval", 500);
  }
}
