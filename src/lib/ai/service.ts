import { clamp } from "@/lib/utils";
import { parseExperienceEntries, sanitizeExperiences } from "@/lib/experiences";
import {
  CHAT_INPUT_MAX_CHARS,
  CHAT_MAX_OUTPUT_TOKENS,
  isCareerChatOffTopic,
  OFF_TOPIC_REPLY,
} from "@/lib/ai/chat-guard";
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
  const META_TAGS = new Set(
    [
      "students",
      "internship",
      "full-time",
      "part-time",
      "contract",
      "early career",
      "new grad",
      "campus",
      "outreach",
      "events",
      "portfolio",
      "apprenticeship",
      "healthcare",
      "fintech",
      "remote",
      "hybrid",
      "onsite",
    ].map((t) => t.toLowerCase()),
  );
  const neededRaw = opportunity.skills.length
    ? opportunity.skills
    : opportunity.description
        .split(/[\s,./|()]+/)
        .filter((w) => w.length > 3)
        .slice(0, 12);
  const needed = neededRaw.filter((s) => !META_TAGS.has(norm(s)));
  const strengths = overlap(ctx.skills, needed.length ? needed : neededRaw);
  const gaps = missingFrom((needed.length ? needed : neededRaw).slice(0, 8), ctx.skills).filter(
    (g) => !META_TAGS.has(norm(g)),
  );
  const goalHit = norm(ctx.careerGoals ?? "").includes(norm(opportunity.title).split(" ")[0] ?? "") ? 10 : 0;
  const denom = Math.max((needed.length ? needed : neededRaw).length || 1, 1);
  const score = clamp(
    Math.round((strengths.length / denom) * 75 + goalHit + (ctx.profileCompleteness > 50 ? 8 : 0)),
    28,
    95,
  );
  return {
    score,
    reasons: [
      strengths.length
        ? `Matches your ${strengths.slice(0, 3).join(", ")} skills`
        : "Limited skill overlap so far — add skills to your profile for stronger matches",
      opportunity.type
        ? `This is a ${opportunity.type} role${ctx.interests.length ? " — check it fits your preferences" : ""}`
        : "Role type considered against your preferences",
      ctx.interests.length
        ? `Aligned with your interest in ${ctx.interests.slice(0, 2).join(" and ")}`
        : "Add career interests for clearer matching",
    ].map((r) => r.trim()),
    strengths: strengths.length ? strengths : ["Willingness to learn (self-declared goals)"],
    gaps,
    improveActions: gaps.map((g) => `Practice ${g} with a small, demonstrable artifact`),
    disclaimer: "Match percentage is an explainable fit estimate—not a guarantee of selection.",
  };
}

/** Canonical skill tokens (matched case-insensitively against resume text). */
const SKILL_LEXICON = [
  "python",
  "javascript",
  "typescript",
  "react.js",
  "react",
  "next.js",
  "nextjs",
  "node.js",
  "nodejs",
  "node",
  "express",
  "sql",
  "java",
  "c++",
  "c#",
  "go",
  "golang",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
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
  "github",
  "html",
  "css",
  "tailwind",
  "tailwind css",
  "mongodb",
  "postgresql",
  "mysql",
  "firebase",
  "redis",
  "graphql",
  "rest",
  "api",
  "redux",
  "vue",
  "angular",
  "django",
  "flask",
  "spring",
  "marketing",
  "sales",
  "research",
  "writing",
  "framer motion",
  "gsap",
  "three.js",
  "prisma",
  "supabase",
  "vercel",
];

const SKILL_SECTION_LABELS =
  /^(skills?|technical skills?|core competencies|languages?(?:\s+and\s+frameworks?)?|frameworks?|libraries|tools?(?:\s+and\s+technologies?)?|technologies|backend|frontend|front[- ]?end|back[- ]?end|cloud(?:\s+and\s+database)?|databases?|soft skills?|other)\s*:?\s*$/i;

