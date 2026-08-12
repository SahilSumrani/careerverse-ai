export async function createNotification(input: {
  userId: string;
  type:
    | "APPLICATION_UPDATE"
    | "EVENT_REGISTRATION"
    | "CONNECTION_REQUEST"
    | "APPROVAL_UPDATE"
    | "OPPORTUNITY_ALERT"
    | "COMMUNITY_ACTIVITY"
    | "SYSTEM";
  title: string;
  body: string;
  href?: string;
}) {
  try {
    const { hasFirebaseAdminCredentials, getAdminDb } = await import("@/lib/firebase-admin");
    if (!hasFirebaseAdminCredentials()) return { id: "local", ...input };
    const ref = await getAdminDb().collection("notifications").add({
      ...input,
      isDemo: false,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...input };
  } catch {
    return { id: "local", ...input };
  }
}

export async function audit(input: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const { hasFirebaseAdminCredentials, getAdminDb } = await import("@/lib/firebase-admin");
    if (!hasFirebaseAdminCredentials()) return;
    await getAdminDb()
      .collection("auditLogs")
      .add({
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        meta: input.meta ?? null,
        createdAt: new Date().toISOString(),
      });
  } catch {
    // non-blocking
  }
}
