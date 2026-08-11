import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate events to Firestore. */
export async function GET() {
  return jsonOk({ items: [] });
}

export async function POST() {
  try {
    await requireSession();
    return jsonError("Events are migrating to Firestore — registration unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to register", 500);
  }
}
