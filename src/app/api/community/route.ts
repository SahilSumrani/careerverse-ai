import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { SEED_POSTS } from "@/lib/seed-data";

async function listPosts(category?: string | null) {
  if (hasFirebaseAdminCredentials()) {
    try {
      const snap = await getAdminDb().collection("posts").limit(40).get();
      if (!snap.empty) {
        let items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? null,
            content: String(data.content || ""),
            category: String(data.category || "GENERAL"),
            isDemo: Boolean(data.isDemo),
            createdAt: String(data.createdAt || new Date().toISOString()),
            author: data.author || { id: data.authorId || "unknown", name: data.authorName || "Member", image: null },
            _count: data._count || { comments: 0, reactions: Number(data.reactions || 0) },
          };
        });
        items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        if (category) items = items.filter((p) => p.category === category);
        return { items, source: "firestore" as const };
      }
    } catch {
      // fall through to seed
    }
  }
  const items = category ? SEED_POSTS.filter((p) => p.category === category) : SEED_POSTS;
  return { items, source: "seed" as const };
}

export async function GET(req: Request) {
  try {
    const category = new URL(req.url).searchParams.get("category");
    const { items, source } = await listPosts(category);
    // Auto-seed Firestore once when empty
    if (source === "seed" && hasFirebaseAdminCredentials()) {
      try {
        const db = getAdminDb();
        const batch = db.batch();
        for (const p of SEED_POSTS) {
          batch.set(db.collection("posts").doc(p.id), p, { merge: true });
        }
        await batch.commit();
      } catch {
        // ignore seed failures
      }
    }
    return jsonOk({ items, total: items.length, page: 1, pageSize: 20, source });
  } catch {
    return jsonError("Unable to load community", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const content = String(body.content || "").trim();
    if (!content) return jsonError("Content required", 400);
    const now = new Date().toISOString();
    const post = {
      title: body.title ? String(body.title).slice(0, 120) : null,
      content: content.slice(0, 4000),
      category: String(body.category || "GENERAL"),
      isDemo: false,
      createdAt: now,
      author: {
        id: session.user.id,
        name: session.user.name || "You",
        image: session.user.image || null,
      },
      authorId: session.user.id,
      _count: { comments: 0, reactions: 0 },
    };

    if (hasFirebaseAdminCredentials()) {
      const ref = await getAdminDb().collection("posts").add(post);
      return jsonOk({ post: { id: ref.id, ...post } });
    }
    return jsonOk({
      post: { id: `local-post-${Date.now()}`, ...post },
      note: "Saved locally in response only — configure Firebase Admin for persistence.",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create post", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) return jsonError("Post id required", 400);

    if (hasFirebaseAdminCredentials()) {
      const ref = getAdminDb().collection("posts").doc(id);
      const snap = await ref.get();
      if (!snap.exists) return jsonError("Post not found", 404);
      const data = snap.data() || {};
      const reactions = Number(data._count?.reactions || data.reactions || 0) + 1;
      await ref.set(
        {
          reactions,
          _count: { ...(data._count || {}), reactions, comments: data._count?.comments || 0 },
          updatedAt: new Date().toISOString(),
          lastReactorId: session.user.id,
        },
        { merge: true },
      );
      return jsonOk({ ok: true, reactions });
    }
    return jsonOk({ ok: true, reactions: 1 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update post", 500);
  }
}
