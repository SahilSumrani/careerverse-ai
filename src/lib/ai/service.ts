import { clamp } from "@/lib/utils";
import type {
  AIService,
  CareerAnalysisResult,
  CareerMatch,
  InterviewPrepResult,
  OpportunityMatchResult,
  ParsedResumeProfile,
  ResumeAnalysisResult,
  RoadmapResult,
  UserCareerContext,
} from "@/lib/ai/types";
const DISCLAIMER =
  "AI-generated estimate based on the information you provided—not an objective measure of your potential or hiring probability.";

const CAREER_CATALOG: Array<{ title: string; skills: string[]; interests: string[] }> = [
  {
    title: "AI Product Manager",
    skills: ["product management", "communication", "ai", "analytics", "roadmapping", "user research"],
    interests: ["ai", "product", "startups"],
  },
  {
    title: "Product Manager",
    skills: ["product management", "communication", "analytics", "prioritization", "stakeholder management"],
    interests: ["product", "business", "startups"],
  },
  {
    title: "Business Analyst",
    skills: ["sql", "analytics", "communication", "requirements", "excel", "documentation"],
    interests: ["business", "analytics"],
  },
  {
    title: "Data Analyst",
    skills: ["sql", "python", "analytics", "visualization", "statistics", "excel"],
    interests: ["data", "analytics", "ai"],
  },
  {
    title: "AI/ML Engineer",
    skills: ["python", "machine learning", "deep learning", "math", "sql", "mlops"],
    interests: ["ai", "technology", "research"],
  },
  {
    title: "Software Developer",
    skills: ["javascript", "typescript", "react", "node", "git", "problem solving"],
    interests: ["technology", "software", "startups"],
  },
  {
    title: "UI/UX Designer",
    skills: ["figma", "user research", "wireframing", "prototyping", "communication", "design systems"],
    interests: ["design", "product", "technology"],
  },
  {
    title: "Digital Marketing Specialist",
    skills: ["seo", "content", "analytics", "social media", "campaigns", "communication"],
    interests: ["marketing", "business", "startups"],
  },
  {
    title: "HR Business Partner",
    skills: ["communication", "recruiting", "people ops", "empathy", "organization"],
    interests: ["hr", "people", "business"],
  },
  {
    title: "Founder / Entrepreneur",
    skills: ["leadership", "communication", "strategy", "sales", "product", "resilience"],
    interests: ["startups", "business", "leadership"],
  },
];

function norm(s: string) {
  return s.toLowerCase().trim();
}

function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map(norm));
  return a.filter((x) => setB.has(norm(x)) || [...setB].some((y) => y.includes(norm(x)) || norm(x).includes(y)));
}

function missingFrom(needed: string[], have: string[]) {
  const haveN = have.map(norm);
  return needed.filter(
    (n) => !haveN.some((h) => h === norm(n) || h.includes(norm(n)) || norm(n).includes(h)),
  );
}

function scoreProfile(ctx: UserCareerContext): CareerAnalysisResult["breakdown"] {
  const skillScore = clamp(ctx.skills.length * 12, 20, 95);
  const experienceScore = ctx.experienceSummary && ctx.experienceSummary.length > 40 ? 72 : 45;
  const resumeScore = ctx.resumeText && ctx.resumeText.length > 200 ? 78 : 40;
  const projectHint =
    /project|built|shipped|portfolio|hackathon/i.test(ctx.experienceSummary ?? "") ||
    /project|built|shipped/i.test(ctx.resumeText ?? "");
  const projectsScore = projectHint ? 70 : 42;
  const alignmentScore = ctx.careerGoals && ctx.careerGoals.length > 20 ? 75 : 50;
  return {
    skills: skillScore,
    experience: experienceScore,
    resume: resumeScore,
    projects: projectsScore,
    careerAlignment: alignmentScore,
    profileCompleteness: clamp(ctx.profileCompleteness, 0, 100),
  };
}

