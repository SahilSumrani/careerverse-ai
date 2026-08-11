"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckCircle2, FileText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "./onboarding.css";

const STEPS = [
  { id: "resume", title: "Resume", desc: "Upload PDF/DOCX — we auto-fill what we can" },
  { id: "basics", title: "About you", desc: "Name and how you use CareerVerse" },
  { id: "background", title: "Background", desc: "Education and experience" },
  { id: "skills", title: "Skills", desc: "Skills, interests, and strengths" },
  { id: "goals", title: "Goals", desc: "Career goals and preferences" },
  { id: "finish", title: "Generate", desc: "Create your explainable profile" },
];

const FIELD_LABELS: Record<string, string> = {
  name: "Full name",
  education: "Education level",
  degree: "Degree",
  college: "College / university",
  graduationYear: "Graduation year",
  skills: "Skills",
  interests: "Interests",
  careerGoals: "Career goals",
  experienceSummary: "Experience summary",
};

type FormState = {
  name: string;
  roleIntent: string;
  education: string;
  degree: string;
  college: string;
  graduationYear: number;
  skills: string;
  interests: string;
  careerGoals: string;
  experienceSummary: string;
  preferredIndustries: string;
  preferredLocations: string;
  workPreference: string;
  careerStage: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUrl: string;
};

