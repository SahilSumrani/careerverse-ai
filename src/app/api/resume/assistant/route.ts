import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ASSISTANT_SESSION_DAILY_CAP = 60;
const ASSISTANT_GUEST_HOURLY_CAP = 25;
const MAX_TRANSCRIPT_CHARS = 2000;
const MAX_STATE_CHARS = 65536;

export async function POST(req: NextRequest) {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!GROQ_API_KEY && !OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Resume assistant is not configured. Missing API key." },
        { status: 500 }
      );
    }

    // Rate limiting
    const session = await auth();
    if (session?.user?.id) {
      const quota = await consumeDailyQuota(session.user.id, "resumeAssistant", ASSISTANT_SESSION_DAILY_CAP, { failOpen: true });
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily voice assistant limit reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else if (hasFirebaseAdminCredentials()) {
      const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const rawIp = forwarded || req.headers.get("x-real-ip") || "unknown";
      const ip = rawIp.slice(0, 128).replace(/[/:.]/g, "_");
      const hour = new Date().toISOString().slice(0, 13);
      const allowed = await consumeWindowQuota("resume-assistant-guest-ip", ip, ASSISTANT_GUEST_HOURLY_CAP, hour);
      if (allowed === false) {
        return NextResponse.json(
          { error: "Guest assistant limit reached for this hour. Please sign in to continue." },
          { status: 429 }
        );
      }
    }

    const { transcript, resumeState, lang = "en" } = await req.json();

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

    const isHindi = lang === "hi" || /[\u0900-\u097F]/.test(transcript) || /mera|karo|banao|badlo|daalo|add|hatao/i.test(transcript);

    const systemPrompt = `
You are CareerVerse AI Resume Co-Pilot, an elite career mentor specializing in helping students, interns, and early-career job seekers craft winning resumes.

Your capabilities:
1. Student Guidance: Help students turn weak phrases into powerful, metric-driven achievements using action verbs (e.g., "Assisted in website" -> "Developed responsive web pages using React and Next.js, enhancing page load speed by 25%").
2. Summary Optimization: Craft targeted, impactful summaries for students seeking internships or entry-level roles.
3. Skill Enhancement: When students mention their tech stack (e.g., "add fullstack web dev"), categorize and add clean, relevant skills across languages, frameworks, and tools.
4. Clean Text: DO NOT include markdown asterisks (like **text**) in outputs; return clean, properly capitalized text.
5. Conversational Voice Reply: Return a natural, encouraging voice response in ${isHindi ? "Hinglish/Hindi" : "English"} (1-2 sentences max) so the text-to-speech engine speaks it clearly to the student.

Current Resume State:
${stateSerialized}

User Request:
"${transcript.trim()}"

Return JSON matching this exact structure only (no markdown code blocks):
{
  "updatedResume": { ...the entire updated resume state object... },
  "aiResponse": "Short conversational response to speak aloud to the student."
}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    let apiKey = GROQ_API_KEY;
    let modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

    // Fallback to OpenRouter if Groq key isn't provided
    if (!GROQ_API_KEY && OPENROUTER_API_KEY) {
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      apiKey = OPENROUTER_API_KEY;
      modelName = "google/gemini-2.5-flash";
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Please update my resume based on this command: "${transcript.trim()}"` }
          ],
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq/LLM API error:", response.status, errText);
        // Fallback to OpenRouter if Groq call failed
        if (apiUrl.includes("groq.com") && OPENROUTER_API_KEY) {
          const fbRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://careerverse.ai",
              "X-Title": "CareerVerse",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: transcript.trim() }
              ],
              max_tokens: 2500,
            }),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            let fbText = fbData.choices?.[0]?.message?.content || "";
            fbText = fbText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
            const parsed = JSON.parse(fbText);
            return NextResponse.json({ success: true, data: parsed });
          }
        }
        return NextResponse.json({ error: "Failed to process command with AI assistant" }, { status: 502 });
      }

      const data = await response.json();
      let aiText = data.choices?.[0]?.message?.content || "";
      aiText = aiText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

      const jsonStart = aiText.indexOf("{");
      const jsonEnd = aiText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiText = aiText.slice(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(aiText);
      return NextResponse.json({ success: true, data: parsed });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error("Resume assistant error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
