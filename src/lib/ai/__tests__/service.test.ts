import { beforeEach, describe, expect, it } from "vitest";
import { aiService, heuristicParseResumeProfile } from "@/lib/ai/service";

describe("AI service fallbacks", () => {
  beforeEach(() => {
    delete process.env.AI_API_KEY;
  });

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

describe("resume profile parse quality", () => {
  beforeEach(() => {
    delete process.env.AI_API_KEY;
  });

  const messyResume = `
Sahil Developer
sahil@example.com | https://github.com/sahil

SUMMARY
Frontend developer who built based scroll and motion animations to elevate client website UX across SaaS products.

EXPERIENCE
Freelance — built based scroll and motion animations to elevate client website UIs.

EDUCATION
BCA — 2024

SKILLS
Languages and Frameworks: React.js, Next.js, TypeScript
Backend: Node.js, Express
Cloud and Database: Firebase, MongoDB

PROJECTS
Portfolio with Framer Motion
`;

  it("rejects experience prose as degree and strips skill section headers", () => {
    const parsed = heuristicParseResumeProfile(messyResume);
    expect(parsed.degree).toBeTruthy();
    expect(parsed.degree!.toLowerCase()).toContain("bca");
    expect(parsed.degree!.toLowerCase()).not.toContain("scroll");
    expect(parsed.degree!.toLowerCase()).not.toContain("animation");
    expect(parsed.degree!.length).toBeLessThanOrEqual(60);

    expect(parsed.college).toBeNull();
    expect(parsed.missingFields).toContain("college");

    const skillsJoined = parsed.skills.join(", ").toLowerCase();
    expect(skillsJoined).not.toContain("languages and frameworks");
    expect(skillsJoined).not.toMatch(/\bskills\b/);
    expect(parsed.skills.some((s) => /react/i.test(s))).toBe(true);
    expect(parsed.skills.some((s) => /next/i.test(s))).toBe(true);

    expect(parsed.careerGoals).toBeNull();
    expect(parsed.missingFields).toContain("careerGoals");
    expect(parsed.experienceSummary).toBeTruthy();
    expect(parsed.experienceSummary!.toLowerCase()).toContain("frontend");
    expect(parsed.missingFields).toContain("interests");
  });

  it("maps explicit objective to goals and keeps summary in experience", async () => {
    const text = `
Jane Doe
OBJECTIVE
Seeking a frontend developer role in a product SaaS team.
SUMMARY
Built dashboards with React and TypeScript for three clients.
EDUCATION
B.Tech in Computer Science, Demo Institute of Technology, 2023
SKILLS
React, TypeScript, Next.js
INTERESTS
Design, Startups
`;
    const parsed = await aiService.parseResumeProfile({ resumeText: text });
    expect(parsed.careerGoals?.toLowerCase()).toContain("seeking");
    expect(parsed.experienceSummary?.toLowerCase()).toMatch(/react|dashboard/);
    expect(parsed.degree?.toLowerCase()).toMatch(/b\.?tech|bachelor/);
    expect(parsed.college?.toLowerCase()).toContain("institute");
    expect(parsed.interests.length).toBeGreaterThan(0);
    expect(parsed.skills.join(" ").toLowerCase()).not.toContain("languages and frameworks");
  });
});