const DEGREE_TOKEN =
  /\b(B\.?C\.?A\.?|B\.?Tech(?:nology)?|B\.?E\.?|B\.?S\.?|B\.?Sc\.?|B\.?A\.?|B\.?Com\.?|M\.?C\.?A\.?|M\.?Tech(?:nology)?|M\.?E\.?|M\.?S\.?|M\.?Sc\.?|M\.?A\.?|MBA|Ph\.?D\.?|Doctorate|Diploma|Associate(?:\s+Degree)?|Bachelor(?:'s)?|Master(?:'s)?)\b(?:\s+(?:in|of)\s+[A-Za-z][A-Za-z &/.-]{1,40})?/i;

const PROSE_NOISE =
  /\b(built|developed|designed|implemented|created|improved|elevat(?:e|ed)|client|website|animation|scroll|motion|responsible|collaborat|worked|project|internship|company)\b/i;

const REQUIRED_ONBOARDING_FIELDS = [
  "name",
  "education",
  "degree",
  "college",
  "skills",
  "careerGoals",
] as const;

type ParsedDraft = Omit<ParsedResumeProfile, "filledFields" | "missingFields" | "source">;

function sectionSlice(text: string, headings: string[], maxLen = 1200): string {
  const lower = text.toLowerCase();
  let best = "";
  for (const h of headings) {
    // Prefer heading at line start (section header), not mid-sentence
    const re = new RegExp(`(?:^|\\n)\\s*${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[:\\s]*`, "i");
    const m = re.exec(text);
    if (!m || m.index < 0) {
      const idx = lower.indexOf(h);
      if (idx < 0) continue;
      const after = text.slice(idx, idx + maxLen);
      const next = after.search(
        /\n\s*(experience|education|skills|projects|certifications|summary|objective|interests|work experience|technical skills)\b/i,
      );
      const chunk = (next > 20 ? after.slice(0, next) : after).trim();
      if (chunk.length > best.length) best = chunk;
      continue;
    }
    const start = m.index + m[0].length;
    const after = text.slice(start, start + maxLen);
    const next = after.search(
      /\n\s*(experience|education|skills|projects|certifications|summary|objective|interests|work experience|technical skills)\b/i,
    );
    const chunk = (next > 0 ? after.slice(0, next) : after).trim();
    if (chunk.length > best.length) best = chunk;
  }
  return best;
}

function educationSection(text: string): string {
  return (
    sectionSlice(text, ["education", "academic background", "academics", "qualifications"], 1400) ||
    ""
  );
}

function cleanDegreeCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  // Drop trailing institution / year clutter after separators
  s = s.split(/\s*[|,–—]\s*/)[0]?.trim() || s;
  s = s.replace(/\b(20\d{2}|19\d{2})\b.*$/, "").trim();
  if (s.length < 2 || s.length > 60) return null;
  if (PROSE_NOISE.test(s)) return null;
  if (!DEGREE_TOKEN.test(s) && !/^(bachelor|master|diploma|doctorate|associate)/i.test(s)) return null;
  const m = s.match(DEGREE_TOKEN);
  if (!m) return null;
  // Prefer the matched degree phrase, not trailing garbage
  const start = s.toLowerCase().indexOf(m[0].toLowerCase());
  const phrase = (start >= 0 ? s.slice(start, start + m[0].length + 24) : m[0])
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (phrase.length > 60 || PROSE_NOISE.test(phrase)) return null;
  return phrase;
}

function cleanCollegeCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, " ").trim();
  if (s.length < 6 || s.length > 120) return null;
  if (PROSE_NOISE.test(s)) return null;
  if (/^(the|a|an|i|we|my|some|any|your|this|that)\b/i.test(s)) return null;
  if (/\b(missing|intentionally|unknown|n\/?a|not available)\b/i.test(s)) return null;
  // Require a real institution cue — bare "College" / "School" alone is too weak
  if (
    !/\b(university|institute|iit|nit|iiit)\b/i.test(s) &&
    !/\b[A-Z][A-Za-z0-9 &.'-]{2,60}\s+College\b(?:\s+of\b)?/i.test(s)
  ) {
    return null;
  }
  if (/^(college|university|institute)\b/i.test(s)) return null;
  return s.slice(0, 120);
}

