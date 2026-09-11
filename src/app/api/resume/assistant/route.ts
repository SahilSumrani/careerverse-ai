import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { transcript, resumeState } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const prompt = `
You are an expert AI Resume Assistant. The user is talking to you to build their resume.
You have their current resume state (JSON) and their spoken command.

Your job is to:
1. Apply their command to the resume state. For example, if they say "Add my experience as a Software Engineer at Google from Jan 2020 to present", you add that to the "experience" array.
2. If they ask you to bold a keyword, add **keyword** syntax in the description.
3. Provide a very short, friendly, conversational response to say what you did (under 2 sentences) because this will be spoken back to them via Text-to-Speech.

Current Resume State:
${JSON.stringify(resumeState)}

User Command:
"${transcript}"

You must return a JSON object with EXACTLY this structure, and nothing else (no markdown wrappers like \`\`\`json):
{
  "updatedResume": { ...the entire updated resume state object... },
  "aiResponse": "The conversational text to speak back to the user."
}
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
        model: "google/gemini-2.5-flash", // Fast for voice
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter API error:", await response.text());
      return NextResponse.json({ error: "Failed to process voice command" }, { status: 500 });
    }

    const data = await response.json();
    let aiText = data.choices[0].message.content;

    // Clean up potential markdown formatting
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI output as JSON:", aiText);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("Error processing assistant command:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
