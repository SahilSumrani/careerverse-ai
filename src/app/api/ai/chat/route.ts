import { getCareerContext, jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import {
  CHAT_INPUT_MAX_CHARS,
  DAILY_CHAT_CAP,
  isCareerChatOffTopic,
  OFF_TOPIC_REPLY,
} from "@/lib/ai/chat-guard";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { aiChatSchema } from "@/lib/validators";

async function peekChatQuota(userId: string): Promise<{ remaining: number; limit: number }> {
  if (!hasFirebaseAdminCredentials()) {
    return { remaining: DAILY_CHAT_CAP, limit: DAILY_CHAT_CAP };
  }
  const day = new Date().toISOString().slice(0, 10);
  const ref = getAdminDb().collection("users").doc(userId).collection("rateLimits").doc("aiChat");
  try {
    const snap = await ref.get();
    const data = snap.data() || {};
    const count = data.day === day ? Number(data.count || 0) : 0;
    return { remaining: Math.max(0, DAILY_CHAT_CAP - count), limit: DAILY_CHAT_CAP };
  } catch {
    return { remaining: DAILY_CHAT_CAP, limit: DAILY_CHAT_CAP };
  }
}

async function consumeChatQuota(userId: string): Promise<{ ok: boolean; remaining: number }> {
  if (!hasFirebaseAdminCredentials()) {
    // ponytail: no Admin → skip quota; enforce when Firestore is available
    return { ok: true, remaining: DAILY_CHAT_CAP };
  }
  const day = new Date().toISOString().slice(0, 10);
  const ref = getAdminDb().collection("users").doc(userId).collection("rateLimits").doc("aiChat");
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const count = data.day === day ? Number(data.count || 0) : 0;
      if (count >= DAILY_CHAT_CAP) {
        return { ok: false, remaining: 0 };
      }
      tx.set(ref, { day, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
      return { ok: true, remaining: DAILY_CHAT_CAP - count - 1 };
    });
  } catch {
    return { ok: false, remaining: 0 };
  }
}

/** Remaining daily Copilot messages (does not consume quota). */
export async function GET() {
  try {
    const session = await requireSession();
    const quota = await peekChatQuota(session.user.id);
    return jsonOk({
      remaining: quota.remaining,
      limit: quota.limit,
      maxInputChars: CHAT_INPUT_MAX_CHARS,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load chat quota", 500);
  }
}

/** AI chat grounded in Firestore profile (+ heuristics when AI_API_KEY is unset). */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = (await readJsonBody(req)) as Record<string, unknown> | null;
    const parsed = aiChatSchema.safeParse({
      message: typeof body?.message === "string" ? body.message : body?.prefill,
      history: body?.history,
    });
    if (!parsed.success) {
      return jsonError(
        `Message required (max ${CHAT_INPUT_MAX_CHARS} characters). Keep questions career-focused.`,
        400,
        { maxInputChars: CHAT_INPUT_MAX_CHARS },
      );
    }

    const message = parsed.data.message.trim();
    if (!message) return jsonError("Message required", 400);

    // Refuse off-topic before quota + LLM (saves tokens and daily cap).
    if (isCareerChatOffTopic(message)) {
      const quota = await peekChatQuota(session.user.id);
      return jsonOk({
        reply: OFF_TOPIC_REPLY,
        usedProfile: false,
        remaining: quota.remaining,
        limit: DAILY_CHAT_CAP,
        refused: true,
      });
    }

    const quota = await consumeChatQuota(session.user.id);
    if (!quota.ok) {
      return jsonError(
        `Daily Copilot limit reached (${DAILY_CHAT_CAP}/day). Come back tomorrow, or use Roadmaps / Career Intelligence meanwhile.`,
        429,
        { remaining: 0, limit: DAILY_CHAT_CAP },
      );
    }

    const history = Array.isArray(parsed.data.history)
      ? parsed.data.history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim(),
          )
          .slice(-8)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content.trim().slice(0, CHAT_INPUT_MAX_CHARS),
          }))
      : undefined;

    const ctx = await getCareerContext(session.user.id);
    const result = await aiService.chat({
      message,
      history,
      ctx: ctx ?? undefined,
    });
    return jsonOk({
      reply: result.reply,
      usedProfile: Boolean(ctx),
      remaining: quota.remaining,
      limit: DAILY_CHAT_CAP,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    console.error(e);
    return jsonError("Unable to chat", 500);
  }
}