function titleCaseSkill(s: string): string {
  const lower = s.toLowerCase();
  const specials: Record<string, string> = {
    "next.js": "Next.js",
    nextjs: "Next.js",
    "react.js": "React.js",
    "node.js": "Node.js",
    nodejs: "Node.js",
    "c++": "C++",
    "c#": "C#",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    aws: "AWS",
    gcp: "GCP",
    api: "API",
    graphql: "GraphQL",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    mysql: "MySQL",
    "tailwind css": "Tailwind CSS",
    "three.js": "Three.js",
    "framer motion": "Framer Motion",
    gsap: "GSAP",
  };
  if (specials[lower]) return specials[lower];
  return s
    .split(/[\s.-]+/)
    .map((p) => (p.length <= 2 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join(s.includes(".") ? "." : s.includes("-") ? "-" : " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSkillSectionLabel(token: string): boolean {
  return SKILL_SECTION_LABELS.test(token.trim()) || /^(languages?|frameworks?|backend|frontend|cloud|database)s?\s+and\s+/i.test(token);
}

function cleanSkillList(skills: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of skills) {
    let s = String(raw || "").replace(/\s+/g, " ").trim();
    // Strip "Label: value" prefixes
    s = s.replace(
      /^(skills?|languages?(?:\s+and\s+frameworks?)?|frameworks?|libraries|tools?|technologies|backend|frontend|cloud(?:\s+and\s+database)?|databases?)\s*:\s*/i,
      "",
    );
    if (!s || isSkillSectionLabel(s)) continue;
    if (s.length < 2 || s.length > 40) continue;
    if (PROSE_NOISE.test(s) && s.split(" ").length > 4) continue;
    if (/^(and|or|with|using|including)$/i.test(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(titleCaseSkill(s));
    if (out.length >= 30) break;
  }
  return out;
}

function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  // Longer lexicon entries first so "react.js" beats "react"
  const lexicon = [...SKILL_LEXICON].sort((a, b) => b.length - a.length);
  for (const skill of lexicon) {
    const re = new RegExp(`(?:^|[^a-z0-9.+#])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9.+#]|$)`, "i");
    if (re.test(lower)) found.push(skill);
  }

  const skillsSection = sectionSlice(text, ["skills", "technical skills", "core competencies", "tech stack"], 1600);
  const fromSection: string[] = [];
  if (skillsSection) {
    const body = skillsSection
      .replace(
        /(?:^|\n)\s*(languages?(?:\s+and\s+frameworks?)?|frameworks?|libraries|tools?|technologies|backend|frontend|cloud(?:\s+and\s+database)?|databases?)\s*:?\s*/gi,
        "\n",
      )
      .replace(/^(skills?|technical skills?|core competencies)\s*:?\s*/i, "");
    for (const part of body.split(/[,|•·\n/;]+/)) {
      const t = part.replace(/^[\d.\-)\s:]+/, "").trim();
      if (t) fromSection.push(t);
    }
  }

  return cleanSkillList([...fromSection, ...found]);
}

function looksLikeCareerGoal(text: string): boolean {
  if (!text) return false;
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length < 12 || s.length > 280) return false;
  if (PROSE_NOISE.test(s) && s.length > 160) return false;
  // Explicit intent language
  if (/\b(seeking|aspire|aim(?:ing)?|goal|want to|looking for|pursue|career (?:in|as)|target(?:ing)?)\b/i.test(s)) {
    return true;
  }
  // Short role-oriented phrase
  if (s.length <= 120 && /\b(developer|engineer|analyst|designer|manager|intern|role|position)\b/i.test(s)) {
    return true;
  }
  return false;
}

function cleanCareerGoals(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/^(summary|objective|profile|career objective|about me)\s*:?\s*/i, "");
  if (!looksLikeCareerGoal(s)) return null;
  return s.slice(0, 280);
}

