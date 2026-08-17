import { z } from "zod";

const signUpAuthFields = {
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
};

const phoneSchema = z.string().trim().regex(/^[+0-9()\-\s]{7,24}$/, "Enter a valid phone number");
const optionalUrl = z.string().url().optional().or(z.literal(""));

/** Job-seeker / professional registration */
export const studentSignUpSchema = z.object({
  track: z.literal("student"),
  ...signUpAuthFields,
  role: z.enum(["STUDENT", "PROFESSIONAL"]).default("STUDENT"),
  phone: phoneSchema,
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  educationLevel: z.enum(["SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "DOCTORATE", "OTHER"]),
  institution: z.string().trim().min(2).max(160),
  course: z.string().trim().min(2).max(120),
  graduationYear: z.coerce.number().int().min(1980).max(2040),
  skills: z.string().trim().min(2).max(500),
  preferredRole: z.string().trim().min(2).max(120),
  linkedinUrl: optionalUrl,
  hasResume: z.boolean().default(false),
}).strict();

/** Mentor registration — pending until PLATFORM_ADMIN approves */
export const mentorSignUpSchema = z.object({
  track: z.literal("mentor"),
  ...signUpAuthFields,
  phone: phoneSchema,
  jobTitle: z.string().trim().min(2).max(100),
  currentOrganization: z.string().trim().min(2).max(120),
  headline: z.string().min(5).max(120),
  expertise: z.string().min(3).max(200),
  yearsExperience: z.coerce.number().int().min(0).max(50),
  bio: z.string().min(40).max(2000),
  linkedinUrl: z.string().url(),
  mentoringExperience: z.string().max(2000).optional().or(z.literal("")),
  motivation: z.string().min(40).max(2000),
  achievements: z.string().min(20).max(2000),
  availabilityDays: z.string().min(2).max(120),
  hoursPerWeek: z.coerce.number().int().min(1).max(40),
  languages: z.string().min(2).max(200),
  menteeAudience: z.string().min(10).max(500),
  consent: z.literal(true),
}).strict();

/** Company HR registration — can post jobs only after recruiterApproved */
export const hrSignUpSchema = z.object({
  track: z.literal("hr"),
  ...signUpAuthFields,
  companyName: z.string().min(2).max(120),
  companyType: z.enum(["LLP", "PARTNERSHIP", "PRIVATE_LIMITED", "PUBLIC_LIMITED", "SOLE_PROPRIETORSHIP", "NON_PROFIT", "OTHER"]),
  registrationNumber: z.string().trim().min(2).max(80),
  gstNumber: z.string().trim().max(20).optional().or(z.literal("")),
  industry: z.string().trim().min(2).max(100),
  companyWebsite: optionalUrl,
  jobTitle: z.string().min(2).max(80),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  phone: phoneSchema,
  address1: z.string().trim().min(5).max(160),
  address2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pinCode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
  companyDescription: z.string().trim().min(40).max(2000),
  consent: z.literal(true),
}).strict();

export const signUpSchema = z.discriminatedUnion("track", [
  studentSignUpSchema,
  mentorSignUpSchema,
  hrSignUpSchema,
]);

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export const onboardingSchema = z.object({
  name: z.string().min(2).max(80),
  education: z.string().min(1).max(120),
  degree: z.string().min(1).max(120),
  college: z.string().min(1).max(160),
  graduationYear: z.coerce.number().int().min(1980).max(2040),
  skills: z.array(z.string().trim().min(1).max(80)).min(1).max(40),
  interests: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  careerGoals: z.string().min(10).max(2000),
  experienceSummary: z.string().max(2000).optional().or(z.literal("")),
  experiences: z
    .array(
      z.object({
        company: z.string().min(1).max(120),
        months: z.number().int().min(0).max(600).nullable().optional(),
        start: z.string().max(40).optional().or(z.literal("")),
        end: z.string().max(40).optional().or(z.literal("")),
        responsibilities: z.string().max(2000).optional().or(z.literal("")),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  preferredIndustries: z.array(z.string().trim().min(1).max(120)).max(15).default([]),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(15).default([]),
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
    "HIRED",
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
  receiverId: z.string().min(1).max(128),
  message: z.string().max(500).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(300),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(300),
      }),
    )
    .max(10)
    .optional(),
}).strict();

export const adminMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend_user"),
    id: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("unsuspend_user"),
    id: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("set_roles"),
    id: z.string().min(1).max(128),
    roles: z
      .array(
        z.enum([
          "STUDENT",
          "PROFESSIONAL",
          "MENTOR",
          "HR",
          "FOUNDER",
          "SPEAKER",
          "INSTITUTION_ADMIN",
          "PLATFORM_ADMIN",
        ]),
      )
      .min(1)
      .max(8),
  }),
  z.object({
    action: z.literal("seed_starter_jobs"),
  }),
  z.object({
    action: z.literal("approve_recruiter"),
    id: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("revoke_recruiter"),
    id: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("approve_mentor"),
    id: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("revoke_mentor"),
    id: z.string().min(1).max(128),
  }),
]);

export const applicationCreateSchema = z.object({
  opportunityId: z.string().min(1).max(128).optional(),
  opportunity: z
    .object({
      id: z.string().min(1).max(128),
      title: z.string().min(1).max(200),
      organizationName: z.string().max(200).nullable().optional(),
      type: z.string().max(80).optional(),
      isDemo: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().max(5000).optional(),
  nextAction: z.string().max(500).optional(),
  matchScore: z.number().min(0).max(100).nullable().optional(),
});

/** Student-owned status changes — HIRED is recruiter-only. */
export const applicationPatchSchema = z.object({
  id: z.string().min(1).max(128),
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
});

export const recruiterApplicantPatchSchema = z.object({
  applicationId: z.string().min(1).max(128),
  status: z.enum(["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
});

export const opportunityCreateSchema = z.object({
  title: z.string().min(3).max(160),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  type: z.enum(["Full-time", "Internship", "Contract", "Part-time"]).default("Full-time"),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]).default("Hybrid"),
  salary: z.string().max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  blurb: z.string().min(20).max(4000),
});
