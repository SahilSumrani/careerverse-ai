export type CareerScoreBreakdown = {
  skills: number;
  experience: number;
  resume: number;
  projects: number;
  careerAlignment: number;
  profileCompleteness: number;
};

export type CareerMatch = {
  title: string;
  score: number;
  why: string[];
  alreadyHave: string[];
  missing: string[];
  nextActions: string[];
};

export type CareerAnalysisResult = {
  disclaimer: string;
  careerScore: number;
  breakdown: CareerScoreBreakdown;
  strengths: string[];
  interests: string[];
  suitablePaths: CareerMatch[];
  skillGaps: string[];
  recommendedActions: string[];
};

export type OpportunityMatchResult = {
  score: number;
  reasons: string[];
  strengths: string[];
  gaps: string[];
  improveActions: string[];
  disclaimer: string;
};

export type ResumeAnalysisResult = {
  disclaimer: string;
  score: number;
  structure: string;
  skills: string[];
  keywords: string[];
  achievements: string[];
  clarity: string;
  atsNotes: string;
  roleAlignment: string;
  recommendations: string[];
};

/** Structured experience row extracted from a resume when parseable. */
export type ParsedExperience = {
  company: string;
  months: number | null;
  start: string;
  end: string;
  responsibilities: string;
};

/** Fields extracted from resume text for onboarding auto-fill. */
export type ParsedResumeProfile = {
  name?: string | null;
  education?: string | null;
  degree?: string | null;
  college?: string | null;
  graduationYear?: number | null;
  skills: string[];
  interests: string[];
  careerGoals?: string | null;
  experienceSummary?: string | null;
  /** Structured experiences when resume blocks map cleanly; else []. Never invented. */
  experiences?: ParsedExperience[];
  preferredIndustries: string[];
  preferredLocations: string[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  filledFields: string[];
  missingFields: string[];
  source: "ai" | "heuristic";
};

export type InterviewPrepResult = {
  likelyQuestions: string[];
  behavioralQuestions: string[];
  roleSpecificQuestions: string[];
  resumeBasedQuestions: string[];
  checklist: string[];
  answerGuidance: string[];
};

export type RoadmapResult = {
  goal: string;
  stages: Array<{
    key: string;
    title: string;
    items: string[];
  }>;
};

export type UserCareerContext = {
  name?: string | null;
  education?: string | null;
  degree?: string | null;
  college?: string | null;
  graduationYear?: number | null;
  skills: string[];
  interests: string[];
  careerGoals?: string | null;
  experienceSummary?: string | null;
  preferredIndustries: string[];
  preferredLocations: string[];
  workPreference?: string | null;
  careerStage?: string | null;
  profileCompleteness: number;
  resumeText?: string | null;
  /** From cached career analysis when available */
  skillGaps?: string[];
  topPaths?: string[];
  careerScore?: number | null;
};

export interface AIService {
  careerAnalysis(ctx: UserCareerContext): Promise<CareerAnalysisResult>;
  careerRecommendations(ctx: UserCareerContext): Promise<CareerMatch[]>;
  resumeAnalysis(input: {
    resumeText: string;
    targetRole?: string;
    ctx?: UserCareerContext;
  }): Promise<ResumeAnalysisResult>;
  parseResumeProfile(input: { resumeText: string }): Promise<ParsedResumeProfile>;
  jobMatching(input: {
    ctx: UserCareerContext;
    opportunity: {
      title: string;
      description: string;
      skills: string[];
      eligibility?: string | null;
      type: string;
    };
  }): Promise<OpportunityMatchResult>;
  interviewPreparation(input: {
    targetRole: string;
    jobDescription?: string;
    resumeText?: string;
    experienceLevel?: string;
    ctx?: UserCareerContext;
  }): Promise<InterviewPrepResult>;
  roadmapGeneration(input: {
    careerTitle: string;
    ctx: UserCareerContext;
  }): Promise<RoadmapResult>;
  chat(input: {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    ctx?: UserCareerContext;
  }): Promise<{ reply: string }>;
}
