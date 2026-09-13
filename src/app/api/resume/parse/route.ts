import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { auth } from "@/lib/auth";
import { consumeDailyQuota, consumeWindowQuota } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
const PARSE_SESSION_DAILY_CAP = 15;
const PARSE_GUEST_HOURLY_CAP = 5;

export async function POST(req: NextRequest) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI resume parser is not configured. Missing OPENROUTER_API_KEY." },
        { status: 500 }
      );
    }

    // Session or guest IP rate-limiting to prevent OOM & billing abuse
    const session = await auth();
    if (session?.user?.id) {
      const quota = await consumeDailyQuota(session.user.id, "resumeParse", PARSE_SESSION_DAILY_CAP);
      if (!quota.ok) {
        return NextResponse.json(
          { error: "Daily resume parsing limit reached. Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else {
      const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = (forwarded || req.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
      const hour = new Date().toISOString().slice(0, 13);
      const allowed = await consumeWindowQuota("resume-parse-guest-ip", ip, PARSE_GUEST_HOURLY_CAP, hour);
      if (!allowed) {
        return NextResponse.json(
          { error: "Guest resume parse limit exceeded. Please sign in to continue." },
          { status: 429 }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit. Please upload a smaller PDF." },
        { status: 400 }
      );
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { error: "Only PDF format is supported for resume parsing." },
        { status: 400 }
      );
    }

    // Read the file as a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from the PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF. It may be scanned or image-only." }, { status: 400 });
    }

    // Truncate to reasonable text length to prevent context explosion
    const safeText = extractedText.slice(0, 16000);

    const prompt = `
You are an expert ATS Resume parser. Parse the following resume text into a structured JSON format.
Only return valid JSON. Do not return any markdown formatting like \`\`\`json or \`\`\`.
Use this exact JSON structure:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string"
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "score": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "description": ["string"]
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
  }
}

Here is the resume text:
"""
${safeText}
"""
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

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
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        return NextResponse.json({ error: "Failed to parse resume with AI service" }, { status: 502 });
      }

      const data = await response.json();
      let aiText = data.choices?.[0]?.message?.content || "";

      // Clean markdown code fence if present
      aiText = aiText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

      // Fallback JSON isolate
      const jsonStart = aiText.indexOf("{");
      const jsonEnd = aiText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiText = aiText.slice(jsonStart, jsonEnd + 1);
      }

      const structuredResume = JSON.parse(aiText);
      return NextResponse.json({ success: true, data: structuredResume });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error processing resume:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
