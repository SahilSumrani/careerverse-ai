import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";
import { extractResumeText } from "@/lib/uploads";
import { heuristicParseResumeProfile } from "@/lib/ai/service";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const PARSE_SESSION_DAILY_CAP = 15;
const PARSE_GUEST_HOURLY_CAP = 5;

function convertHeuristicToResumeData(text: string) {
  const profile = heuristicParseResumeProfile(text);
  
  // Extract lines for summary
  const summary = profile.experienceSummary || profile.careerGoals || text.split("\n\n")[0]?.slice(0, 500) || "";

  return {
    personalInfo: {
      fullName: profile.name || "Candidate Name",
      headline: profile.degree ? `${profile.degree} Professional` : "Professional",
      email: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "",
      phone: text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || "",
      location: profile.preferredLocations?.[0] || "",
      linkedin: profile.linkedinUrl || "",
      github: profile.githubUrl || "",
    },
    professionalSummary: summary,
    experience: (profile.experiences || []).map((exp) => ({
      company: exp.company || "Company",
      position: exp.responsibilities?.split("\n")[0]?.slice(0, 50) || "Role / Position",
      startDate: exp.start || "",
      endDate: exp.end || "",
      location: "",
      description: exp.responsibilities ? exp.responsibilities.split("\n").filter(Boolean) : [],
    })),
    education: profile.college || profile.degree ? [
      {
        institution: profile.college || "University",
        degree: profile.degree || profile.education || "Degree",
        startDate: "",
        endDate: profile.graduationYear ? String(profile.graduationYear) : "",
        score: "",
        location: "",
      }
    ] : [],
    projects: [],
    skills: {
      languages: (profile.skills || []).slice(0, 8),
      frameworks: (profile.skills || []).slice(8, 16),
      tools: (profile.skills || []).slice(16, 24),
    },
    keyAchievements: [],
    trainingCourses: [],
    languages: [
      { name: "English", proficiency: 5 }
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    // Session or guest IP rate-limiting
    const session = await auth();
    if (session?.user?.id) {
      const quota = await consumeDailyQuota(session.user.id, "resumeParse", PARSE_SESSION_DAILY_CAP, { failOpen: true });
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily resume parsing limit reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else if (hasFirebaseAdminCredentials()) {
      const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const rawIp = forwarded || req.headers.get("x-real-ip") || "unknown";
      const ip = rawIp.slice(0, 128).replace(/[/:.]/g, "_");
      const hour = new Date().toISOString().slice(0, 13);
      const allowed = await consumeWindowQuota("resume-parse-guest-ip", ip, PARSE_GUEST_HOURLY_CAP, hour);
      if (allowed === false) {
        return NextResponse.json(
          { error: "Guest resume parse limit exceeded. Please sign in to continue." },
          { status: 429 }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded. Please select a PDF or DOCX file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "Only PDF (.pdf) and Word (.docx) formats are supported for resume parsing." },
        { status: 400 }
      );
    }

    // Read the file as a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Extract text from the PDF or DOCX
    const extractedText = await extractResumeText(buffer, mimeType);

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from the file. It may be scanned or image-only." },
        { status: 400 }
      );
    }

    const safeText = extractedText.slice(0, 16000);
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    // If OpenRouter is not configured, fall back to heuristic parser immediately
    if (!OPENROUTER_API_KEY) {
      const fallbackData = convertHeuristicToResumeData(safeText);
      return NextResponse.json({ success: true, data: fallbackData, fallback: true });
    }

    const prompt = `
You are an expert ATS Resume parser. Parse the following resume text into a structured JSON format.
Only return valid JSON. Do not return any markdown formatting like \`\`\`json or \`\`\`.
Use this exact JSON structure:
{
  "personalInfo": {
    "fullName": "string",
    "headline": "string (e.g. Chief Experience Officer | Customer-Centric Strategies | Digital Transformation)",
    "email": "string",
    "phone": "string",
    "location": "string (e.g. Indianapolis, Indiana)",
    "linkedin": "string",
    "github": "string"
  },
  "professionalSummary": "string",
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "YYYY-MM or year",
      "endDate": "YYYY-MM or year",
      "score": "string",
      "location": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "MM/YYYY or YYYY",
      "endDate": "MM/YYYY or Present",
      "location": "string",
      "description": ["string with achievements and metrics"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "technologies": ["string"],
      "description": ["string"]
    }
  ],
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"]
  },
  "keyAchievements": [
    {
      "title": "string",
      "description": "string"
    }
  ],
  "trainingCourses": [
    {
      "name": "string",
      "provider": "string",
      "description": "string"
    }
  ],
  "languages": [
    {
      "name": "string",
      "proficiency": 5
    }
  ]
}

Resume Text:
"""
${safeText}
"""
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

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
        console.warn("OpenRouter API error status:", response.status, "Falling back to heuristic parser");
        const fallbackData = convertHeuristicToResumeData(safeText);
        return NextResponse.json({ success: true, data: fallbackData, fallback: true });
      }

      const data = await response.json();
      let aiText = data.choices?.[0]?.message?.content || "";

      // Clean markdown code fence if present
      aiText = aiText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

      const jsonStart = aiText.indexOf("{");
      const jsonEnd = aiText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiText = aiText.slice(jsonStart, jsonEnd + 1);
      }

      const structuredResume = JSON.parse(aiText);
      return NextResponse.json({ success: true, data: structuredResume });
    } catch (aiErr) {
      console.warn("AI parser error, falling back to heuristic:", aiErr);
      const fallbackData = convertHeuristicToResumeData(safeText);
      return NextResponse.json({ success: true, data: fallbackData, fallback: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error processing resume:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
