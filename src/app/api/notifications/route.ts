import type { DocumentReference } from "firebase-admin/firestore";
import { jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
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

/** Legacy seed payloads written by seedIfEmpty — never surface these. */
function isSeedOrDemoNotif(id: string, data: Record<string, unknown>): boolean {
  if (data.isDemo === true) return true;
  if (id.startsWith("seed-notif") || id.startsWith("demo-notif") || id.startsWith("demo-")) return true;
  const title = String(data.title || "");
  const body = String(data.body || "");
  if (/^new job match\b/i.test(title) && /junior frontend/i.test(`${title} ${body}`)) return true;
  if (/^resume uploaded$/i.test(title) && /resume intelligence/i.test(body)) return true;
  if (/^onboarding complete$/i.test(title) && /career intelligence and matching/i.test(body)) return true;
  return false;
}

function mapDoc(id: string, data: Record<string, unknown>, userId: string): Notif | null {
  if (isSeedOrDemoNotif(id, data)) return null;
  return {
    id,
    type: String(data.type || "SYSTEM"),
    title: String(data.title || "Notification"),
    body: String(data.body || ""),
    href: data.href ? String(data.href) : undefined,
    read: Boolean(data.read),
    createdAt: String(data.createdAt || new Date().toISOString()),
    userId,
    isDemo: false,
  };
}

/** Best-effort delete of leftover seed docs so they disappear permanently. */
async function purgeSeedDocs(refs: DocumentReference[]) {
  if (!refs.length || !hasFirebaseAdminCredentials()) return;
  try {
    const batch = getAdminDb().batch();
    refs.slice(0, 40).forEach((ref) => batch.delete(ref));
    await batch.commit();
  } catch {
    // non-blocking
  }
}

async function listForUser(userId: string): Promise<Notif[]> {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    const db = getAdminDb();
    const sub = await db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(40)
      .get();

    if (!sub.empty) {
      const purge: DocumentReference[] = [];
      const items = sub.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          if (isSeedOrDemoNotif(d.id, data)) {
            purge.push(d.ref);
            return null;
          }
          return mapDoc(d.id, data, userId);
        })
        .filter(Boolean) as Notif[];
      void purgeSeedDocs(purge);
      return items;
    }

    const top = await db.collection("notifications").where("userId", "==", userId).limit(40).get();
    const purge: DocumentReference[] = [];
    const items = top.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        if (isSeedOrDemoNotif(d.id, data)) {
          purge.push(d.ref);
          return null;
        }
        return mapDoc(d.id, data, userId);
      })
      .filter(Boolean) as Notif[];
    void purgeSeedDocs(purge);
    return items;
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
    const body = (await readJsonBody(req)) as Record<string, unknown> | null;
    const id = body?.id ? String(body.id) : "";
    const markAll = body?.markAll === true;

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

    if (!id || id.length > 128) return jsonError("Notification id required", 400);
    if (id.startsWith("seed-notif") || id.startsWith("demo-")) {
      await sub.doc(id).delete().catch(() => undefined);
      return jsonOk({ ok: true });
    }
    const subRef = sub.doc(id);
    const topRef = getAdminDb().collection("notifications").doc(id);
    const [ownedSub, top] = await Promise.all([subRef.get(), topRef.get()]);
    const ownsTop = top.exists && top.data()?.userId === session.user.id;
    if (!ownedSub.exists && !ownsTop) return jsonError("Notification not found", 404);
    if (ownedSub.exists) await subRef.set({ read: true }, { merge: true });
    if (ownsTop) {
      await topRef.set({ read: true }, { merge: true });
    }
    return jsonOk({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to update notifications", 500);
  }
}
