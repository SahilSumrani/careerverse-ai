import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { postSchema } from "@/lib/validators";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 10;
    const where = category ? { category: category as never } : {};
    const [total, items] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return jsonOk({ items, total, page, pageSize });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to load community", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid post", 400);
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
      },
    });
    await trackAnalytics("post_created", session.user.id, { category: parsed.data.category });
    return jsonOk({ post });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create post", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const postId = String(body.postId || "");
    const action = String(body.action || "");
    if (!postId) return jsonError("postId required", 400);

    if (action === "react") {
      await prisma.reaction.upsert({
        where: { postId_userId_type: { postId, userId: session.user.id, type: "like" } },
        update: {},
        create: { postId, userId: session.user.id, type: "like" },
      });
      return jsonOk({ ok: true });
    }
    if (action === "comment") {
      const content = String(body.content || "").trim();
      if (content.length < 1) return jsonError("Comment required", 400);
      const comment = await prisma.comment.create({
        data: { postId, authorId: session.user.id, content },
      });
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId !== session.user.id) {
        await createNotification({
          userId: post.authorId,
          type: "COMMUNITY_ACTIVITY",
          title: "New comment on your post",
          body: content.slice(0, 120),
          href: "/community",
        });
      }
      return jsonOk({ comment });
    }
    return jsonError("Unknown action", 400);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update community item", 500);
  }
}
