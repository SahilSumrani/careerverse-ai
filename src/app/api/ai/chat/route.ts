import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

/** AI chat grounded in Firestore profile (+ heuristics when AI_API_KEY is unset). */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = (await req.json()) as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      prefill?: string;
    };
    const message = (body.message || body.prefill || "").trim();
    if (!message) return jsonError("Message required", 400);

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim(),
          )
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
      : undefined;

    const ctx = await getCareerContext(session.user.id);
    const result = await aiService.chat({
      message,
      history,
      ctx: ctx ?? undefined,
    });
    return jsonOk({ reply: result.reply, usedProfile: Boolean(ctx) });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to chat", 500);
  }
}
