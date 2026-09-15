import { clamp } from "@/lib/utils";
import type {
  CareerAnalysisResult,
  CareerMatch,
  OpportunityMatchResult,
  ResumeAnalysisResult,
  UserCareerContext,
} from "@/lib/ai/types";

export const DISCLAIMER =
  "AI-generated estimate based on the information you provided—not an objective measure of your potential or hiring probability.";

export const CAREER_CATALOG: Array<{ title: string; skills: string[]; interests: string[] }> = [
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
    skills: ["sales", "product", "leadership", "resilience", "fundraising", "strategy"],
    interests: ["startups", "business", "leadership"],
  },
];

export function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 1);
}

export function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map(norm));
  return a.filter((x) => setB.has(norm(x)) || [...setB].some((y) => y.includes(norm(x)) || norm(x).includes(y)));
}

export function missingFrom(needed: string[], have: string[]) {
  const haveN = have.map(norm);
  return needed.filter(
    (n) => !haveN.some((h) => h === norm(n) || h.includes(norm(n)) || norm(n).includes(h)),
  );
}

export function scoreProfile(ctx: UserCareerContext): CareerAnalysisResult["breakdown"] {
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

export function buildMatches(ctx: UserCareerContext): CareerMatch[] {
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

export function deterministicCareerAnalysis(ctx: UserCareerContext): CareerAnalysisResult {
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

export function deterministicJobMatch(
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

export function deterministicResumeAnalysis(resumeText: string, targetRole?: string): ResumeAnalysisResult {
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
