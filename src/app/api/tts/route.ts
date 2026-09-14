import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { jsonError, requireSession } from "@/lib/api";
import { consumeDailyQuota } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TTS_DAILY_CAP = Number(process.env.TTS_DAILY_CAP || 20);

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const quota = await consumeDailyQuota(session.user.id, "tts", TTS_DAILY_CAP);
    if (!quota.ok) {
      return jsonError("Daily text-to-speech quota exceeded. Please try again tomorrow.", 429);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid request body", 400);
    }

    const { text, lang = "en" } = body as { text?: unknown; lang?: string };

    if (!text || typeof text !== "string") {
      return jsonError("No text provided", 400);
    }

    const cleanText = text.trim().slice(0, 1000);
    if (!cleanText) {
      return jsonError("Text cannot be empty", 400);
    }

    const voice = lang === "hi" ? "hi-IN-SwaraNeural" : "en-US-AriaNeural";

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("close", () => resolve());
      audioStream.on("error", (err: unknown) => reject(err));
    });

    try {
      tts.close();
    } catch {
      // ignore close errors
    }

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-cache, no-store",
        "X-RateLimit-Remaining": String(quota.remaining),
      },
    });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status ?? 500;
    if (status === 401) {
      return jsonError("Unauthorized", 401);
    }
    console.error("TTS API Error:", error);
    return jsonError("Failed to generate speech", 500);
  }
}
