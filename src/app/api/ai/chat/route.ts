import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

/** Light per-user daily Copilot message cap (Firestore counter). */
const DAILY_CHAT_CAP = 40;

async function consumeChatQuota(userId: string): Promise<{ ok: boolean; remaining: number }> {
  if (!hasFirebaseAdminCredentials()) {
    // ponytail: no Admin → skip quota; enforce when Firestore is available
    return { ok: true, remaining: DAILY_CHAT_CAP };
  }
  const day = new Date().toISOString().slice(0, 10);
  const ref = getAdminDb().collection("users").doc(userId).collection("rateLimits").doc("aiChat");
  try {
    const result = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const count = data.day === day ? Number(data.count || 0) : 0;
      if (count >= DAILY_CHAT_CAP) {
        return { ok: false, remaining: 0 };
      }
      tx.set(ref, { day, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
      return { ok: true, remaining: DAILY_CHAT_CAP - count - 1 };
    });
    return result;
  } catch {
    return { ok: true, remaining: DAILY_CHAT_CAP };
  }
}

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

    const quota = await consumeChatQuota(session.user.id);
    if (!quota.ok) {
      return jsonError(
        `Daily Copilot limit reached (${DAILY_CHAT_CAP}/day). Come back tomorrow, or use Roadmaps / Career Intelligence meanwhile.`,
        429,
        { remaining: 0, limit: DAILY_CHAT_CAP },
      );
    }

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
    return jsonOk({
      reply: result.reply,
      usedProfile: Boolean(ctx),
      remaining: quota.remaining,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to chat", 500);
  }
}
