import type { KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/input";

interface StepSkillsInterestsProps {
  skills: string[];
  interests: string[];
  autofilled: string[];
  skillDraft: string;
  setSkillDraft: (val: string) => void;
  interestDraft: string;
  setInterestDraft: (val: string) => void;
  skillSuggestions: string[];
  recommendedInterests: string[];
  onCommitSkill: (raw?: string) => void;
  onRemoveSkill: (skill: string) => void;
  onSkillKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCommitInterest: (raw?: string) => void;
  onRemoveInterest: (interest: string) => void;
  onInterestKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function StepSkillsInterests({
  skills,
  interests,
  autofilled,
  skillDraft,
  setSkillDraft,
  interestDraft,
  setInterestDraft,
  skillSuggestions,
  recommendedInterests,
  onCommitSkill,
  onRemoveSkill,
  onSkillKeyDown,
  onCommitInterest,
  onRemoveInterest,
  onInterestKeyDown,
}: StepSkillsInterestsProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>Skills & interests</h2>
      {autofilled.includes("skills") ? (
        <p className="cv-onboard-hint">Skills detected from your resume — add or remove as needed.</p>
      ) : null}

      <Label>Skills</Label>
      <div className="cv-onboard-chip-field">
        <div className="cv-onboard-chips">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              className="cv-onboard-chip is-selected"
              onClick={() => onRemoveSkill(skill)}
            >
              {skill}
              <X className="h-3 w-3" />
            </button>
          ))}
          <input
            className="cv-onboard-chip-input"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={onSkillKeyDown}
            onBlur={() => {
              if (skillDraft.trim()) onCommitSkill();
            }}
            placeholder={skills.length ? "Add skill" : "Type a skill and press Enter"}
            aria-label="Add skill"
          />
        </div>
      </div>
      {skillSuggestions.length > 0 ? (
        <div className="cv-onboard-suggest-row">
          <span>From resume</span>
          <div className="cv-onboard-chips">
            {skillSuggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                className="cv-onboard-chip is-suggest"
                onClick={() => onCommitSkill(skill)}
              >
                <Plus className="h-3 w-3" />
                {skill}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Label>Interests</Label>
      {recommendedInterests.length > 0 ? (
        <div className="cv-onboard-suggest-row">
          <span>Recommended</span>
          <div className="cv-onboard-chips">
            {recommendedInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                className="cv-onboard-chip is-suggest"
                onClick={() => onCommitInterest(interest)}
              >
                <Plus className="h-3 w-3" />
                {interest}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="cv-onboard-chip-field">
        <div className="cv-onboard-chips">
          {interests.map((interest) => (
            <button
              key={interest}
              type="button"
              className="cv-onboard-chip is-selected is-interest"
              onClick={() => onRemoveInterest(interest)}
            >
              {interest}
              <X className="h-3 w-3" />
            </button>
          ))}
          <input
            className="cv-onboard-chip-input"
            value={interestDraft}
            onChange={(e) => setInterestDraft(e.target.value)}
            onKeyDown={onInterestKeyDown}
            onBlur={() => {
              if (interestDraft.trim()) onCommitInterest();
            }}
            placeholder={interests.length ? "Add interest" : "Type an interest and press Enter"}
            aria-label="Add interest"
          />
        </div>
      </div>
    </div>
  );
}