function computeMissing(form: FormState, hasResume: boolean): string[] {
  const missing: string[] = [];
  if (!hasResume) missing.push("resume");
  if (form.name.trim().length < 2) missing.push("name");
  if (!form.education.trim()) missing.push("education");
  if (!form.degree.trim()) missing.push("degree");
  if (!form.college.trim()) missing.push("college");
  if (!form.skills.trim()) missing.push("skills");
  if (!form.interests.trim()) missing.push("interests");
  if (form.careerGoals.trim().length < 10) missing.push("careerGoals");
  return missing;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [autofilled, setAutofilled] = useState<string[]>([]);
  const [parseMissing, setParseMissing] = useState<string[]>([]);
  const [allowGenerateWithWarnings, setAllowGenerateWithWarnings] = useState(false);
  const [analysis, setAnalysis] = useState<{
    careerScore: number;
    strengths: string[];
    skillGaps: string[];
    suitablePaths: Array<{ title: string; score: number }>;
    recommendedActions: string[];
    disclaimer: string;
  } | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    roleIntent: "STUDENT",
    education: "Bachelor's",
    degree: "",
    college: "",
    graduationYear: new Date().getFullYear(),
    skills: "",
    interests: "",
    careerGoals: "",
    experienceSummary: "",
    preferredIndustries: "",
    preferredLocations: "",
    workPreference: "FULL_TIME",
    careerStage: "STUDENT",
    linkedinUrl: "",
    portfolioUrl: "",
    githubUrl: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=/onboarding");
      return;
    }
    if (status === "authenticated" && session?.user?.onboardingComplete) {
      router.replace("/dashboard");
      return;
    }
    if (session?.user?.name && !form.name) {
      setForm((f) => ({ ...f, name: session.user.name || "" }));
    }
  }, [status, session, router, form.name]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);
  const missingNow = useMemo(() => computeMissing(form, Boolean(resumeName)), [form, resumeName]);
  const hardMissing = missingNow.filter((k) =>
    ["name", "skills", "careerGoals", "education", "degree", "college"].includes(k),
  );

  async function uploadResume(file: File) {
    setResumeUploading(true);
    setError("");
    setToast("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/resume", { method: "POST", body });
    const data = await res.json();
    setResumeUploading(false);
    if (!res.ok) {
      setError(data.error || "Unable to upload resume");
      return;
    }
    setResumeName(data.resume?.fileName || file.name);

    const profile = data.parsedProfile as
      | {
          name?: string | null;
          education?: string | null;
          degree?: string | null;
          college?: string | null;
          graduationYear?: number | null;
          skills?: string[];
          interests?: string[];
          careerGoals?: string | null;
          experienceSummary?: string | null;
          preferredIndustries?: string[];
          preferredLocations?: string[];
          linkedinUrl?: string | null;
          githubUrl?: string | null;
          portfolioUrl?: string | null;
          filledFields?: string[];
          missingFields?: string[];
          source?: string;
        }
      | undefined;

    if (profile) {
      const filled: string[] = [];
      setForm((prev) => {
        const next = { ...prev };
        if (profile.name && !prev.name.trim()) {
          next.name = profile.name;
          filled.push("name");
        }
        if (profile.education) {
          next.education = profile.education;
          filled.push("education");
        }
        if (profile.degree) {
          next.degree = profile.degree;
          filled.push("degree");
        }
        if (profile.college) {
          next.college = profile.college;
          filled.push("college");
        }
        if (profile.graduationYear) {
          next.graduationYear = profile.graduationYear;
          filled.push("graduationYear");
        }
        if (profile.skills?.length) {
          next.skills = profile.skills.join(", ");
          filled.push("skills");
        }
        if (profile.interests?.length) {
          next.interests = profile.interests.join(", ");
          filled.push("interests");
        }
        if (profile.careerGoals) {
          next.careerGoals = profile.careerGoals;
          filled.push("careerGoals");
        }
        if (profile.experienceSummary) {
          next.experienceSummary = profile.experienceSummary;
          filled.push("experienceSummary");
        }
        if (profile.preferredIndustries?.length) {
          next.preferredIndustries = profile.preferredIndustries.join(", ");
          filled.push("preferredIndustries");
        }
        if (profile.preferredLocations?.length) {
          next.preferredLocations = profile.preferredLocations.join(", ");
          filled.push("preferredLocations");
        }
        if (profile.linkedinUrl) next.linkedinUrl = profile.linkedinUrl;
        if (profile.githubUrl) next.githubUrl = profile.githubUrl;
        if (profile.portfolioUrl) next.portfolioUrl = profile.portfolioUrl;
        return next;
      });
      setAutofilled(Array.from(new Set(filled)));
      setParseMissing(profile.missingFields || []);
      const src = profile.source === "ai" ? "AI" : "heuristic";
      if (filled.length) {
        setToast(`Resume parsed (${src}): auto-filled ${filled.length} field${filled.length === 1 ? "" : "s"}. Review before generating.`);
      } else {
        setToast("Resume uploaded. We couldn’t extract much — please complete the next steps.");
      }
    } else {
      setToast("Resume uploaded. Continue to review your profile details.");
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      graduationYear: Number(form.graduationYear),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
      preferredIndustries: form.preferredIndustries.split(",").map((s) => s.trim()).filter(Boolean),
      preferredLocations: form.preferredLocations.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch("/api/profile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Unable to generate career profile");
      return;
    }
    setAnalysis(data.analysis);
    await update({ onboardingComplete: true, name: form.name });
  }

  function canContinue() {
    if (step === 0) return Boolean(resumeName); // resume first & required for students/job seekers
    if (step === 1) return form.name.trim().length > 1;
    if (step === 3) return form.skills.trim().length > 0;
    if (step === 4) return form.careerGoals.trim().length > 0;
    return true;
  }

  function canGenerate() {
    if (hardMissing.length === 0) return true;
    return allowGenerateWithWarnings && form.name.trim().length > 1 && form.skills.trim().length > 0;
  }

  if (status === "loading") {
    return (
      <div className="cv-onboard">
        <div className="cv-onboard-card" style={{ textAlign: "center" }}>
          Loading onboarding…
        </div>
      </div>
    );
  }

  return (
    <div className="cv-onboard">
      {toast ? (
        <div className="cv-onboard-toast" role="status">
          <Sparkles className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      ) : null}

      <div className="cv-onboard-shell">
        <aside className="cv-onboard-rail">
          <p className="cv-onboard-brand">
            CareerVerse <span>AI</span>
          </p>
          <h1>Set up your profile</h1>
          <p className="cv-onboard-lead">
            Start with your resume—we extract what we can, then you review skills and goals for fair, explainable matches.
          </p>
          <ol className="cv-onboard-steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className={i === step ? "is-active" : i < step ? "is-done" : ""}>
                <span>{i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  <em>{s.desc}</em>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <section className="cv-onboard-main">
          <div className="cv-onboard-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p className="cv-onboard-step-label">
            Step {step + 1} of {STEPS.length}: {STEPS[step].title}
          </p>

          <div className="cv-onboard-card">
            {step === 0 && (
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
                      if (file) void uploadResume(file);
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
            )}

            {step === 1 && (
              <div className="cv-onboard-fields">
                <h2>About you</h2>
                <p>We’ll use this across your dashboard and match scores.</p>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Label htmlFor="roleIntent">I am joining as</Label>
                <Select
                  id="roleIntent"
                  value={form.roleIntent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      roleIntent: e.target.value,
                      careerStage: e.target.value === "HR" ? "MID_CAREER" : form.careerStage,
                    })
                  }
                >
                  <option value="STUDENT">Student / Job seeker</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="HR">Recruiter / HR</option>
                  <option value="FOUNDER">Founder</option>
                  <option value="MENTOR">Mentor</option>
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="cv-onboard-fields">
                <h2>Education & experience</h2>
                {autofilled.some((f) => ["education", "degree", "college", "experienceSummary"].includes(f)) ? (
                  <p className="cv-onboard-hint">Pre-filled from your resume — edit anything that looks off.</p>
                ) : null}
                <Label>Education level</Label>
                <Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
                <Label>Degree</Label>
                <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
                <Label>College / university</Label>
                <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
                <Label>Graduation year</Label>
                <Input
                  type="number"
                  value={form.graduationYear}
                  onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })}
                />
                <Label>Experience summary (optional)</Label>
                <Textarea
                  value={form.experienceSummary}
                  onChange={(e) => setForm({ ...form, experienceSummary: e.target.value })}
                  placeholder="Internships, projects, or roles worth highlighting"
                />
              </div>
            )}

            {step === 3 && (
              <div className="cv-onboard-fields">
                <h2>Skills & interests</h2>
                {autofilled.includes("skills") ? (
                  <p className="cv-onboard-hint">Skills detected from your resume — add or remove as needed.</p>
                ) : null}
                <Label>Skills (comma-separated)</Label>
                <Textarea
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="communication, python, product management"
                />
                <Label>Interests (comma-separated)</Label>
                <Textarea
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  placeholder="AI, Design, Startups"
                />
              </div>
            )}

            {step === 4 && (
              <div className="cv-onboard-fields">
                <h2>Goals & preferences</h2>
                <Label>Career goals</Label>
                <Textarea
                  value={form.careerGoals}
                  onChange={(e) => setForm({ ...form, careerGoals: e.target.value })}
                  placeholder="I want to become an AI-focused career coach within 2 years..."
                />
                <Label>Preferred industries</Label>
                <Input
                  value={form.preferredIndustries}
                  onChange={(e) => setForm({ ...form, preferredIndustries: e.target.value })}
                  placeholder="SaaS, Fintech"
                />
                <Label>Preferred locations</Label>
                <Input
                  value={form.preferredLocations}
                  onChange={(e) => setForm({ ...form, preferredLocations: e.target.value })}
                  placeholder="Remote, Bengaluru"
                />
                <Label>Work preference</Label>
                <Select value={form.workPreference} onChange={(e) => setForm({ ...form, workPreference: e.target.value })}>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="FLEXIBLE">Flexible</option>
                </Select>
                <Label>Career stage</Label>
                <Select value={form.careerStage} onChange={(e) => setForm({ ...form, careerStage: e.target.value })}>
                  <option value="STUDENT">Student</option>
                  <option value="FRESHER">Fresher</option>
                  <option value="EARLY_CAREER">Early career</option>
                  <option value="MID_CAREER">Mid career</option>
                  <option value="SENIOR">Senior</option>
                  <option value="CAREER_SWITCH">Career switch</option>
                  <option value="LEADERSHIP">Leadership</option>
                </Select>
                <Label>LinkedIn (optional)</Label>
                <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
              </div>
            )}

            {step === 5 && (
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
                    <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
                  </div>
                ) : (
                  <Button onClick={() => void generate()} disabled={busy || !canGenerate()}>
                    {busy ? "Analyzing your career profile…" : "Generate My Career Profile"}
                  </Button>
                )}
              </div>
            )}

            {error ? <p className="cv-onboard-error">{error}</p> : null}

            <div className="cv-onboard-nav">
              <Button variant="outline" disabled={step === 0 || busy || resumeUploading} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button disabled={!canContinue() || resumeUploading} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
