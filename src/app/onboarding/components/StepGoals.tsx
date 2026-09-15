import { Input, Label, Select, Textarea } from "@/components/ui/input";

interface StepGoalsProps {
  careerGoals: string;
  preferredIndustries: string;
  preferredLocations: string;
  workPreference: string;
  careerStage: string;
  linkedinUrl: string;
  onUpdateForm: (patch: {
    careerGoals?: string;
    preferredIndustries?: string;
    preferredLocations?: string;
    workPreference?: string;
    careerStage?: string;
    linkedinUrl?: string;
  }) => void;
}

export function StepGoals({
  careerGoals,
  preferredIndustries,
  preferredLocations,
  workPreference,
  careerStage,
  linkedinUrl,
  onUpdateForm,
}: StepGoalsProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>Goals & preferences</h2>
      <Label>Career goals</Label>
      <Textarea
        value={careerGoals}
        onChange={(e) => onUpdateForm({ careerGoals: e.target.value })}
        placeholder="I want to become an AI-focused career coach within 2 years..."
      />
      <Label>Preferred industries</Label>
      <Input
        value={preferredIndustries}
        onChange={(e) => onUpdateForm({ preferredIndustries: e.target.value })}
        placeholder="SaaS, Fintech"
      />
      <Label>Preferred locations</Label>
      <Input
        value={preferredLocations}
        onChange={(e) => onUpdateForm({ preferredLocations: e.target.value })}
        placeholder="Remote, Bengaluru"
      />
      <div className="cv-onboard-grid-2">
        <div>
          <Label>Work preference</Label>
          <Select
            value={workPreference}
            onChange={(e) => onUpdateForm({ workPreference: e.target.value })}
          >
            <option value="FULL_TIME">Full-time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="PART_TIME">Part-time</option>
            <option value="FREELANCE">Freelance</option>
            <option value="CONTRACT">Contract</option>
            <option value="FLEXIBLE">Flexible</option>
          </Select>
        </div>
        <div>
          <Label>Career stage</Label>
          <Select
            value={careerStage}
            onChange={(e) => onUpdateForm({ careerStage: e.target.value })}
          >
            <option value="STUDENT">Student</option>
            <option value="FRESHER">Fresher</option>
            <option value="EARLY_CAREER">Early career</option>
            <option value="MID_CAREER">Mid career</option>
            <option value="SENIOR">Senior</option>
            <option value="CAREER_SWITCH">Career switch</option>
            <option value="LEADERSHIP">Leadership</option>
          </Select>
        </div>
      </div>
      <Label>LinkedIn (optional)</Label>
      <Input
        value={linkedinUrl}
        onChange={(e) => onUpdateForm({ linkedinUrl: e.target.value })}
      />
    </div>
  );
}
