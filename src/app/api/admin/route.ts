import { jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";
import { adminMutationSchema } from "@/lib/validators";
import {
  consumeAdminMutationQuota,
  executeAdminMutation,
  getAdminConsoleData,
} from "@/lib/services/admin-actions";

/** Platform admin console data from Firestore. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Admin backend unavailable", 503);
    }

    const data = await getAdminConsoleData(req.url);
    return jsonOk(data);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    console.error(e);
    return jsonError("Unable to load admin data", 500);
  }
}

/** Admin mutations — suspend / unsuspend / set roles. Never trust client role claims alone. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Admin backend unavailable", 503);
    }

    const allowed = await consumeAdminMutationQuota(session.user.id);
    if (!allowed) {
      return jsonError("Admin mutation rate limit exceeded. Try again later.", 429);
    }

    const body = await readJsonBody(req);
    const parsed = adminMutationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid admin action", 400);
    }

    const result = await executeAdminMutation(session.user.id, parsed.data);
    if (!result.success) {
      return jsonError(result.error || "Admin mutation failed", result.status || 400);
    }

    return jsonOk(result.data || { ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    console.error(e);
    return jsonError("Unable to update", 500);
  }
}

/** Legacy PATCH kept for compatibility — same as POST. */
export async function PATCH(req: Request) {
  return POST(req);
}
