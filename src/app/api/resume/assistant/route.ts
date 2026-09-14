import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ASSISTANT_SESSION_DAILY_CAP = 60;
const ASSISTANT_GUEST_HOURLY_CAP = 25;
const MAX_TRANSCRIPT_CHARS = 1500;

// Emoji cleaner helper
function stripEmojisFromObject(obj: any): any {
  if (typeof obj === "string") {
    return obj.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(stripEmojisFromObject);
  }
  if (obj && typeof obj === "object") {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = stripEmojisFromObject(v);
    }
    return cleaned;
  }
  return obj;
}

// Compact state payload to save tokens
function compactResumePayload(state: any) {
  if (!state || typeof state !== "object") return {};
  const cleaned: Record<string, any> = {};

  if (state.personalInfo) {
    const p: Record<string, string> = {};
    if (state.personalInfo.fullName) p.fullName = state.personalInfo.fullName;
    if (state.personalInfo.headline) p.headline = state.personalInfo.headline;
    if (state.personalInfo.email) p.email = state.personalInfo.email;
    if (state.personalInfo.phone) p.phone = state.personalInfo.phone;
    if (state.personalInfo.location) p.location = state.personalInfo.location;
    if (state.personalInfo.linkedin) p.linkedin = state.personalInfo.linkedin;
    cleaned.personalInfo = p;
  }

  if (state.professionalSummary) cleaned.professionalSummary = state.professionalSummary;

  if (Array.isArray(state.experience) && state.experience.length > 0) {
    cleaned.experience = state.experience.slice(0, 4).map((e: any) => ({
      company: e.company || "",
      position: e.position || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      location: e.location || "",
      description: Array.isArray(e.description) ? e.description.slice(0, 4) : [],
    }));
  }

  if (Array.isArray(state.projects) && state.projects.length > 0) {
    cleaned.projects = state.projects.slice(0, 4).map((p: any) => ({
      name: p.name || "",
      technologies: p.technologies || [],
      description: Array.isArray(p.description) ? p.description.slice(0, 3) : [],
    }));
  }

  if (Array.isArray(state.education) && state.education.length > 0) {
    cleaned.education = state.education.map((ed: any) => ({
      institution: ed.institution || "",
      degree: ed.degree || "",
      startDate: ed.startDate || "",
      endDate: ed.endDate || "",
      score: ed.score || "",
    }));
  }

  if (state.skills) {
    cleaned.skills = {
      languages: state.skills.languages || [],
      frameworks: state.skills.frameworks || [],
      tools: state.skills.tools || [],
    };
  }

  if (Array.isArray(state.trainingCourses) && state.trainingCourses.length > 0) {
    cleaned.trainingCourses = state.trainingCourses.slice(0, 3);
  }

  if (Array.isArray(state.keyAchievements) && state.keyAchievements.length > 0) {
    cleaned.keyAchievements = state.keyAchievements.slice(0, 3);
  }

  return cleaned;
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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const session = await auth();
    const userId = session?.user?.id;

    if (userId) {
      const quota = await consumeDailyQuota(userId, "resumeAssistant", ASSISTANT_SESSION_DAILY_CAP, { failOpen: true });
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily AI Assistant quota reached. Please return tomorrow." },
          { status: 429 }
        );
      }
    } else {
      const quota = await consumeDailyQuota(ip, "resumeAssistantGuest", ASSISTANT_GUEST_HOURLY_CAP, { failOpen: true });
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Guest quota exceeded. Sign in to continue optimizing your resume." },
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
You are CareerVerse AI Resume Co-Pilot, an elite career coach and resume architect.
CORE DIRECTIVES:
1. STRICT ENGLISH OUTPUT: Regardless of the language or dialect used by the user (including Hindi, Hinglish, or slang), ALWAYS respond and write resume content EXCLUSIVELY in clean, professional English. Never output Hindi characters or Hinglish words.
2. ABSOLUTELY NO EMOJIS: Do NOT output any emojis, icons, or pictograms in any resume fields or in aiResponse.
3. EXECUTIVE ATS STANDARDS:
   - Begin bullet points with strong action verbs: Engineered, Spearheaded, Built, Optimized, Deployed, Redesigned.
   - Include realistic measurable outcomes where appropriate (% speed boost, user growth, latency reduction).
   - Eliminate buzzwords, passive voice, and raw markdown asterisks (**).
4. INTENT HANDLING & SUGGESTIONS:
   - If the user says "optimize", "improve", "make it better", or "review": perform a full ATS polish across professionalSummary, experience bullets, project descriptions, and categorize skills cleanly.
   - If the user asks to add/modify a specific item or mentions a suggestion (e.g., "apply this suggestion: ...", "add my project X using React", "update my headline", "change my summary"): accurately apply that change directly to the relevant resume section without wiping unrelated existing data.
5. ROBUST SPEECH-TO-TEXT & NOISE HANDLING:
   - The user request comes directly from microphone speech recognition or suggestion clicks.
   - If the request is random background noise, acoustic clicks, or unintelligible mutterings unrelated to a resume, DO NOT hallucinate fake jobs, projects, or random changes. Return the exact existing resume unchanged with aiResponse: "I could not hear you clearly. Please tap the mic or click one of the live suggestions."
   - If the input has minor phonetic mishearings of technical terms (e.g. 'react j s', 'paython', 'tail wind', 'no js'), interpret them in the proper technical context.
6. VOICE RESPONSE ('aiResponse'):
   - Provide a concise 1-2 sentence confirmation in clean English suitable for instant text-to-speech.

Current Resume JSON:
${stateSerialized}

User Request:
"${transcript.trim()}"

Return ONLY valid JSON (no markdown fences) matching:
{
  "updatedResume": { ...entire updated resume state object... },
  "aiResponse": "Concise 1-2 sentence English confirmation of what was updated."
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
          max_tokens: 1000,
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
              max_tokens: 1000,
            }),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            let fbText = fbData.choices?.[0]?.message?.content || "";
            fbText = fbText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
            const parsed = stripEmojisFromObject(JSON.parse(fbText));
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

      const parsed = stripEmojisFromObject(JSON.parse(aiText));
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
