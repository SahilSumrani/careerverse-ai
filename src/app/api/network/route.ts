import { prisma } from "@/lib/db";
import { connectionRequestSchema } from "@/lib/validators";
import { jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    const [sent, received, people] = await Promise.all([
      prisma.connection.findMany({
        where: { requesterId: session.user.id },
        include: { receiver: { include: { profile: true } } },
      }),
      prisma.connection.findMany({
        where: { receiverId: session.user.id },
        include: { requester: { include: { profile: true } } },
      }),
      prisma.user.findMany({
        where: {
          id: { not: session.user.id },
          suspendedAt: null,
          profile: { isNot: null },
        },
        include: { profile: true, roles: { include: { role: true } }, mentorProfile: true },
        take: 24,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return jsonOk({ sent, received, people });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load network", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const action = String(body.action || "connect");

    if (action === "connect") {
      const parsed = connectionRequestSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid connection request", 400);
      if (parsed.data.receiverId === session.user.id) return jsonError("Cannot connect to yourself", 400);
      const conn = await prisma.connection.upsert({
        where: {
          requesterId_receiverId: {
            requesterId: session.user.id,
            receiverId: parsed.data.receiverId,
          },
        },
        update: { status: "PENDING", message: parsed.data.message },
        create: {
          requesterId: session.user.id,
          receiverId: parsed.data.receiverId,
          message: parsed.data.message,
          status: "PENDING",
        },
      });
      await createNotification({
        userId: parsed.data.receiverId,
        type: "CONNECTION_REQUEST",
        title: "New connection request",
        body: `${session.user.name || "Someone"} wants to connect`,
        href: "/network",
      });
      await trackAnalytics("connection_requested", session.user.id);
      return jsonOk({ connection: conn });
    }

    if (action === "respond") {
      const id = String(body.id || "");
      const status = body.status === "ACCEPTED" ? "ACCEPTED" : body.status === "REJECTED" ? "REJECTED" : null;
      if (!id || !status) return jsonError("Invalid response", 400);
      const existing = await prisma.connection.findFirst({ where: { id, receiverId: session.user.id } });
      if (!existing) return jsonError("Not found", 404);
      const updated = await prisma.connection.update({ where: { id }, data: { status } });
      await createNotification({
        userId: existing.requesterId,
        type: "CONNECTION_REQUEST",
        title: status === "ACCEPTED" ? "Connection accepted" : "Connection declined",
        body: `${session.user.name || "User"} responded to your request`,
        href: "/network",
      });
      return jsonOk({ connection: updated });
    }

    if (action === "follow") {
      const followingId = String(body.followingId || "");
      if (!followingId) return jsonError("followingId required", 400);
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: session.user.id, followingId } },
        update: {},
        create: { followerId: session.user.id, followingId },
      });
      return jsonOk({ ok: true });
    }

    return jsonError("Unknown action", 400);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to update network", 500);
  }
}
