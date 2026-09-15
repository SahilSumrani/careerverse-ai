import { sanitizeExperiences } from "@/lib/experiences";
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
import { callOpenAICompatible, safeParse, trackUsage } from "@/lib/ai/providers/client";
import {
  CAREER_CATALOG,
  DISCLAIMER,
  deterministicCareerAnalysis,
  deterministicJobMatch,
  deterministicResumeAnalysis,
  norm,
  missingFrom,
  buildMatches,
} from "@/lib/ai/heuristics/career-heuristics";
import {
  heuristicParseResumeProfile,
  finalizeParsedProfile,
  sanitizeParsedDraft,
} from "@/lib/ai/heuristics/resume-parser";

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
export { CAREER_CATALOG, DISCLAIMER, heuristicParseResumeProfile, deterministicJobMatch };
