/**
 * Generic OpenAI / Groq / OpenRouter compatible LLM provider client.
 */

export async function callOpenAICompatible(
  system: string,
  user: string,
  opts?: { maxTokens?: number },
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const maxTokens = opts?.maxTokens ?? Number(process.env.AI_MAX_TOKENS || 1200);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    await trackUsage("llm", model, data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0, true);
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    await trackUsage("llm", model, 0, 0, false);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function trackUsage(
  operation: string,
  model: string | null,
  tokensIn: number,
  tokensOut: number,
  success: boolean,
  userId?: string,
) {
  if (process.env.NODE_ENV === "test") return;
  try {
    const { hasFirebaseAdminCredentials, getAdminDb } = await import("@/lib/firebase-admin");
    if (!hasFirebaseAdminCredentials()) return;
    await getAdminDb()
      .collection("aiUsage")
      .add({
        operation,
        model: model ?? null,
        tokensIn,
        tokensOut,
        success,
        userId: userId ?? null,
        createdAt: new Date().toISOString(),
      });
  } catch {
    // non-blocking — Admin SDK optional at build / local without creds
  }
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}