function cleanExperienceSummary(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/^(summary|objective|profile|experience|work experience|projects?)\s*:?\s*/i, "");
  if (s.length < 20) return null;
  return s.slice(0, 900);
}

function inferEducationLevel(haystack: string): string | null {
  if (/\b(ph\.?d|doctorate)\b/i.test(haystack)) return "Doctorate";
  if (/\b(m\.?tech|m\.?c\.?a\.?|m\.?s\.?|mba|master'?s|m\.?sc)\b/i.test(haystack)) return "Master's";
  if (/\b(b\.?tech|b\.?c\.?a\.?|b\.?e\.?|b\.?s\.?|bachelor'?s|b\.?sc|b\.?a\.?|b\.?com)\b/i.test(haystack)) {
    return "Bachelor's";
  }
  if (/\b(diploma|associate)\b/i.test(haystack)) return "Diploma";
  if (/\b(high school|secondary|class\s*12|hsc)\b/i.test(haystack)) return "High School";
  return null;
}

function extractDegreeFromEducation(eduText: string, fullText: string): string | null {
  const scope = eduText || fullText;
  // Prefer education-section lines
  const lines = (eduText || fullText)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, eduText ? 20 : 40)) {
    if (!DEGREE_TOKEN.test(line)) continue;
    const cleaned = cleanDegreeCandidate(line);
    if (cleaned) return cleaned;
  }
  const m = scope.match(DEGREE_TOKEN);
  return cleanDegreeCandidate(m?.[0] ?? null);
}

function extractCollegeFromEducation(eduText: string, fullText: string): string | null {
  const scope = eduText || "";
  const searchIn = scope || "";
  const collegeRe =
    /\b([A-Z][A-Za-z0-9 &.'-]{2,80}(?:University|Institute|IIT|NIT|IIIT)(?:\s+of\s+[A-Za-z ]+)?|[A-Z][A-Za-z0-9 &.'-]{2,60}\s+College(?:\s+of\s+[A-Za-z ]+)?)\b/;

  if (!searchIn) {
    // Only accept college on the same line as a degree token (reduces false positives)
    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!DEGREE_TOKEN.test(line)) continue;
      const m = line.match(collegeRe);
      const cleaned = cleanCollegeCandidate(m?.[1] ?? null);
      if (cleaned) return cleaned;
    }
    return null;
  }
  const m = searchIn.match(collegeRe);
  return cleanCollegeCandidate(m?.[1] ?? null);
}

function sanitizeParsedDraft(draft: ParsedDraft): ParsedDraft {
  const degree = cleanDegreeCandidate(draft.degree);
  const college = cleanCollegeCandidate(draft.college);
  const skills = cleanSkillList(draft.skills || []);
  let careerGoals = cleanCareerGoals(draft.careerGoals);
  let experienceSummary = cleanExperienceSummary(draft.experienceSummary);

  // If model put summary prose into goals, move it to experience
  if (draft.careerGoals && !careerGoals) {
    const maybeExp = cleanExperienceSummary(draft.careerGoals);
    if (maybeExp && (!experienceSummary || experienceSummary.length < maybeExp.length)) {
      experienceSummary = maybeExp;
    }
  }

  // Don't keep long prose as goals
  if (careerGoals && careerGoals.length > 280) careerGoals = careerGoals.slice(0, 280);
  if (careerGoals && !looksLikeCareerGoal(careerGoals)) careerGoals = null;

  const interests = (draft.interests || [])
    .map((i) => String(i).replace(/\s+/g, " ").trim())
    .filter((i) => i.length >= 2 && i.length <= 40 && !isSkillSectionLabel(i) && !PROSE_NOISE.test(i))
    .slice(0, 12);

  const experiences = sanitizeExperiences(draft.experiences);

  return {
    ...draft,
    name: draft.name && draft.name.trim().length > 1 && draft.name.trim().length <= 80 ? draft.name.trim() : null,
    education: draft.education?.trim() || null,
    degree,
    college,
    skills,
    interests,
    careerGoals,
    experienceSummary,
    experiences,
    preferredIndustries: (draft.preferredIndustries || []).map(String).filter(Boolean).slice(0, 15),
    preferredLocations: (draft.preferredLocations || []).map(String).filter(Boolean).slice(0, 15),
  };
}

