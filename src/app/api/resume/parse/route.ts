import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

// We need to use the Nodejs runtime for pdf-parse
export const runtime = "nodejs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the file as a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from the PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    // Send the text to OpenRouter to parse into our schema
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
${extractedText}
"""
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://careerverse.ai",
        "X-Title": "CareerVerse",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Using a fast/cheap model on openrouter
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json({ error: "Failed to parse resume with AI" }, { status: 500 });
    }

    const data = await response.json();
    let aiText = data.choices[0].message.content;

    // Clean up potential markdown formatting
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let structuredResume;
    try {
      structuredResume = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI output as JSON:", aiText);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: structuredResume });

  } catch (error: any) {
    console.error("Error processing resume:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
