"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "./onboarding.css";

const STEPS = [
  { id: "basics", title: "About you", desc: "Name and how you use CareerVerse" },
  { id: "resume", title: "Resume", desc: "Upload a PDF or DOCX for parsing" },
  { id: "background", title: "Background", desc: "Education and experience" },
  { id: "skills", title: "Skills", desc: "Skills, interests, and strengths" },
  { id: "goals", title: "Goals", desc: "Career goals and preferences" },
  { id: "finish", title: "Generate", desc: "Create your explainable profile" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    careerScore: number;
    strengths: string[];
    skillGaps: string[];
    suitablePaths: Array<{ title: string; score: number }>;
    recommendedActions: string[];
    disclaimer: string;
  } | null>(null);

  const [form, setForm] = useState({
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

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  async function uploadResume(file: File) {
    setResumeUploading(true);
    setError("");
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
    if (step === 0) return form.name.trim().length > 1;
    if (step === 1) return Boolean(resumeName); // resume required for new users
    if (step === 3) return form.skills.trim().length > 0;
    if (step === 4) return form.careerGoals.trim().length > 0;
    return true;
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
      <div className="cv-onboard-shell">
        <aside className="cv-onboard-rail">
          <p className="cv-onboard-brand">
            CareerVerse <span>AI</span>
          </p>
          <h1>Set up your profile</h1>
          <p className="cv-onboard-lead">
            A short flow so we can score fit fairly—name, resume, skills, and goals. Existing users skip this after Google
            sign-in.
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

            {step === 1 && (
              <div className="cv-onboard-fields">
                <h2>Upload your resume</h2>
                <p>PDF or DOCX. We extract text to power explainable scoring—never invent qualifications.</p>
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
                  {resumeName ? <CheckCircle2 className="h-8 w-8 text-[#225aea]" /> : <Upload className="h-8 w-8 text-[#667085]" />}
                  <strong>{resumeUploading ? "Uploading & analyzing…" : resumeName ? "Resume uploaded" : "Drop resume here or browse"}</strong>
                  <span>{resumeName || "PDF / DOCX up to 5MB"}</span>
                </label>
                {resumeName ? (
                  <p className="cv-onboard-file">
                    <FileText className="h-4 w-4" /> {resumeName}
                  </p>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="cv-onboard-fields">
                <h2>Education & experience</h2>
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
                  placeholder="AI, Product, Startups"
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
                  placeholder="I want to become an AI Product Manager within 2 years..."
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
                  <Button onClick={() => void generate()} disabled={busy}>
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
