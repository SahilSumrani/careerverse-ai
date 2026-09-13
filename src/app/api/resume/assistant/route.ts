import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";

const ASSISTANT_SESSION_DAILY_CAP = 60;
const ASSISTANT_GUEST_HOURLY_CAP = 15;
const MAX_TRANSCRIPT_CHARS = 2000;
const MAX_STATE_CHARS = 65536; // 64KB JSON limit

export async function POST(req: NextRequest) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Resume assistant is not configured. Missing OPENROUTER_API_KEY." },
        { status: 500 }
      );
    }

    // Session or guest IP rate-limiting to prevent OpenRouter token draining
    const session = await auth();
    if (session?.user?.id) {
      const quota = await consumeDailyQuota(session.user.id, "resumeAssistant", ASSISTANT_SESSION_DAILY_CAP);
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily voice assistant commands limit reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else {
      const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = (forwarded || req.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
      const hour = new Date().toISOString().slice(0, 13);
      const allowed = await consumeWindowQuota("resume-assistant-guest-ip", ip, ASSISTANT_GUEST_HOURLY_CAP, hour);
      if (!allowed) {
        return NextResponse.json(
          { error: "Guest assistant limit reached for this hour. Please sign in for higher limits." },
          { status: 429 }
        );
      }
    }

    const { transcript, resumeState } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        { error: `Transcript is too long (max ${MAX_TRANSCRIPT_CHARS} characters).` },
        { status: 400 }
      );
    }

    const stateSerialized = JSON.stringify(resumeState || {});
    if (stateSerialized.length > MAX_STATE_CHARS) {
      return NextResponse.json(
        { error: "Resume payload exceeds maximum allowable size." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert AI Resume Assistant. The user is talking to you to build their resume.
You have their current resume state (JSON) and their spoken command.

Your job is to:
1. Apply their command to the resume state. For example, if they say "Add my experience as a Software Engineer at Google from Jan 2020 to present", you add that to the "experience" array.
2. If they ask you to bold a keyword, add **keyword** syntax in the description.
3. Provide a very short, friendly, conversational response to say what you did (under 2 sentences) because this will be spoken back to them via Text-to-Speech.

Current Resume State:
${stateSerialized}

User Command:
"${transcript.trim()}"

You must return a JSON object with EXACTLY this structure, and nothing else (no markdown wrappers like \`\`\`json):
{
  "updatedResume": { ...the entire updated resume state object... },
  "aiResponse": "The conversational text to speak back to the user."
}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://careerverse.ai",
          "X-Title": "CareerVerse",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error:", response.status, errText);
        return NextResponse.json({ error: "Failed to process voice command with AI" }, { status: 502 });
      }

      const data = await response.json();
      let aiText = data.choices?.[0]?.message?.content || "";

      // Clean up potential markdown formatting
      aiText = aiText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

      const jsonStart = aiText.indexOf("{");
      const jsonEnd = aiText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiText = aiText.slice(jsonStart, jsonEnd + 1);
      }

      const result = JSON.parse(aiText);
      return NextResponse.json({ success: true, data: result });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error processing assistant command:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
