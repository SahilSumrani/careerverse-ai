import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  isDemo?: boolean;
  userId?: string;
};

async function listForUser(userId: string): Promise<Notif[]> {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    // Prefer subcollection users/{uid}/notifications
    const sub = await getAdminDb()
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();
    if (!sub.empty) {
      return sub.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: String(data.type || "SYSTEM"),
          title: String(data.title || "Notification"),
          body: String(data.body || ""),
          href: data.href ? String(data.href) : undefined,
          read: Boolean(data.read),
          createdAt: String(data.createdAt || new Date().toISOString()),
          userId,
        };
      });
    }

    const top = await getAdminDb()
      .collection("notifications")
      .where("userId", "==", userId)
      .limit(30)
      .get();
    return top.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: String(data.type || "SYSTEM"),
        title: String(data.title || "Notification"),
        body: String(data.body || ""),
        href: data.href ? String(data.href) : undefined,
        read: Boolean(data.read),
        createdAt: String(data.createdAt || new Date().toISOString()),
        userId,
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const items = (await listForUser(session.user.id)).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return jsonOk({
      items,
      unread: items.filter((i) => !i.read).length,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load notifications", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const id = body.id ? String(body.id) : "";
    const markAll = Boolean(body.markAll);

    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({ ok: true, local: true });
    }

    const sub = getAdminDb().collection("users").doc(session.user.id).collection("notifications");
    if (markAll) {
      const snap = await sub.where("read", "==", false).limit(50).get();
      const batch = getAdminDb().batch();
      snap.docs.forEach((d) => batch.set(d.ref, { read: true }, { merge: true }));
      await batch.commit();
      return jsonOk({ ok: true });
    }

    if (!id) return jsonError("Notification id required", 400);
    await sub.doc(id).set({ read: true }, { merge: true });
    // Also try top-level collection
    try {
      await getAdminDb().collection("notifications").doc(id).set({ read: true }, { merge: true });
    } catch {
      // ignore
    }
    return jsonOk({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update notifications", 500);
  }
}
