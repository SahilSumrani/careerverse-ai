import { describe, expect, it } from "vitest";
import {
  computeMonths,
  deriveExperienceSummary,
  parseExperienceEntries,
  sanitizeExperiences,
} from "@/lib/experiences";

describe("experiences helpers", () => {
  it("computes months between start and Present", () => {
    const months = computeMonths("2024-01", "Present");
    expect(months).toBeGreaterThanOrEqual(1);
  });

  it("parses clear experience blocks without inventing", () => {
    const block = `
Acme Labs — Frontend Intern | Jan 2023 – Jun 2023
• Built React dashboards
• Shipped accessibility fixes

Beta Corp
Jul 2023 – Present
• Owned design system tokens
`;
    const entries = parseExperienceEntries(block);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].company.toLowerCase()).toContain("acme");
    expect(entries[0].start).toBeTruthy();
    expect(entries.every((e) => e.company.trim().length > 0)).toBe(true);
  });

  it("returns empty array for ambiguous prose", () => {
    expect(parseExperienceEntries("Built cool things for clients.")).toEqual([]);
  });

  it("derives a summary join for AI/dashboard", () => {
    const summary = deriveExperienceSummary([
      {
        company: "Acme",
        months: 6,
        start: "2023-01",
        end: "2023-06",
        responsibilities: "Built UI",
      },
    ]);
    expect(summary).toContain("Acme");
    expect(summary).toContain("Built UI");
  });

  it("sanitizes stored experience arrays", () => {
    expect(
      sanitizeExperiences([
        { company: "  Acme ", months: 3, start: "2022-01", end: "Present", responsibilities: "x" },
        { company: "", months: 1 },
        null,
      ]),
    ).toEqual([
      {
        company: "Acme",
        months: 3,
        start: "2022-01",
        end: "Present",
        responsibilities: "x",
      },
    ]);
  });
});
