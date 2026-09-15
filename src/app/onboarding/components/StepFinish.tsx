import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FIELD_LABELS } from "./StepResumeUpload";

export type CareerAnalysisResult = {
  careerScore: number;
  strengths: string[];
  skillGaps: string[];
  suitablePaths: Array<{ title: string; score: number }>;
  recommendedActions: string[];
  disclaimer: string;
};

interface StepFinishProps {
  hardMissing: string[];
  allowGenerateWithWarnings: boolean;
  setAllowGenerateWithWarnings: (val: boolean) => void;
  analysis: CareerAnalysisResult | null;
  busy: boolean;
  canGenerate: boolean;
  onGenerate: () => Promise<void>;
  onNavigateDashboard: () => void;
}

export function StepFinish({
  hardMissing,
  allowGenerateWithWarnings,
  setAllowGenerateWithWarnings,
  analysis,
  busy,
  canGenerate,
  onGenerate,
  onNavigateDashboard,
}: StepFinishProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>Generate My Career Profile</h2>
      <p>
        We’ll create strengths, suitable paths, skill gaps, and next actions from your inputs—without fabricating
        qualifications.
      </p>

      {hardMissing.length > 0 ? (
        <div className="cv-onboard-notice is-warn">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <strong>Missing required details</strong>
            <ul>
              {hardMissing.map((f) => (
                <li key={f}>{FIELD_LABELS[f] || f}</li>
              ))}
            </ul>
            <label className="cv-onboard-check">
              <input
                type="checkbox"
                checked={allowGenerateWithWarnings}
                onChange={(e) => setAllowGenerateWithWarnings(e.target.checked)}
              />
              Continue anyway with warnings (name + skills still required)
            </label>
          </div>
        </div>
      ) : (
        <div className="cv-onboard-notice is-ok">
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <strong>Profile looks ready</strong>
            <p>All required fields are present. Generate when you’re happy with the review.</p>
          </div>
        </div>
      )}

      {analysis ? (
        <div className="cv-onboard-result">
          <div className="cv-onboard-result-head">
            <p>Career Score {analysis.careerScore}</p>
            <Badge tone="accent">AI-generated estimate</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{analysis.disclaimer}</p>
          <div>
            <p className="text-sm font-medium">Top paths</p>
            <ul className="mt-1 space-y-1 text-sm">
              {analysis.suitablePaths.slice(0, 3).map((p) => (
                <li key={p.title}>
                  {p.title} — {p.score}%
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Skill gaps</p>
            <p className="text-sm text-muted-foreground">{analysis.skillGaps.slice(0, 6).join(", ")}</p>
          </div>
          <Button onClick={onNavigateDashboard}>Go to dashboard</Button>
        </div>
      ) : (
        <Button onClick={() => void onGenerate()} disabled={busy || !canGenerate}>
          {busy ? "Analyzing your career profile…" : "Generate My Career Profile"}
        </Button>
      )}
    </div>
  );
}
