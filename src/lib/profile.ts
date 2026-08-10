export function computeProfileCompleteness(input: {
  name?: string | null;
  education?: string | null;
  degree?: string | null;
  college?: string | null;
  graduationYear?: number | null;
  skillsCount: number;
  interestsCount: number;
  careerGoals?: string | null;
  experienceSummary?: string | null;
  preferredIndustriesCount: number;
  preferredLocationsCount: number;
  workPreference?: string | null;
  careerStage?: string | null;
  hasResume?: boolean;
}): number {
  const checks = [
    Boolean(input.name),
    Boolean(input.education),
    Boolean(input.degree),
    Boolean(input.college),
    Boolean(input.graduationYear),
    input.skillsCount >= 3,
    input.interestsCount >= 2,
    Boolean(input.careerGoals && input.careerGoals.length > 20),
    Boolean(input.experienceSummary && input.experienceSummary.length > 20),
    input.preferredIndustriesCount > 0,
    input.preferredLocationsCount > 0,
    Boolean(input.workPreference),
    Boolean(input.careerStage),
    Boolean(input.hasResume),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
