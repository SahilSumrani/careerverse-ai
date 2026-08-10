import { describe, expect, it } from "vitest";
import { aiService } from "@/lib/ai/service";

describe("AI service fallbacks", () => {
  it("returns explainable career analysis without inventing credentials", async () => {
    const result = await aiService.careerAnalysis({
      name: "Demo Student",
      skills: ["communication", "python", "product management"],
      interests: ["AI", "Product"],
      careerGoals: "Become an AI Product Manager",
      preferredIndustries: ["SaaS"],
      preferredLocations: ["Remote"],
      profileCompleteness: 70,
      education: "Bachelor's",
      degree: "CS",
    });
    expect(result.disclaimer.toLowerCase()).toContain("estimate");
    expect(result.suitablePaths.length).toBeGreaterThan(0);
    expect(result.careerScore).toBeGreaterThan(0);
  });

  it("returns opportunity match disclaimer", async () => {
    const match = await aiService.jobMatching({
      ctx: {
        skills: ["typescript", "react"],
        interests: ["Technology"],
        preferredIndustries: [],
        preferredLocations: [],
        profileCompleteness: 60,
      },
      opportunity: {
        title: "Junior Software Developer (Demo)",
        description: "TypeScript React role",
        skills: ["typescript", "react", "javascript"],
        type: "JOB",
      },
    });
    expect(match.disclaimer.toLowerCase()).toContain("not a guarantee");
    expect(match.score).toBeGreaterThan(50);
  });
});
