import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireSession } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return jsonOk({ items });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load notifications", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    if (body.action === "mark_all_read") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return jsonOk({ ok: true });
    }
    const id = String(body.id || "");
    if (!id) return jsonError("id required", 400);
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { readAt: new Date() },
    });
    return jsonOk({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update notifications", 500);
  }
}
