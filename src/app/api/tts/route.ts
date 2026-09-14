import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, lang = "en" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const cleanText = text.trim().slice(0, 1000);
    const voice = lang === "hi" ? "hi-IN-SwaraNeural" : "en-US-AriaNeural";

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("close", () => resolve());
      audioStream.on("error", (err: any) => reject(err));
    });

    try {
      tts.close();
    } catch {}

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: "Failed to generate realistic speech" }, { status: 500 });
  }
}
