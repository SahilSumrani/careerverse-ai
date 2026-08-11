import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate community posts to Firestore. */
export async function GET() {
  try {
    return jsonOk({ items: [], total: 0, page: 1, pageSize: 20 });
  } catch {
    return jsonError("Unable to load community", 500);
  }
}

export async function POST() {
  try {
    await requireSession();
    return jsonError("Community is migrating to Firestore — posting unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create post", 500);
  }
}

export async function PATCH() {
  try {
    await requireSession();
    return jsonError("Community is migrating to Firestore — reactions unavailable for now", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update post", 500);
  }
}
