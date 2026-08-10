import { describe, expect, it } from "vitest";
import { computeProfileCompleteness } from "@/lib/profile";
import { clamp, parseJsonArray, toJsonArray } from "@/lib/utils";
import { signUpSchema, onboardingSchema } from "@/lib/validators";

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
      name: "Sahil",
      email: "sahil@example.com",
      password: "password123",
      role: "STUDENT",
    });
    expect(ok.success).toBe(true);
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
