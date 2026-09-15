import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";

export const FIELD_LABELS: Record<string, string> = {
  name: "Full name",
  education: "Education level",
  degree: "Degree",
  college: "College / university",
  graduationYear: "Graduation year",
  skills: "Skills",
  interests: "Interests",
  careerGoals: "Career goals",
  experienceSummary: "Experience summary",
  experiences: "Experience",
};

interface StepResumeUploadProps {
  resumeName: string;
  resumeUploading: boolean;
  onUploadResume: (file: File) => Promise<void>;
  autofilled: string[];
  parseMissing: string[];
}

export function StepResumeUpload({
  resumeName,
  resumeUploading,
  onUploadResume,
  autofilled,
  parseMissing,
}: StepResumeUploadProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>Upload your resume</h2>
      <p>
        PDF or DOCX first. CareerVerse parses text and auto-fills education, skills, and goals where it finds
        evidence—never invents qualifications.
      </p>
      <label className={`cv-onboard-upload${resumeName ? " is-ready" : ""}`}>
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf"
          hidden
          disabled={resumeUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUploadResume(file);
          }}
        />
        {resumeName ? (
          <CheckCircle2 className="h-8 w-8 text-[#225aea]" />
        ) : (
          <Upload className="h-8 w-8 text-[#667085]" />
        )}
        <strong>
          {resumeUploading
            ? "Uploading & analyzing…"
            : resumeName
              ? "Resume uploaded"
              : "Drop resume here or browse"}
        </strong>
        <span>{resumeName || "PDF / DOCX up to 5MB"}</span>
      </label>
      {resumeName ? (
        <p className="cv-onboard-file">
          <FileText className="h-4 w-4" /> {resumeName}
        </p>
      ) : null}
      {autofilled.length > 0 ? (
        <div className="cv-onboard-notice is-ok">
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <strong>Auto-filled from resume</strong>
            <p>{autofilled.map((f) => FIELD_LABELS[f] || f).join(", ")}</p>
          </div>
        </div>
      ) : null}
      {parseMissing.length > 0 && resumeName ? (
        <div className="cv-onboard-notice is-warn">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <strong>Still needed — review upcoming steps</strong>
            <ul>
              {parseMissing.map((f) => (
                <li key={f}>{FIELD_LABELS[f] || f}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
