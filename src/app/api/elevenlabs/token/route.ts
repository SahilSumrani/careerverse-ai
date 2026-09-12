import { NextResponse } from "next/server";

export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("ElevenLabs token error:", res.status, text);
      return NextResponse.json(
        { error: `ElevenLabs error: ${res.status} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // data.token is the signed conversation token
    return NextResponse.json({ token: data.token });
  } catch (err: any) {
    console.error("Token fetch failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
