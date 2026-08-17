import { describe, expect, it } from "vitest";
import { computeProfileCompleteness } from "@/lib/profile";
import { clamp, parseJsonArray, toJsonArray } from "@/lib/utils";
import { signUpSchema, onboardingSchema, applicationPatchSchema, recruiterApplicantPatchSchema } from "@/lib/validators";
import { selectTopTalent } from "@/lib/firestore-users";

describe("utils", () => {
  it("parses json arrays and csv fallbacks", () => {
    expect(parseJsonArray('["AI","Product"]')).toEqual(["AI", "Product"]);
    expect(parseJsonArray("AI, Product")).toEqual(["AI", "Product"]);
    expect(toJsonArray(["a", ""])).toBe('["a"]');
    expect(clamp(150, 0, 100)).toBe(100);
  });
});

describe("validators", () => {
  it("validates signup", () => {
    const ok = signUpSchema.safeParse({
      track: "student",
      firstName: "Sahil",
      lastName: "Sumrani",
      email: "sahil@example.com",
      password: "password123",
      role: "STUDENT",
      phone: "+91 98765 43210",
      city: "Mumbai",
      state: "Maharashtra",
      educationLevel: "BACHELORS",
      institution: "Example University",
      course: "Computer Science",
      graduationYear: 2026,
      skills: "TypeScript, React",
      preferredRole: "Software Engineer",
      linkedinUrl: "",
      hasResume: false,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects client-controlled privilege fields", () => {
    const result = signUpSchema.safeParse({
      track: "student",
      firstName: "Sahil",
      lastName: "Sumrani",
      email: "sahil@example.com",
      password: "password123",
      role: "STUDENT",
      roles: ["PLATFORM_ADMIN"],
      phone: "+91 98765 43210",
      city: "Mumbai",
      state: "Maharashtra",
      educationLevel: "BACHELORS",
      institution: "Example University",
      course: "Computer Science",
      graduationYear: 2026,
      skills: "TypeScript, React",
      preferredRole: "Software Engineer",
      linkedinUrl: "",
      hasResume: false,
    });
    expect(result.success).toBe(false);
  });

  it("requires onboarding essentials", () => {
    const bad = onboardingSchema.safeParse({
      name: "A",
      education: "",
      degree: "",
      college: "",
      graduationYear: 2026,
      skills: [],
      interests: [],
      careerGoals: "short",
    });
    expect(bad.success).toBe(false);
  });
});

describe("profile completeness", () => {
  it("scores completeness from filled fields", () => {
    const score = computeProfileCompleteness({
      name: "Demo",
      education: "Bachelor's",
      degree: "CS",
      college: "Demo College",
      graduationYear: 2026,
      skillsCount: 4,
      interestsCount: 2,
      careerGoals: "Become an AI Product Manager with strong portfolio evidence.",
      experienceSummary: "Built campus products and led a student club.",
      preferredIndustriesCount: 1,
      preferredLocationsCount: 1,
      workPreference: "INTERNSHIP",
      careerStage: "STUDENT",
      hasResume: true,
    });
    expect(score).toBeGreaterThan(80);
  });
});

describe("application status ownership", () => {
  it("rejects student self-hire", () => {
    const result = applicationPatchSchema.safeParse({ id: "app-1", status: "HIRED" });
    expect(result.success).toBe(false);
  });

  it("allows recruiter hire", () => {
    const result = recruiterApplicantPatchSchema.safeParse({ applicationId: "app-1", status: "HIRED" });
    expect(result.success).toBe(true);
  });
});

describe("top talent selection", () => {
  it("keeps only 90+ inside the top 20%", () => {
    const scored = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      careerScore: 70 + i * 3,
    }));
    // scores 70,73,76,79,82,85,88,91,94,97 — N=10, k=2, top are 97 and 94, both >= 90
    const picked = selectTopTalent(scored, { minScore: 90, topFraction: 0.2, limit: 50 });
    expect(picked.map((row) => row.careerScore)).toEqual([97, 94]);
  });

  it("drops 90+ students outside the top quintile", () => {
    const scored = [
      { id: "a", careerScore: 99 },
      { id: "b", careerScore: 98 },
      { id: "c", careerScore: 91 },
    ];
    // N=3, k=1, only 99 survives the intersection
    const picked = selectTopTalent(scored, { minScore: 90, topFraction: 0.2 });
    expect(picked).toEqual([{ id: "a", careerScore: 99 }]);
  });
});
