import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

/** TODO: rebuild admin console on Firestore. */
export async function GET() {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);
    return jsonOk({
      counts: { users: 0, opportunities: 0, events: 0, openReports: 0, pendingApprovals: 0 },
      recentUsers: [],
      pendingOpps: [],
      pendingApprovals: [],
      aiUsage: [],
      analytics: [],
      note: "Admin metrics pending Firestore migration",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    return jsonError("Unable to load admin data", 500);
  }
}

export async function PATCH() {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);
    return jsonError("Admin mutations pending Firestore migration", 503);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    return jsonError("Unable to update", 500);
  }
}
