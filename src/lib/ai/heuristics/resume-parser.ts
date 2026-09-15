import { parseExperienceEntries, sanitizeExperiences } from "@/lib/experiences";
import type { ParsedResumeProfile } from "@/lib/ai/types";

/** Canonical skill tokens (matched case-insensitively against resume text). */
export const SKILL_LEXICON = [
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

export type ParsedDraft = Omit<ParsedResumeProfile, "filledFields" | "missingFields" | "source">;

export function sectionSlice(text: string, headings: string[], maxLen = 1200): string {
  const lower = text.toLowerCase();
  let best = "";
  for (const h of headings) {
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

export function educationSection(text: string): string {
  return (
    sectionSlice(text, ["education", "academic background", "academics", "qualifications"], 1400) ||
    ""
  );
}

export function cleanDegreeCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.split(/\s*[|,–—]\s*/)[0]?.trim() || s;
  s = s.replace(/\b(20\d{2}|19\d{2})\b.*$/, "").trim();
  if (s.length < 2 || s.length > 60) return null;
  if (PROSE_NOISE.test(s)) return null;
  if (!DEGREE_TOKEN.test(s) && !/^(bachelor|master|diploma|doctorate|associate)/i.test(s)) return null;
  const m = s.match(DEGREE_TOKEN);
  if (!m) return null;
  const start = s.toLowerCase().indexOf(m[0].toLowerCase());
  const phrase = (start >= 0 ? s.slice(start, start + m[0].length + 24) : m[0])
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (phrase.length > 60 || PROSE_NOISE.test(phrase)) return null;
  return phrase;
}

export function cleanCollegeCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, " ").trim();
  if (s.length < 6 || s.length > 120) return null;
  if (PROSE_NOISE.test(s)) return null;
  if (/^(the|a|an|i|we|my|some|any|your|this|that)\b/i.test(s)) return null;
  if (/\b(missing|intentionally|unknown|n\/?a|not available)\b/i.test(s)) return null;
  if (
    !/\b(university|institute|iit|nit|iiit)\b/i.test(s) &&
    !/\b[A-Z][A-Za-z0-9 &.'-]{2,60}\s+College\b(?:\s+of\b)?/i.test(s)
  ) {
    return null;
  }
  if (/^(college|university|institute)\b/i.test(s)) return null;
  return s.slice(0, 120);
}

export function titleCaseSkill(s: string): string {
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

export function isSkillSectionLabel(token: string): boolean {
  return SKILL_SECTION_LABELS.test(token.trim()) || /^(languages?|frameworks?|backend|frontend|cloud|database)s?\s+and\s+/i.test(token);
}

export function cleanSkillList(skills: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of skills) {
    let s = String(raw || "").replace(/\s+/g, " ").trim();
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

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
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

export function looksLikeCareerGoal(text: string): boolean {
  if (!text) return false;
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length < 12 || s.length > 280) return false;
  if (PROSE_NOISE.test(s) && s.length > 160) return false;
  if (/\b(seeking|aspire|aim(?:ing)?|goal|want to|looking for|pursue|career (?:in|as)|target(?:ing)?)\b/i.test(s)) {
    return true;
  }
  if (s.length <= 120 && /\b(developer|engineer|analyst|designer|manager|intern|role|position)\b/i.test(s)) {
    return true;
  }
  return false;
}

export function cleanCareerGoals(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/^(summary|objective|profile|career objective|about me)\s*:?\s*/i, "");
  if (!looksLikeCareerGoal(s)) return null;
  return s.slice(0, 280);
}

export function cleanExperienceSummary(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/^(summary|objective|profile|experience|work experience|projects?)\s*:?\s*/i, "");
  if (s.length < 20) return null;
  return s.slice(0, 900);
}

export function inferEducationLevel(haystack: string): string | null {
  if (/\b(ph\.?d|doctorate)\b/i.test(haystack)) return "Doctorate";
  if (/\b(m\.?tech|m\.?c\.?a\.?|m\.?s\.?|mba|master'?s|m\.?sc)\b/i.test(haystack)) return "Master's";
  if (/\b(b\.?tech|b\.?c\.?a\.?|b\.?e\.?|b\.?s\.?|bachelor'?s|b\.?sc|b\.?a\.?|b\.?com)\b/i.test(haystack)) {
    return "Bachelor's";
  }
  if (/\b(diploma|associate)\b/i.test(haystack)) return "Diploma";
  if (/\b(high school|secondary|class\s*12|hsc)\b/i.test(haystack)) return "High School";
  return null;
}

export function extractDegreeFromEducation(eduText: string, fullText: string): string | null {
  const scope = eduText || fullText;
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

export function extractCollegeFromEducation(eduText: string, fullText: string): string | null {
  const scope = eduText || "";
  const searchIn = scope || "";
  const collegeRe =
    /\b([A-Z][A-Za-z0-9 &.'-]{2,80}(?:University|Institute|IIT|NIT|IIIT)(?:\s+of\s+[A-Za-z ]+)?|[A-Z][A-Za-z0-9 &.'-]{2,60}\s+College(?:\s+of\s+[A-Za-z ]+)?)\b/;

  if (!searchIn) {
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

export function sanitizeParsedDraft(draft: ParsedDraft): ParsedDraft {
  const degree = cleanDegreeCandidate(draft.degree);
  const college = cleanCollegeCandidate(draft.college);
  const skills = cleanSkillList(draft.skills || []);
  let careerGoals = cleanCareerGoals(draft.careerGoals);
  let experienceSummary = cleanExperienceSummary(draft.experienceSummary);

  if (draft.careerGoals && !careerGoals) {
    const maybeExp = cleanExperienceSummary(draft.careerGoals);
    if (maybeExp && (!experienceSummary || experienceSummary.length < maybeExp.length)) {
      experienceSummary = maybeExp;
    }
  }

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

export function heuristicParseResumeProfile(resumeText: string): ParsedResumeProfile {
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

  let experienceSummary =
    cleanExperienceSummary(summaryBlock) ||
    cleanExperienceSummary(experienceBlock);
  let careerGoals = cleanCareerGoals(objectiveBlock);
  if (!careerGoals && objectiveBlock && looksLikeCareerGoal(objectiveBlock.replace(/\s+/g, " "))) {
    careerGoals = cleanCareerGoals(objectiveBlock);
  }
  if (summaryBlock && careerGoals && summaryBlock.includes(careerGoals.slice(0, 40))) {
    if (!looksLikeCareerGoal(careerGoals) || careerGoals.length > 180) {
      experienceSummary = experienceSummary || cleanExperienceSummary(careerGoals);
      careerGoals = null;
    }
  }

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

export function finalizeParsedProfile(draft: ParsedDraft, source: "ai" | "heuristic"): ParsedResumeProfile {
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
