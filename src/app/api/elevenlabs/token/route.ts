import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";

const VOICE_SESSION_DAILY_CAP = 25;
const VOICE_GUEST_HOURLY_CAP = 6;

export async function GET(req: NextRequest) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs credentials not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID and ELEVENLABS_API_KEY." },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    // Session check or guest IP throttling to prevent quota theft
    const session = await auth();
    if (session?.user?.id) {
      const quota = await consumeDailyQuota(session.user.id, "voiceToken", VOICE_SESSION_DAILY_CAP);
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily voice conversation limit reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else {
      // Guest protection via IP sliding window
      const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = (forwarded || req.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
      const hour = new Date().toISOString().slice(0, 13);
      const allowed = await consumeWindowQuota("voice-guest-ip", ip, VOICE_GUEST_HOURLY_CAP, hour);
      if (!allowed) {
        return NextResponse.json(
          { error: "Guest voice limit reached for this hour. Please sign in for higher limits." },
          { status: 429 }
        );
      }
    }
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("ElevenLabs token error:", res.status, text);

      if (res.status === 401) {
        return NextResponse.json(
          { error: "ElevenLabs API key is missing 'convai_write' permission." },
          { status: 401 }
        );
      }

      if (res.status === 404) {
        return NextResponse.json(
          { error: "ElevenLabs Agent not found. Check NEXT_PUBLIC_ELEVENLABS_AGENT_ID in env vars." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `ElevenLabs upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to voice service";
    console.error("Token fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
