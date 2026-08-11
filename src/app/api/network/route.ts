import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate network graph to Firestore. */
export async function GET() {
  try {
    await requireSession();
    return jsonOk({ connections: [], requests: [], suggestions: [] });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load network", 500);
  }
}

export async function POST() {
  try {
    await requireSession();
    return jsonError("Network is migrating to Firestore — unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update network", 500);
  }
}

export async function PATCH() {
  return POST();
}
