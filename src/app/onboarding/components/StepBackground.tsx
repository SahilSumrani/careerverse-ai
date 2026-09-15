import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  computeMonths,
  toMonthInputValue,
  type ExperienceFormEntry,
} from "@/lib/experiences";

interface StepBackgroundProps {
  education: string;
  graduationYear: number;
  degree: string;
  college: string;
  experiences: ExperienceFormEntry[];
  autofilled: string[];
  onUpdateForm: (patch: {
    education?: string;
    graduationYear?: number;
    degree?: string;
    college?: string;
  }) => void;
  onAddExperience: () => void;
  onRemoveExperience: (id: string) => void;
  onUpdateExperience: (id: string, patch: Partial<ExperienceFormEntry>) => void;
}

export function StepBackground({
  education,
  graduationYear,
  degree,
  college,
  experiences,
  autofilled,
  onUpdateForm,
  onAddExperience,
  onRemoveExperience,
  onUpdateExperience,
}: StepBackgroundProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>Education & experience</h2>
      {autofilled.some((f) =>
        ["education", "degree", "college", "experienceSummary", "experiences"].includes(f),
      ) ? (
        <p className="cv-onboard-hint">Pre-filled from your resume — edit anything that looks off.</p>
      ) : null}
      <div className="cv-onboard-grid-2">
        <div>
          <Label>Education level</Label>
          <Input
            value={education}
            onChange={(e) => onUpdateForm({ education: e.target.value })}
          />
        </div>
        <div>
          <Label>Graduation year</Label>
          <Input
            type="number"
            value={graduationYear}
            onChange={(e) => onUpdateForm({ graduationYear: Number(e.target.value) })}
          />
        </div>
      </div>
      <Label>Degree</Label>
      <Input
        value={degree}
        onChange={(e) => onUpdateForm({ degree: e.target.value })}
      />
      <Label>College / university</Label>
      <Input
        value={college}
        onChange={(e) => onUpdateForm({ college: e.target.value })}
      />

      <div className="cv-onboard-section-head">
        <div>
          <Label>Experience</Label>
          <p className="cv-onboard-subhint">Add roles or internships. Optional — leave empty if you’re just starting.</p>
        </div>
        <Button type="button" variant="outline" onClick={onAddExperience}>
          <Plus className="h-4 w-4" />
          Add experience
        </Button>
      </div>

      {experiences.length === 0 ? (
        <div className="cv-onboard-empty">
          No experiences yet. Click <strong>Add experience</strong> to include internships, jobs, or freelance work.
        </div>
      ) : (
        <div className="cv-onboard-exp-list">
          {experiences.map((entry, index) => {
            const present = /^present$/i.test(entry.end.trim());
            return (
              <article key={entry.id} className="cv-onboard-exp-card">
                <div className="cv-onboard-exp-card-head">
                  <strong>Experience {index + 1}</strong>
                  <button
                    type="button"
                    className="cv-onboard-icon-btn"
                    aria-label="Delete experience"
                    onClick={() => onRemoveExperience(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Label>Company name</Label>
                <Input
                  value={entry.company}
                  onChange={(e) => onUpdateExperience(entry.id, { company: e.target.value })}
                  placeholder="Acme Corp"
                />
                <div className="cv-onboard-grid-2">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="month"
                      value={toMonthInputValue(entry.start)}
                      onChange={(e) => onUpdateExperience(entry.id, { start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <div className="cv-onboard-end-row">
                      <Input
                        type="month"
                        disabled={present}
                        value={present ? "" : toMonthInputValue(entry.end)}
                        onChange={(e) => onUpdateExperience(entry.id, { end: e.target.value })}
                      />
                      <label className="cv-onboard-present">
                        <input
                          type="checkbox"
                          checked={present}
                          onChange={(e) =>
                            onUpdateExperience(entry.id, {
                              end: e.target.checked ? "Present" : "",
                            })
                          }
                        />
                        Present
                      </label>
                    </div>
                  </div>
                </div>
                <Label>Duration (months)</Label>
                <Input
                  type="number"
                  min={0}
                  max={600}
                  value={entry.months ?? ""}
                  onChange={(e) =>
                    onUpdateExperience(entry.id, {
                      months: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder={
                    entry.start
                      ? String(computeMonths(entry.start, entry.end || "Present") ?? "")
                      : "Auto from dates"
                  }
                />
                <Label>Responsibilities</Label>
                <Textarea
                  value={entry.responsibilities}
                  onChange={(e) => onUpdateExperience(entry.id, { responsibilities: e.target.value })}
                  placeholder={"• Built dashboards\n• Collaborated with design"}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
