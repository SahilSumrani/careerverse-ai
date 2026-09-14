import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ASSISTANT_SESSION_DAILY_CAP = 60;
const ASSISTANT_GUEST_HOURLY_CAP = 25;
const MAX_TRANSCRIPT_CHARS = 1500;

// Compact state payload to save tokens
function compactResumePayload(state: any) {
  if (!state || typeof state !== "object") return {};
  return {
    personalInfo: {
      fullName: state.personalInfo?.fullName || "",
      headline: state.personalInfo?.headline || "",
      email: state.personalInfo?.email || "",
      phone: state.personalInfo?.phone || "",
      location: state.personalInfo?.location || "",
      linkedin: state.personalInfo?.linkedin || "",
    },
    professionalSummary: state.professionalSummary || "",
    experience: (state.experience || []).map((e: any) => ({
      company: e.company || "",
      position: e.position || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      location: e.location || "",
      description: e.description || [],
    })),
    projects: (state.projects || []).map((p: any) => ({
      name: p.name || "",
      technologies: p.technologies || [],
      description: p.description || [],
    })),
    education: (state.education || []).map((ed: any) => ({
      institution: ed.institution || "",
      degree: ed.degree || "",
      startDate: ed.startDate || "",
      endDate: ed.endDate || "",
      score: ed.score || "",
    })),
    skills: {
      languages: state.skills?.languages || [],
      frameworks: state.skills?.frameworks || [],
      tools: state.skills?.tools || [],
    },
    keyAchievements: state.keyAchievements || [],
    trainingCourses: state.trainingCourses || [],
    languages: state.languages || [],
  };
}

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

    const cleanState = compactResumePayload(resumeState);
    const stateSerialized = JSON.stringify(cleanState);

    const systemPrompt = `
You are CareerVerse AI Resume Co-Pilot. STRICT LANGUAGE RULE: Speak and reply ONLY in clean, professional English. NEVER speak or reply in Hindi, even if the user speaks in Hindi.

Your Tasks:
1. Command Execution: Modify the resume state based on user instructions.
2. Full Optimization: If the user says "optimize", "improve", "make it better", or "review", perform full professional ATS optimization:
   - Rewrite professionalSummary to be concise, impactful, and tailored to modern entry-level / intern / student hiring standards.
   - Upgrade experience and project bullets: start with high-impact action verbs (Engineered, Developed, Spearheaded, Built, Optimized) and include realistic outcome metrics where applicable.
   - Clean up skills into relevant categories.
   - Remove any markdown asterisks (**) from all text fields.
3. Conversational Speech Response: In 'aiResponse', provide a friendly, clear English response (1-2 sentences max) suitable for text-to-speech.

Current Resume JSON:
${stateSerialized}

User Request:
"${transcript.trim()}"

Return ONLY valid JSON (no markdown fences) matching this structure:
{
  "updatedResume": { ...entire updated resume state object... },
  "aiResponse": "Short 1-2 sentence response in English explaining what was improved."
}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    let apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    let apiKey = GROQ_API_KEY;
    let modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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
            { role: "user", content: transcript.trim() }
          ],
          temperature: 0.2,
          max_tokens: 1400,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API error:", response.status, errText);
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
              max_tokens: 1400,
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
