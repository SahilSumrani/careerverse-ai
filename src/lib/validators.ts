import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["STUDENT", "PROFESSIONAL", "MENTOR", "HR", "FOUNDER", "SPEAKER"]).default("STUDENT"),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const onboardingSchema = z.object({
  name: z.string().min(2).max(80),
  education: z.string().min(1).max(120),
  degree: z.string().min(1).max(120),
  college: z.string().min(1).max(160),
  graduationYear: z.coerce.number().int().min(1980).max(2040),
  skills: z.array(z.string().min(1)).min(1).max(40),
  interests: z.array(z.string().min(1)).min(1).max(20),
  careerGoals: z.string().min(10).max(2000),
  experienceSummary: z.string().max(2000).optional().or(z.literal("")),
  preferredIndustries: z.array(z.string()).max(15).default([]),
  preferredLocations: z.array(z.string()).max(15).default([]),
  workPreference: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT", "FLEXIBLE"])
    .optional(),
  careerStage: z
    .enum(["STUDENT", "FRESHER", "EARLY_CAREER", "MID_CAREER", "SENIOR", "CAREER_SWITCH", "LEADERSHIP"])
    .optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export const opportunityFilterSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  workMode: z.string().optional(),
  skill: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const applicationUpdateSchema = z.object({
  status: z.enum([
    "SAVED",
    "PREPARING",
    "APPLIED",
    "ASSESSMENT",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
  ]),
  notes: z.string().max(5000).optional(),
  nextAction: z.string().max(500).optional(),
  reminderAt: z.string().datetime().optional().nullable(),
});

export const postSchema = z.object({
  title: z.string().max(160).optional(),
  content: z.string().min(3).max(10000),
  category: z.enum([
    "CAREER",
    "AI",
    "PRODUCT",
    "JOBS",
    "INTERVIEWS",
    "STARTUPS",
    "BUSINESS",
    "TECHNOLOGY",
    "COLLEGE",
    "GENERAL",
  ]),
});

export const connectionRequestSchema = z.object({
  receiverId: z.string().cuid(),
  message: z.string().max(500).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().cuid().optional(),
});