function heuristicParseResumeProfile(resumeText: string): ParsedResumeProfile {
  const text = resumeText.replace(/\r/g, "").slice(0, 20000);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

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

  const eduText = educationSection(text);
  const education = inferEducationLevel(eduText || text);
  const degree = extractDegreeFromEducation(eduText, text);
  const college = extractCollegeFromEducation(eduText, text);

  const yearScope = eduText || text;
  const yearMatches = [...yearScope.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const graduationYear =
    yearMatches.filter((y) => y >= 1980 && y <= 2040).sort((a, b) => b - a)[0] ?? null;

  const skills = extractSkillsFromText(text);

  const summaryBlock = sectionSlice(text, ["summary", "profile", "about me"], 900);
  const objectiveBlock = sectionSlice(
    text,
    ["career objective", "objective", "career goals", "goals", "professional objective"],
    500,
  );
  const experienceBlock =
    sectionSlice(text, ["experience", "work experience", "internship", "employment"], 1600) ||
    sectionSlice(text, ["projects"], 1000);

  // SUMMARY → experienceSummary; goals only from explicit objective/goals (or short intent)
  let experienceSummary =
    cleanExperienceSummary(summaryBlock) ||
    cleanExperienceSummary(experienceBlock);
  let careerGoals = cleanCareerGoals(objectiveBlock);
  if (!careerGoals && objectiveBlock && looksLikeCareerGoal(objectiveBlock.replace(/\s+/g, " "))) {
    careerGoals = cleanCareerGoals(objectiveBlock);
  }
  // Never use summary paragraph as goals
  if (summaryBlock && careerGoals && summaryBlock.includes(careerGoals.slice(0, 40))) {
    if (!looksLikeCareerGoal(careerGoals) || careerGoals.length > 180) {
      experienceSummary = experienceSummary || cleanExperienceSummary(careerGoals);
      careerGoals = null;
    }
  }

  // Structured experiences only when header/date patterns map cleanly — never invent from summary prose
  const experiences = parseExperienceEntries(
    sectionSlice(text, ["experience", "work experience", "internship", "employment"], 2000),
  );

  const interests: string[] = [];
  const interestBlock = sectionSlice(text, ["interests", "hobbies", "areas of interest"], 400);
  if (interestBlock) {
    interests.push(
      ...interestBlock
        .split(/[,|\n•·]/)
        .map((s) => s.replace(/^(interests?|hobbies)\s*:?\s*/i, "").trim())
        .filter((s) => s.length >= 2 && s.length <= 40 && !isSkillSectionLabel(s)),
    );
  }

  const preferredIndustries: string[] = [];
  for (const ind of ["SaaS", "Fintech", "Healthcare", "EdTech", "E-commerce", "Consulting", "AI"]) {
    if (text.toLowerCase().includes(ind.toLowerCase())) preferredIndustries.push(ind);
  }

  const preferredLocations: string[] = [];
  for (const loc of ["Remote", "Bengaluru", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune", "Chennai"]) {
    if (text.toLowerCase().includes(loc.toLowerCase())) {
      preferredLocations.push(loc === "Bangalore" ? "Bengaluru" : loc);
    }
  }

  const draft = sanitizeParsedDraft({
    name,
    education,
    degree,
    college,
    graduationYear,
    skills,
    interests: Array.from(new Set(interests)),
    careerGoals,
    experienceSummary,
    experiences,
    preferredIndustries: Array.from(new Set(preferredIndustries)),
    preferredLocations: Array.from(new Set(preferredLocations)),
    linkedinUrl: linkedin,
    githubUrl: github,
    portfolioUrl: portfolio,
  });

  return finalizeParsedProfile(draft, "heuristic");
}

function finalizeParsedProfile(draft: ParsedDraft, source: "ai" | "heuristic"): ParsedResumeProfile {
  const cleaned = sanitizeParsedDraft(draft);
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  const checks: Array<[string, boolean]> = [
    ["name", Boolean(cleaned.name && cleaned.name.trim().length > 1)],
    ["education", Boolean(cleaned.education)],
    ["degree", Boolean(cleaned.degree)],
    ["college", Boolean(cleaned.college)],
    ["graduationYear", cleaned.graduationYear != null],
    ["skills", (cleaned.skills?.length ?? 0) > 0],
    ["interests", (cleaned.interests?.length ?? 0) > 0],
    ["careerGoals", Boolean(cleaned.careerGoals && cleaned.careerGoals.trim().length >= 10)],
    ["experienceSummary", Boolean(cleaned.experienceSummary)],
    ["experiences", (cleaned.experiences?.length ?? 0) > 0],
  ];

  for (const [key, ok] of checks) {
    if (ok) filledFields.push(key);
    else if (
      (REQUIRED_ONBOARDING_FIELDS as readonly string[]).includes(key) ||
      key === "interests" ||
      key === "experienceSummary" ||
      key === "graduationYear"
    ) {
      // experiences is optional — only list as missing when no summary either (for UX hints)
      missingFields.push(key);
    }
  }

  return {
    ...cleaned,
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
  opts?: { maxTokens?: number },
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const maxTokens = opts?.maxTokens ?? Number(process.env.AI_MAX_TOKENS || 1200);

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
          experiences: [],
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
      [
        "You are CareerVerse onboarding parser. Extract ONLY facts present in the resume. Never invent.",
        "Return JSON matching the schema. Use null for unknown scalars and [] for unknown arrays.",
        "Rules:",
        "- degree: short credential only (e.g. BCA, B.Tech in CSE, Diploma). Max ~60 chars. NEVER paste experience/project prose.",
        "- college: institution name only if explicitly present; otherwise null. Do not invent.",
        "- skills: clean array of skill tokens only (React.js, Next.js). Strip section labels like SKILLS, Languages and Frameworks, Backend, Cloud and Database.",
        "- experienceSummary: put SUMMARY / profile / experience paragraphs here.",
        "- experiences: array of {company, months, start, end, responsibilities} ONLY when work/internship entries are clear. Otherwise []. Never invent companies.",
        "- careerGoals: short intent only (roles seeking / objective). NEVER copy the full summary. If no explicit objective/goals, use null.",
        "- interests: only from Interests/Hobbies section; else [].",
      ].join(" "),
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
          experiences: fallback.experiences ?? [],
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
      const merged = sanitizeParsedDraft({
        name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : fallback.name,
        education:
          typeof parsed.education === "string" && parsed.education.trim()
            ? parsed.education.trim()
            : fallback.education,
        degree: typeof parsed.degree === "string" && parsed.degree.trim() ? parsed.degree.trim() : fallback.degree,
        college:
          typeof parsed.college === "string" && parsed.college.trim() ? parsed.college.trim() : fallback.college,
        graduationYear:
          typeof parsed.graduationYear === "number" &&
          parsed.graduationYear >= 1980 &&
          parsed.graduationYear <= 2040
            ? parsed.graduationYear
            : fallback.graduationYear,
        skills:
          Array.isArray(parsed.skills) && parsed.skills.length
            ? parsed.skills.map(String).slice(0, 40)
            : fallback.skills,
        interests:
          Array.isArray(parsed.interests) && parsed.interests.length
            ? parsed.interests.map(String).slice(0, 20)
            : fallback.interests,
        careerGoals:
          typeof parsed.careerGoals === "string" && parsed.careerGoals.trim()
            ? parsed.careerGoals.trim().slice(0, 2000)
            : fallback.careerGoals,
        experienceSummary:
          typeof parsed.experienceSummary === "string" && parsed.experienceSummary.trim()
            ? parsed.experienceSummary.trim().slice(0, 2000)
            : fallback.experienceSummary,
        experiences: (() => {
          const fromAi = sanitizeExperiences(parsed.experiences);
          return fromAi.length ? fromAi : fallback.experiences ?? [];
        })(),
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
      });

      // Prefer heuristic degree/skills if AI still returned garbage after sanitize emptied them
      if (!merged.degree && fallback.degree) merged.degree = fallback.degree;
      if (!merged.skills.length && fallback.skills.length) merged.skills = fallback.skills;
      if (!merged.experienceSummary && fallback.experienceSummary) {
        merged.experienceSummary = fallback.experienceSummary;
      }
      if (!(merged.experiences?.length) && fallback.experiences?.length) {
        merged.experiences = fallback.experiences;
      }
      if (!merged.careerGoals && fallback.careerGoals) merged.careerGoals = fallback.careerGoals;

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
    const ctx = input.ctx;
    const skills = ctx?.skills ?? [];
    const gapsFromCtx = (ctx?.skillGaps ?? []).filter(Boolean);
    const catalogGaps = Array.from(
      new Set(CAREER_CATALOG.flatMap((c) => missingFrom(c.skills, skills))),
    ).slice(0, 12);
    const skillGaps = gapsFromCtx.length ? gapsFromCtx : catalogGaps;
    const topPaths =
      ctx?.topPaths?.length
        ? ctx.topPaths
        : buildMatches({
            skills,
            interests: ctx?.interests ?? [],
            preferredIndustries: ctx?.preferredIndustries ?? [],
            preferredLocations: ctx?.preferredLocations ?? [],
            profileCompleteness: ctx?.profileCompleteness ?? 0,
            careerGoals: ctx?.careerGoals ?? null,
            experienceSummary: ctx?.experienceSummary ?? null,
            workPreference: ctx?.workPreference ?? null,
            careerStage: ctx?.careerStage ?? null,
          }).map((m) => m.title);

    // Defense in depth — route should refuse before quota; keep here too.
    if (isCareerChatOffTopic(input.message)) {
      const skillHint = skills.slice(0, 4).join(", ") || "your listed skills";
      const pathHint = topPaths[0] || "your target role";
      return {
        reply: [
          OFF_TOPIC_REPLY,
          `Want a career angle instead? Ask how this connects to ${pathHint}, how to show ${skillHint} on your resume, or what to do today/this week toward that path.`,
        ].join("\n"),
      };
    }

    const heuristicReply = (() => {
      const q = norm(input.message);
      const skillList = skills.length ? skills.slice(0, 8).join(", ") : "none listed yet";
      const gapList = skillGaps.length
        ? skillGaps.slice(0, 6).join(", ")
        : "none computed yet — complete profile + run Career Intelligence";

      if (
        /\b(skill\s*gaps?|gaps?\s*in\s*(my\s*)?skills?|missing\s*skills?|what\s*(am\s*i|i'?m)\s*missing|close\s*(the\s*)?gap)\b/.test(
          q,
        ) ||
        (q.includes("gap") && (q.includes("skill") || q.includes("missing")))
      ) {
        const top = topPaths[0] ? ` for ${topPaths[0]}` : "";
        return [
          `Here’s what your CareerVerse profile suggests${top}:`,
          `• Skills you already have: ${skillList}`,
          `• Priority skill gaps: ${gapList}`,
          skillGaps[0]
            ? `Today/this week: pick one gap (“${skillGaps[0]}”), ship a small project or certificate proof, then add it on Profile and re-run Career Intelligence.`
            : "Add more skills and goals on Profile, then regenerate Career Intelligence so I can name concrete gaps.",
          "Want me to draft a 7-day plan for the top gap, or open Roadmaps for that path?",
        ].join("\n");
      }

      if (/\b(career|path|role)\b/.test(q) && /\b(right|fit|match|suit|best|recommend)\b/.test(q)) {
        const paths = topPaths.slice(0, 3).join("; ") || "run Career Intelligence for ranked paths";
        return `Top paths from your profile: ${paths}. Compare them by missing skills and next actions—not score alone. Skills on file: ${skillList}.`;
      }

      if (/\bresume\b/.test(q)) {
        return `Upload/analyze under Resume Intelligence for a target role. With skills (${skillList}), emphasize truthful keywords and quantified outcomes. Re-upload after edits.`;
      }

      if (/\b(this week|today|next steps?|what should i do|plan)\b/.test(q)) {
        return [
          "Today / this week (profile-aware):",
          `1) Close one gap${skillGaps[0] ? `: ${skillGaps[0]}` : ""} with a tiny public artifact.`,
          "2) Tailor resume for one target role and re-analyze.",
          "3) Save 3 matched opportunities in Applications.",
          "4) Message one mentor or peer in Network.",
        ].join("\n");
      }

      if (/\b(interview|prep)\b/.test(q)) {
        const role = topPaths[0] || "your target role";
        return `For ${role}: prepare 3 STAR stories from your experience, review fundamentals tied to gaps (${gapList}), and practice aloud. I can generate likely questions if you name the role.`;
      }

      if (ctx && (skills.length || ctx.careerGoals)) {
        return `I see ${skills.length} skills on your profile${ctx.careerGoals ? ` and goals around “${ctx.careerGoals.slice(0, 80)}”` : ""}. Ask about skill gaps, career fit, resume, interview prep, or a weekly plan — I’ll answer from your data.`;
      }

      return "I can help with career fit, skill gaps, opportunities, resume feedback, interview prep, and weekly plans. Complete onboarding or ask a specific question so I can use your profile.";
    })();

    const raw = await callOpenAICompatible(
      [
        "You are CareerVerse Copilot — career/resume/job-seeker coach ONLY.",
        "Refuse off-topic questions (general encyclopedia, homework, weather, entertainment) politely in 1–2 sentences and redirect to career/resume/skills/interview/job-search.",
        "Ground answers in the provided profile context (skills, gaps, goals, topPaths, experience). Never invent credentials.",
        "Prefer concrete today/this-week actions when advising next steps.",
        "Keep replies concise (under ~180 words).",
        "Never reply with a generic greeting or capability list if the user asked a specific in-scope question.",
        'Return JSON only: {"reply":"..."}',
      ].join(" "),
      JSON.stringify({
        message: input.message.slice(0, CHAT_INPUT_MAX_CHARS),
        history: input.history?.slice(-6),
        context: ctx
          ? {
              name: ctx.name,
              skills: ctx.skills?.slice(0, 20),
              skillGaps: skillGaps.slice(0, 10),
              topPaths: topPaths.slice(0, 4),
              interests: ctx.interests?.slice(0, 10),
              goals: ctx.careerGoals?.slice(0, 200) ?? null,
              stage: ctx.careerStage,
              careerScore: ctx.careerScore,
              experienceSummary: ctx.experienceSummary?.slice(0, 320),
              resumeExcerpt: ctx.resumeText?.slice(0, 400) || null,
            }
          : null,
        heuristicHint: heuristicReply.slice(0, 600),
      }),
      { maxTokens: CHAT_MAX_OUTPUT_TOKENS },
    );

    const parsed = safeParse(raw, { reply: heuristicReply });
    let reply = (parsed.reply || heuristicReply).trim();

    // Reject canned greetings / capability dumps when the user asked something specific
    const looksLikeGreeting =
      /^(hi|hello|hey)\b/i.test(reply) ||
      (/careerverse copilot/i.test(reply) && /ask about/i.test(reply)) ||
      (/i can help with career fit/i.test(reply) && norm(input.message).length > 12);

    if (looksLikeGreeting && heuristicReply && !/^(hi|hello)/i.test(heuristicReply)) {
      reply = heuristicReply;
    }

    return { reply };
  }
}


export const aiService: AIService = new CareerVerseAIService();
export { CAREER_CATALOG, DISCLAIMER, heuristicParseResumeProfile };