function buildMatches(ctx: UserCareerContext): CareerMatch[] {
  const skills = ctx.skills;
  const interests = ctx.interests;
  const goals = norm(ctx.careerGoals ?? "");

  return CAREER_CATALOG.map((career) => {
    const haveSkills = overlap(skills, career.skills);
    const miss = missingFrom(career.skills, skills);
    const interestHit = overlap(interests, career.interests).length;
    const goalBoost = goals.includes(norm(career.title).split(" ")[0] ?? "") ? 12 : 0;
    const base =
      (haveSkills.length / Math.max(career.skills.length, 1)) * 70 +
      interestHit * 8 +
      goalBoost +
      (ctx.profileCompleteness > 60 ? 5 : 0);
    const score = clamp(Math.round(base), 35, 96);
    return {
      title: career.title,
      score,
      why: [
        haveSkills.length
          ? `Relevant skills already on your profile: ${haveSkills.slice(0, 4).join(", ")}`
          : "Your stated goals and interests suggest exploratory fit",
        interestHit > 0
          ? `Interest overlap with ${career.interests.slice(0, 2).join(" & ")}`
          : "Can be explored as an adjacent path",
        ctx.careerGoals ? "Aligned against your career goals text" : "Complete goals for stronger alignment",
      ],
      alreadyHave: haveSkills.length ? haveSkills : skills.slice(0, 3),
      missing: miss.slice(0, 5),
      nextActions: [
        miss[0] ? `Build evidence in ${miss[0]} through a focused project` : "Document a portfolio case study",
        `Talk to a professional currently working as ${career.title}`,
        "Update your resume bullets to reflect transferable outcomes",
      ],
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function deterministicCareerAnalysis(ctx: UserCareerContext): CareerAnalysisResult {
  const breakdown = scoreProfile(ctx);
  const values = Object.values(breakdown);
  const careerScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const matches = buildMatches(ctx);
  const skillGaps = Array.from(new Set(matches.flatMap((m) => m.missing))).slice(0, 8);
  return {
    disclaimer: DISCLAIMER,
    careerScore,
    breakdown,
    strengths: [
      ...(ctx.skills.slice(0, 4).map((s) => `Skill signal: ${s}`)),
      ctx.education ? `Education foundation: ${ctx.education}` : "Add education details",
      ctx.careerGoals ? "Clear direction articulated in goals" : "Define clearer career goals",
    ].filter(Boolean),
    interests: ctx.interests,
    suitablePaths: matches,
    skillGaps,
    recommendedActions: [
      skillGaps[0] ? `Close your top skill gap: ${skillGaps[0]}` : "Add 3 more verified skills",
      "Upload a resume for ATS-oriented feedback",
      `Explore ${matches[0]?.title ?? "top career matches"} roadmap`,
      "Save 3 opportunities and track applications",
      "Connect with one mentor aligned to your goal",
    ],
  };
}

function deterministicJobMatch(
  ctx: UserCareerContext,
  opportunity: { title: string; description: string; skills: string[]; eligibility?: string | null; type: string },
): OpportunityMatchResult {
  const needed = opportunity.skills.length
    ? opportunity.skills
    : opportunity.description
        .split(/[\s,./|()]+/)
        .filter((w) => w.length > 3)
        .slice(0, 12);
  const strengths = overlap(ctx.skills, needed);
  const gaps = missingFrom(needed.slice(0, 8), ctx.skills);
  const goalHit = norm(ctx.careerGoals ?? "").includes(norm(opportunity.title).split(" ")[0] ?? "") ? 10 : 0;
  const score = clamp(
    Math.round((strengths.length / Math.max(needed.length || 1, 1)) * 75 + goalHit + (ctx.profileCompleteness > 50 ? 8 : 0)),
    28,
    95,
  );
  return {
    score,
    reasons: [
      strengths.length ? ` overlapping skills: ${strengths.slice(0, 4).join(", ")}` : "Limited direct skill overlap yet",
      `Opportunity type (${opportunity.type}) vs preference context`,
      ctx.interests.length ? `Interests considered: ${ctx.interests.slice(0, 3).join(", ")}` : "Add interests for better matching",
    ].map((r) => r.trim()),
    strengths: strengths.length ? strengths : ["Willingness to learn (self-declared goals)"],
    gaps,
    improveActions: gaps.map((g) => `Practice ${g} with a small, demonstrable artifact`),
    disclaimer: "Match percentage is an explainable fit estimate—not a guarantee of selection.",
  };
}

const SKILL_LEXICON = [
  "python",
  "javascript",
  "typescript",
  "react",
  "node",
  "sql",
  "java",
  "c++",
  "go",
  "rust",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "figma",
  "excel",
  "tableau",
  "power bi",
  "machine learning",
  "deep learning",
  "data analysis",
  "analytics",
  "communication",
  "leadership",
  "product management",
  "project management",
  "git",
  "next.js",
  "html",
  "css",
  "mongodb",
  "postgresql",
  "firebase",
  "marketing",
  "sales",
  "research",
  "writing",
];

const REQUIRED_ONBOARDING_FIELDS = [
  "name",
  "education",
  "degree",
  "college",
  "skills",
  "careerGoals",
] as const;

function sectionSlice(text: string, headings: string[], maxLen = 1200): string {
  const lower = text.toLowerCase();
  for (const h of headings) {
    const idx = lower.indexOf(h);
    if (idx < 0) continue;
    const after = text.slice(idx, idx + maxLen);
    const next = after.search(/\n\s*(experience|education|skills|projects|certifications|summary|objective|interests)\b/i);
    return (next > 40 ? after.slice(0, next) : after).trim();
  }
  return "";
}

function heuristicParseResumeProfile(resumeText: string): ParsedResumeProfile {
  const text = resumeText.replace(/\r/g, "").slice(0, 20000);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();

  let name: string | null = null;
  for (const line of lines.slice(0, 8)) {
    if (/@|http|www\.|linkedin|github|phone|\d{10}/i.test(line)) continue;
    if (/^(resume|curriculum|cv)\b/i.test(line)) continue;
    if (line.length >= 3 && line.length <= 60 && /^[A-Za-z][A-Za-z .'-]+$/.test(line)) {
      name = line.replace(/\s+/g, " ").trim();
      break;
    }
  }

  const linkedin = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i)?.[0] ?? null;
  const github = text.match(/https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i)?.[0] ?? null;
  const portfolio =
    text.match(/https?:\/\/(?:www\.)?(?!linkedin\.com|github\.com)[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?/i)?.[0] ?? null;

  let education: string | null = null;
  if (/\b(ph\.?d|doctorate)\b/i.test(text)) education = "Doctorate";
  else if (/\b(m\.?tech|m\.?s\.?|mba|master'?s|m\.?sc)\b/i.test(text)) education = "Master's";
  else if (/\b(b\.?tech|b\.?e\.?|b\.?s\.?|bachelor'?s|b\.?sc|b\.?a\.?)\b/i.test(text)) education = "Bachelor's";
  else if (/\b(diploma|associate)\b/i.test(text)) education = "Diploma";
  else if (/\b(high school|secondary|class\s*12|hsc)\b/i.test(text)) education = "High School";

  const degreeMatch = text.match(
    /\b((?:B\.?Tech|B\.?E\.?|B\.?S\.?|B\.?Sc|B\.?A\.?|M\.?Tech|M\.?S\.?|M\.?Sc|MBA|Ph\.?D)[^,\n]{0,60})/i,
  );
  const degree = degreeMatch?.[1]?.trim().slice(0, 120) ?? null;

  const collegeMatch = text.match(
    /\b([A-Z][A-Za-z &.'-]{2,80}(?:University|College|Institute|IIT|NIT|IIIT|School of [A-Za-z ]+))\b/,
  );
  const college = collegeMatch?.[1]?.trim().slice(0, 160) ?? null;

  const yearMatches = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const graduationYear =
    yearMatches.filter((y) => y >= 1980 && y <= 2040).sort((a, b) => b - a)[0] ?? null;

  const skillsFromLexicon = SKILL_LEXICON.filter((s) => lower.includes(s));
  const skillsSection = sectionSlice(text, ["skills", "technical skills", "core competencies"]);
  const skillsFromSection = skillsSection
    ? skillsSection
        .split(/[,|\n•·]/)
        .map((s) => s.replace(/^[\d.\-)\s]+/, "").trim())
        .filter((s) => s.length >= 2 && s.length <= 40)
        .slice(0, 25)
    : [];
  const skills = Array.from(new Set([...skillsFromSection, ...skillsFromLexicon.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase()))])).slice(
    0,
    30,
  );

  const experienceBlock =
    sectionSlice(text, ["experience", "work experience", "internship", "employment"], 1600) ||
    sectionSlice(text, ["projects"], 1000);
  const experienceSummary = experienceBlock
    ? experienceBlock.replace(/\s+/g, " ").trim().slice(0, 900)
    : null;

  const summaryBlock = sectionSlice(text, ["objective", "summary", "career objective", "profile"], 800);
  const careerGoals = summaryBlock
    ? summaryBlock.replace(/\s+/g, " ").trim().slice(0, 600)
    : null;

  const interests: string[] = [];
  const interestBlock = sectionSlice(text, ["interests", "hobbies"], 400);
  if (interestBlock) {
    interests.push(
      ...interestBlock
        .split(/[,|\n•]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 40)
        .slice(0, 10),
    );
  }

  const preferredIndustries: string[] = [];
  for (const ind of ["SaaS", "Fintech", "Healthcare", "EdTech", "E-commerce", "Consulting", "AI"]) {
    if (lower.includes(ind.toLowerCase())) preferredIndustries.push(ind);
  }

  const preferredLocations: string[] = [];
  for (const loc of ["Remote", "Bengaluru", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune", "Chennai"]) {
    if (lower.includes(loc.toLowerCase())) preferredLocations.push(loc === "Bangalore" ? "Bengaluru" : loc);
  }

  const draft: Omit<ParsedResumeProfile, "filledFields" | "missingFields" | "source"> = {
    name,
    education,
    degree,
    college,
    graduationYear,
    skills,
    interests: Array.from(new Set(interests)),
    careerGoals,
    experienceSummary,
    preferredIndustries: Array.from(new Set(preferredIndustries)),
    preferredLocations: Array.from(new Set(preferredLocations)),
    linkedinUrl: linkedin,
    githubUrl: github,
    portfolioUrl: portfolio,
  };

  return finalizeParsedProfile(draft, "heuristic");
}

function finalizeParsedProfile(
  draft: Omit<ParsedResumeProfile, "filledFields" | "missingFields" | "source">,
  source: "ai" | "heuristic",
): ParsedResumeProfile {
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  const checks: Array<[string, boolean]> = [
    ["name", Boolean(draft.name && draft.name.trim().length > 1)],
    ["education", Boolean(draft.education)],
    ["degree", Boolean(draft.degree)],
    ["college", Boolean(draft.college)],
    ["graduationYear", draft.graduationYear != null],
    ["skills", (draft.skills?.length ?? 0) > 0],
    ["interests", (draft.interests?.length ?? 0) > 0],
    ["careerGoals", Boolean(draft.careerGoals && draft.careerGoals.trim().length >= 10)],
    ["experienceSummary", Boolean(draft.experienceSummary)],
  ];

  for (const [key, ok] of checks) {
    if (ok) filledFields.push(key);
    else if ((REQUIRED_ONBOARDING_FIELDS as readonly string[]).includes(key) || key === "interests" || key === "experienceSummary" || key === "graduationYear") {
      missingFields.push(key);
    }
  }

  return {
    name: draft.name ?? null,
    education: draft.education ?? null,
    degree: draft.degree ?? null,
    college: draft.college ?? null,
    graduationYear: draft.graduationYear ?? null,
    skills: draft.skills ?? [],
    interests: draft.interests ?? [],
    careerGoals: draft.careerGoals ?? null,
    experienceSummary: draft.experienceSummary ?? null,
    preferredIndustries: draft.preferredIndustries ?? [],
    preferredLocations: draft.preferredLocations ?? [],
    linkedinUrl: draft.linkedinUrl ?? null,
    githubUrl: draft.githubUrl ?? null,
    portfolioUrl: draft.portfolioUrl ?? null,
    filledFields,
    missingFields,
    source,
  };
}

function deterministicResumeAnalysis(resumeText: string, targetRole?: string): ResumeAnalysisResult {
  const text = resumeText.slice(0, 12000);
  const lower = text.toLowerCase();
  const skillCandidates = [
    "python",
    "javascript",
    "typescript",
    "react",
    "sql",
    "leadership",
    "communication",
    "product",
    "figma",
    "aws",
    "machine learning",
    "analytics",
  ].filter((s) => lower.includes(s));
  const hasMetrics = /\d+%|\d+\+|increased|reduced|grew|shipped/i.test(text);
  const hasSections = /experience|education|skills|projects/i.test(text);
  const score = clamp(
    40 + skillCandidates.length * 4 + (hasMetrics ? 12 : 0) + (hasSections ? 10 : 0) + (targetRole && lower.includes(norm(targetRole).split(" ")[0] ?? "") ? 8 : 0),
    35,
    92,
  );
  return {
    disclaimer:
      "Resume insights are AI-generated heuristics. We do not claim compatibility with any specific ATS vendor.",
    score,
    structure: hasSections
      ? "Core sections appear present (experience/education/skills/projects signals detected)."
      : "Consider clearer section headings for experience, education, skills, and projects.",
    skills: skillCandidates,
    keywords: skillCandidates.slice(0, 10),
    achievements: hasMetrics
      ? ["Quantified impact language detected—keep strengthening outcome-led bullets."]
      : ["Few quantified achievements detected—add metrics where truthful."],
    clarity: text.length > 800 ? "Length suggests substantive content; tighten dense paragraphs into bullets." : "Resume text is short—expand with concrete outcomes.",
    atsNotes:
      "Prefer standard headings, avoid text inside images/tables when possible, and mirror role-relevant keywords honestly.",
    roleAlignment: targetRole
      ? `Analyzed with target role “${targetRole}”. Emphasize overlapping skills and role vocabulary without fabricating experience.`
      : "No target role provided—run “Analyze for this role” for sharper feedback.",
    recommendations: [
      "Lead bullets with action + outcome",
      "Mirror must-have skills from the target JD only if you have evidence",
      "Keep formatting simple for parsing reliability",
      targetRole ? `Add a concise summary tailored to ${targetRole}` : "Pick a target role for tailored keyword guidance",
    ],
  };
}

async function callOpenAICompatible(
  system: string,
  user: string,
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const maxTokens = Number(process.env.AI_MAX_TOKENS || 1200);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    await trackUsage("llm", model, data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0, true);
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    await trackUsage("llm", model, 0, 0, false);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function trackUsage(
  operation: string,
  model: string | null,
  tokensIn: number,
  tokensOut: number,
  success: boolean,
  userId?: string,
) {
  try {
    const { hasFirebaseAdminCredentials, getAdminDb } = await import("@/lib/firebase-admin");
    if (!hasFirebaseAdminCredentials()) return;
    await getAdminDb()
      .collection("aiUsage")
      .add({
        operation,
        model: model ?? null,
        tokensIn,
        tokensOut,
        success,
        userId: userId ?? null,
        createdAt: new Date().toISOString(),
      });
  } catch {
    // non-blocking — Admin SDK optional at build / local without creds
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

class CareerVerseAIService implements AIService {
  async careerAnalysis(ctx: UserCareerContext): Promise<CareerAnalysisResult> {
    const fallback = deterministicCareerAnalysis(ctx);
    const raw = await callOpenAICompatible(
      "You are CareerVerse AI. Return JSON only matching the career analysis schema. Never invent credentials. Label scores as estimates.",
      JSON.stringify({
        task: "careerAnalysis",
        context: { ...ctx, resumeText: ctx.resumeText?.slice(0, 3000) },
        schemaHint: fallback,
      }),
    );
    const parsed = safeParse(raw, fallback);
    parsed.disclaimer = DISCLAIMER;
    await trackUsage("careerAnalysis", process.env.AI_MODEL || "fallback", 0, 0, Boolean(raw));
    return parsed;
  }

  async careerRecommendations(ctx: UserCareerContext): Promise<CareerMatch[]> {
    const analysis = await this.careerAnalysis(ctx);
    return analysis.suitablePaths;
  }

  async resumeAnalysis(input: {
    resumeText: string;
    targetRole?: string;
    ctx?: UserCareerContext;
  }): Promise<ResumeAnalysisResult> {
    const fallback = deterministicResumeAnalysis(input.resumeText, input.targetRole);
    const raw = await callOpenAICompatible(
      "You are CareerVerse resume intelligence. Return JSON. Do not claim specific ATS vendor compatibility. Never invent experience.",
      JSON.stringify({
        task: "resumeAnalysis",
        targetRole: input.targetRole,
        resumeText: input.resumeText.slice(0, 10000),
        schemaHint: fallback,
      }),
    );
    const parsed = safeParse(raw, fallback);
    parsed.disclaimer = fallback.disclaimer;
    return parsed;
  }

  async parseResumeProfile(input: { resumeText: string }): Promise<ParsedResumeProfile> {
    const fallback = heuristicParseResumeProfile(input.resumeText || "");
    if (!input.resumeText?.trim()) {
      return finalizeParsedProfile(
        {
          name: null,
          education: null,
          degree: null,
          college: null,
          graduationYear: null,
          skills: [],
          interests: [],
          careerGoals: null,
          experienceSummary: null,
          preferredIndustries: [],
          preferredLocations: [],
          linkedinUrl: null,
          githubUrl: null,
          portfolioUrl: null,
        },
        "heuristic",
      );
    }

    const raw = await callOpenAICompatible(
      "You are CareerVerse onboarding parser. Extract only facts present in the resume. Never invent degrees, employers, or skills. Return JSON matching the schema. Use null for unknown scalars and [] for unknown arrays.",
      JSON.stringify({
        task: "parseResumeProfile",
        resumeText: input.resumeText.slice(0, 12000),
        schemaHint: {
          name: fallback.name,
          education: fallback.education,
          degree: fallback.degree,
          college: fallback.college,
          graduationYear: fallback.graduationYear,
          skills: fallback.skills,
          interests: fallback.interests,
          careerGoals: fallback.careerGoals,
          experienceSummary: fallback.experienceSummary,
          preferredIndustries: fallback.preferredIndustries,
          preferredLocations: fallback.preferredLocations,
          linkedinUrl: fallback.linkedinUrl,
          githubUrl: fallback.githubUrl,
          portfolioUrl: fallback.portfolioUrl,
        },
      }),
    );

    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw) as Partial<ParsedResumeProfile>;
      const merged = {
        name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : fallback.name,
        education: typeof parsed.education === "string" && parsed.education.trim() ? parsed.education.trim() : fallback.education,
        degree: typeof parsed.degree === "string" && parsed.degree.trim() ? parsed.degree.trim() : fallback.degree,
        college: typeof parsed.college === "string" && parsed.college.trim() ? parsed.college.trim() : fallback.college,
        graduationYear:
          typeof parsed.graduationYear === "number" && parsed.graduationYear >= 1980 && parsed.graduationYear <= 2040
            ? parsed.graduationYear
            : fallback.graduationYear,
        skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills.map(String).slice(0, 40) : fallback.skills,
        interests:
          Array.isArray(parsed.interests) && parsed.interests.length
            ? parsed.interests.map(String).slice(0, 20)
            : fallback.interests,
        careerGoals:
          typeof parsed.careerGoals === "string" && parsed.careerGoals.trim().length >= 10
            ? parsed.careerGoals.trim().slice(0, 2000)
            : fallback.careerGoals,
        experienceSummary:
          typeof parsed.experienceSummary === "string" && parsed.experienceSummary.trim()
            ? parsed.experienceSummary.trim().slice(0, 2000)
            : fallback.experienceSummary,
        preferredIndustries:
          Array.isArray(parsed.preferredIndustries) && parsed.preferredIndustries.length
            ? parsed.preferredIndustries.map(String).slice(0, 15)
            : fallback.preferredIndustries,
        preferredLocations:
          Array.isArray(parsed.preferredLocations) && parsed.preferredLocations.length
            ? parsed.preferredLocations.map(String).slice(0, 15)
            : fallback.preferredLocations,
        linkedinUrl:
          typeof parsed.linkedinUrl === "string" && parsed.linkedinUrl.startsWith("http")
            ? parsed.linkedinUrl
            : fallback.linkedinUrl,
        githubUrl:
          typeof parsed.githubUrl === "string" && parsed.githubUrl.startsWith("http")
            ? parsed.githubUrl
            : fallback.githubUrl,
        portfolioUrl:
          typeof parsed.portfolioUrl === "string" && parsed.portfolioUrl.startsWith("http")
            ? parsed.portfolioUrl
            : fallback.portfolioUrl,
      };
      return finalizeParsedProfile(merged, "ai");
    } catch {
      return fallback;
    }
  }

  async jobMatching(input: {
    ctx: UserCareerContext;
    opportunity: {
      title: string;
      description: string;
      skills: string[];
      eligibility?: string | null;
      type: string;
    };
  }): Promise<OpportunityMatchResult> {
    const fallback = deterministicJobMatch(input.ctx, input.opportunity);
    const raw = await callOpenAICompatible(
      "You are CareerVerse opportunity matching. Return JSON with explainable fit. Never imply guaranteed hiring.",
      JSON.stringify({ task: "jobMatching", ...input, schemaHint: fallback }),
    );
    const parsed = safeParse(raw, fallback);
    parsed.disclaimer = fallback.disclaimer;
    return parsed;
  }

  async interviewPreparation(input: {
    targetRole: string;
    jobDescription?: string;
    resumeText?: string;
    experienceLevel?: string;
    ctx?: UserCareerContext;
  }): Promise<InterviewPrepResult> {
    const fallback: InterviewPrepResult = {
      likelyQuestions: [
        `Why do you want to work as a ${input.targetRole}?`,
        "Walk me through a project you are proud of.",
        "How do you handle ambiguity?",
      ],
      behavioralQuestions: [
        "Tell me about a time you resolved conflict on a team.",
        "Describe a failure and what you learned.",
        "Give an example of ownership beyond your job description.",
      ],
      roleSpecificQuestions: [
        `What skills matter most for ${input.targetRole} in the first 90 days?`,
        "How would you prioritize competing stakeholder requests?",
      ],
      resumeBasedQuestions: input.resumeText
        ? ["Explain the impact of your most recent listed experience.", "Which resume bullet best shows role readiness?"]
        : ["Upload or paste resume context for tailored resume-based questions."],
      checklist: [
        "Re-read the job description and mark must-have skills",
        "Prepare 3 STAR stories",
        "Prepare thoughtful questions for the interviewer",
        "Review your resume aloud once",
      ],
      answerGuidance: [
        "Lead with outcome, then context, then your actions",
        "Stay truthful—do not invent metrics or titles",
        "Connect answers back to the target role’s needs",
      ],
    };
    const raw = await callOpenAICompatible(
      "You are CareerVerse interview coach. Return JSON. Ground answers in provided user information only.",
      JSON.stringify({
        task: "interviewPreparation",
        targetRole: input.targetRole,
        jobDescription: input.jobDescription?.slice(0, 4000),
        resumeText: input.resumeText?.slice(0, 4000),
        experienceLevel: input.experienceLevel,
        schemaHint: fallback,
      }),
    );
    return safeParse(raw, fallback);
  }

  async roadmapGeneration(input: {
    careerTitle: string;
    ctx: UserCareerContext;
  }): Promise<RoadmapResult> {
    const gaps = missingFrom(
      CAREER_CATALOG.find((c) => norm(c.title) === norm(input.careerTitle))?.skills ?? [
        "communication",
        "domain fundamentals",
        "portfolio",
      ],
      input.ctx.skills,
    );
    const fallback: RoadmapResult = {
      goal: input.careerTitle,
      stages: [
        { key: "skills", title: "Skills", items: gaps.length ? gaps : input.ctx.skills.slice(0, 5) },
        {
          key: "learning",
          title: "Learning",
          items: [
            `Structured fundamentals for ${input.careerTitle}`,
            "Practice weekly with deliberate exercises",
            "Follow one mentor/practitioner publicly sharing craft",
          ],
        },
        {
          key: "projects",
          title: "Projects",
          items: [
            "Ship one portfolio project tied to your target role",
            "Document decisions, tradeoffs, and outcomes",
          ],
        },
        {
          key: "experience",
          title: "Experience",
          items: ["Internship, apprenticeship, or scoped freelance proof", "Volunteer for adjacent responsibilities"],
        },
        {
          key: "opportunities",
          title: "Opportunities",
          items: ["Apply to roles with >70% explainable match", "Track applications weekly"],
        },
        {
          key: "interview",
          title: "Interview",
          items: ["Run role-specific prep in CareerVerse", "Do one mock behavioral session"],
        },
        {
          key: "growth",
          title: "Career growth",
          items: ["Seek feedback loops every quarter", "Expand network in your target domain"],
        },
      ],
    };
    const raw = await callOpenAICompatible(
      "You are CareerVerse roadmap planner. Return JSON stages. Personalize using user skills/gaps. Do not invent credentials.",
      JSON.stringify({ task: "roadmapGeneration", ...input, schemaHint: fallback }),
    );
    return safeParse(raw, fallback);
  }

  async chat(input: {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    ctx?: UserCareerContext;
  }): Promise<{ reply: string }> {
    const fallbackReply = (() => {
      const q = norm(input.message);
      if (q.includes("missing") || q.includes("skill gap")) {
        return `Based on your profile skills (${input.ctx?.skills.slice(0, 6).join(", ") || "not set yet"}), focus this week on one demonstrable gap tied to your top career match, then update your profile.`;
      }
      if (q.includes("career") && q.includes("right")) {
        return "Start from goals + interests + skills, generate Career Intelligence, then compare the top 3 paths by missing skills and next actions—not by score alone.";
      }
      if (q.includes("resume")) {
        return "Upload your resume and run analysis for a specific target role. Improve clarity, truthful keywords, and quantified outcomes.";
      }
      if (q.includes("this week") || q.includes("next")) {
        return "This week: (1) close one skill gap with a tiny project, (2) improve resume for one role, (3) save 3 matched opportunities, (4) request one relevant connection.";
      }
      return "I can help with career fit, skill gaps, opportunities, resume feedback, interview prep, and weekly plans. Ask a specific question, and I’ll use your CareerVerse profile context when available.";
    })();

    const raw = await callOpenAICompatible(
      "You are CareerVerse Copilot, a concise career coach. Never invent user qualifications. Prefer actionable next steps. Return JSON {\"reply\":\"...\"}.",
      JSON.stringify({
        message: input.message,
        history: input.history?.slice(-8),
        context: input.ctx
          ? {
              skills: input.ctx.skills,
              interests: input.ctx.interests,
              goals: input.ctx.careerGoals,
              stage: input.ctx.careerStage,
            }
          : null,
      }),
    );
    const parsed = safeParse(raw, { reply: fallbackReply });
    return { reply: parsed.reply || fallbackReply };
  }
}

export const aiService: AIService = new CareerVerseAIService();
export { CAREER_CATALOG, DISCLAIMER };
