import { jsonError, jsonOk, requireSession } from "@/lib/api";

/** TODO: migrate notifications to Firestore queries. */
export async function GET() {
  try {
    await requireSession();
    return jsonOk({ items: [] });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load notifications", 500);
  }
}

export async function PATCH() {
  try {
    await requireSession();
    return jsonOk({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update notifications", 500);
  }
}
