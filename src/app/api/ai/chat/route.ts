import { aiChatSchema } from "@/lib/validators";
import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = aiChatSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid message", 400);

    const recent = await prisma.aiUsage.count({
      where: {
        userId: session.user.id,
        operation: "chat",
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });
    if (recent > 20) return jsonError("Too many Copilot requests. Please wait a moment.", 429);

    const ctx = await getCareerContext(session.user.id);
    const result = await aiService.chat({ message: parsed.data.message, ctx: ctx ?? undefined });
    await prisma.aiUsage.create({
      data: {
        userId: session.user.id,
        operation: "chat",
        model: process.env.AI_MODEL || "fallback",
        success: true,
      },
    });
    return jsonOk(result);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Copilot unavailable", 500);
  }
}
