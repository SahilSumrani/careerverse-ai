import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

/** AI chat without Prisma usage metering (Firestore analytics optional later). */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = (await req.json()) as { message?: string };
    const message = body.message?.trim();
    if (!message) return jsonError("Message required", 400);

    const ctx = await getCareerContext(session.user.id);
    const result = await aiService.chat({
      message,
      ctx: ctx ?? undefined,
    });
    return jsonOk({ reply: result.reply });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to chat", 500);
  }
}
