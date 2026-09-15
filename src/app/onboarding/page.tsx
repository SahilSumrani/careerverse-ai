"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  computeMonths,
  createExperienceEntry,
  deriveExperienceSummary,
  toStoredExperience,
  type ExperienceFormEntry,
} from "@/lib/experiences";

import { StepResumeUpload } from "./components/StepResumeUpload";
import { StepBasics } from "./components/StepBasics";
import { StepBackground } from "./components/StepBackground";
import { StepSkillsInterests } from "./components/StepSkillsInterests";
import { StepGoals } from "./components/StepGoals";
import { StepFinish, type CareerAnalysisResult } from "./components/StepFinish";

import "./onboarding.css";

const STEPS = [
  { id: "resume", title: "Resume", desc: "Upload PDF/DOCX — we auto-fill what we can" },
  { id: "basics", title: "About you", desc: "Name and how you use CareerVerse" },
  { id: "background", title: "Background", desc: "Education and experience" },
  { id: "skills", title: "Skills", desc: "Skills, interests, and strengths" },
  { id: "goals", title: "Goals", desc: "Career goals and preferences" },
  { id: "finish", title: "Generate", desc: "Create your explainable profile" },
];

const DEFAULT_INTEREST_SUGGESTIONS = [
  "AI",
  "Design",
  "Startups",
  "Product",
  "Data",
  "Open Source",
  "Fintech",
  "EdTech",
  "Research",
  "Leadership",
  "Marketing",
  "DevOps",
];

type FormState = {
  name: string;
  roleIntent: string;
  education: string;
  degree: string;
  college: string;
  graduationYear: number;
  skills: string[];
  interests: string[];
  careerGoals: string;
  experiences: ExperienceFormEntry[];
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
  if (!form.skills.length) missing.push("skills");
  if (!form.interests.length) missing.push("interests");
  if (form.careerGoals.trim().length < 10) missing.push("careerGoals");
  return missing;
}

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function addUniqueToken(list: string[], raw: string, max = 40): string[] {
  const token = normalizeToken(raw);
  if (!token || token.length < 2) return list;
  if (list.some((s) => s.toLowerCase() === token.toLowerCase())) return list;
  if (list.length >= max) return list;
  return [...list, token];
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
  const [skillDraft, setSkillDraft] = useState("");
  const [interestDraft, setInterestDraft] = useState("");
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [resumeInterestHints, setResumeInterestHints] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<CareerAnalysisResult | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    roleIntent: "STUDENT",
    education: "Bachelor's",
    degree: "",
    college: "",
    graduationYear: new Date().getFullYear(),
    skills: [],
    interests: [],
    careerGoals: "",
    experiences: [],
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

  const recommendedInterests = useMemo(() => {
    const selected = new Set(form.interests.map((i) => i.toLowerCase()));
    const pool = [...resumeInterestHints, ...DEFAULT_INTEREST_SUGGESTIONS];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of pool) {
      const key = item.toLowerCase();
      if (selected.has(key) || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 12) break;
    }
    return out;
  }, [form.interests, resumeInterestHints]);

  const skillSuggestions = useMemo(() => {
    const selected = new Set(form.skills.map((s) => s.toLowerCase()));
    return suggestedSkills.filter((s) => !selected.has(s.toLowerCase())).slice(0, 10);
  }, [form.skills, suggestedSkills]);

  function updateExperience(id: string, patch: Partial<ExperienceFormEntry>) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.map((entry) => {
        if (entry.id !== id) return entry;
        const next = { ...entry, ...patch };
        if ("start" in patch || "end" in patch) {
          const computed = computeMonths(next.start, next.end || "Present");
          if (computed != null) next.months = computed;
        }
        return next;
      }),
    }));
  }

  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experiences: [...prev.experiences, createExperienceEntry()],
    }));
  }

  function removeExperience(id: string) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  }

  function commitSkill(raw?: string) {
    const value = raw ?? skillDraft;
    setForm((prev) => ({ ...prev, skills: addUniqueToken(prev.skills, value) }));
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.toLowerCase() !== skill.toLowerCase()),
    }));
  }

  function onSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitSkill();
    } else if (e.key === "Backspace" && !skillDraft && form.skills.length) {
      removeSkill(form.skills[form.skills.length - 1]);
    }
  }

  function commitInterest(raw?: string) {
    const value = raw ?? interestDraft;
    setForm((prev) => ({ ...prev, interests: addUniqueToken(prev.interests, value, 20) }));
    setInterestDraft("");
  }

  function removeInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i.toLowerCase() !== interest.toLowerCase()),
    }));
  }

  function onInterestKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInterest();
    } else if (e.key === "Backspace" && !interestDraft && form.interests.length) {
      removeInterest(form.interests[form.interests.length - 1]);
    }
  }

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
          experiences?: Array<{
            company?: string;
            months?: number | null;
            start?: string;
            end?: string;
            responsibilities?: string;
          }>;
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
      let nextSuggestedSkills: string[] = [];
      let nextInterestHints: string[] = [];
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
          next.skills = profile.skills.map((s) => normalizeToken(s)).filter(Boolean);
          filled.push("skills");
          nextSuggestedSkills = next.skills;
        }
        if (profile.interests?.length) {
          next.interests = profile.interests.map((s) => normalizeToken(s)).filter(Boolean);
          filled.push("interests");
          nextInterestHints = next.interests;
        }
        if (profile.careerGoals) {
          next.careerGoals = profile.careerGoals;
          filled.push("careerGoals");
        }
        if (profile.experienceSummary) {
          next.experienceSummary = profile.experienceSummary;
          filled.push("experienceSummary");
        }
        if (profile.experiences?.length) {
          const mapped = profile.experiences
            .filter((e) => e?.company?.trim())
            .map((e) =>
              createExperienceEntry({
                company: e.company!.trim(),
                months: e.months ?? null,
                start: e.start ?? "",
                end: e.end ?? "",
                responsibilities: e.responsibilities ?? "",
              }),
            );
          if (mapped.length) {
            next.experiences = mapped;
            filled.push("experiences");
          }
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
      if (nextSuggestedSkills.length) setSuggestedSkills(nextSuggestedSkills);
      if (nextInterestHints.length) setResumeInterestHints(nextInterestHints);
      setAutofilled(Array.from(new Set(filled)));
      setParseMissing(profile.missingFields || []);
      const src = profile.source === "ai" ? "AI" : "heuristic";
      if (filled.length) {
        setToast(
          `Resume parsed (${src}): auto-filled ${filled.length} field${filled.length === 1 ? "" : "s"}. Review before generating.`,
        );
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
    const storedExperiences = form.experiences
      .map(toStoredExperience)
      .filter((e) => e.company);
    const derivedSummary =
      deriveExperienceSummary(storedExperiences) || form.experienceSummary.trim() || "";
    const payload = {
      name: form.name,
      education: form.education,
      degree: form.degree,
      college: form.college,
      graduationYear: Number(form.graduationYear),
      skills: form.skills,
      interests: form.interests,
      careerGoals: form.careerGoals,
      experiences: storedExperiences,
      experienceSummary: derivedSummary,
      preferredIndustries: form.preferredIndustries.split(",").map((s) => s.trim()).filter(Boolean),
      preferredLocations: form.preferredLocations.split(",").map((s) => s.trim()).filter(Boolean),
      workPreference: form.workPreference,
      careerStage: form.careerStage,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl,
      githubUrl: form.githubUrl,
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
    if (step === 0) return Boolean(resumeName);
    if (step === 1) return form.name.trim().length > 1;
    if (step === 3) return form.skills.length > 0;
    if (step === 4) return form.careerGoals.trim().length > 0;
    return true;
  }

  function canGenerate() {
    if (hardMissing.length === 0) return true;
    return allowGenerateWithWarnings && form.name.trim().length > 1 && form.skills.length > 0;
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
              <StepResumeUpload
                resumeName={resumeName}
                resumeUploading={resumeUploading}
                onUploadResume={uploadResume}
                autofilled={autofilled}
                parseMissing={parseMissing}
              />
            )}

            {step === 1 && (
              <StepBasics
                name={form.name}
                roleIntent={form.roleIntent}
                careerStage={form.careerStage}
                onUpdate={(patch) => setForm((f) => ({ ...f, ...patch }))}
              />
            )}

            {step === 2 && (
              <StepBackground
                education={form.education}
                graduationYear={form.graduationYear}
                degree={form.degree}
                college={form.college}
                experiences={form.experiences}
                autofilled={autofilled}
                onUpdateForm={(patch) => setForm((f) => ({ ...f, ...patch }))}
                onAddExperience={addExperience}
                onRemoveExperience={removeExperience}
                onUpdateExperience={updateExperience}
              />
            )}

            {step === 3 && (
              <StepSkillsInterests
                skills={form.skills}
                interests={form.interests}
                autofilled={autofilled}
                skillDraft={skillDraft}
                setSkillDraft={setSkillDraft}
                interestDraft={interestDraft}
                setInterestDraft={setInterestDraft}
                skillSuggestions={skillSuggestions}
                recommendedInterests={recommendedInterests}
                onCommitSkill={commitSkill}
                onRemoveSkill={removeSkill}
                onSkillKeyDown={onSkillKeyDown}
                onCommitInterest={commitInterest}
                onRemoveInterest={removeInterest}
                onInterestKeyDown={onInterestKeyDown}
              />
            )}

            {step === 4 && (
              <StepGoals
                careerGoals={form.careerGoals}
                preferredIndustries={form.preferredIndustries}
                preferredLocations={form.preferredLocations}
                workPreference={form.workPreference}
                careerStage={form.careerStage}
                linkedinUrl={form.linkedinUrl}
                onUpdateForm={(patch) => setForm((f) => ({ ...f, ...patch }))}
              />
            )}

            {step === 5 && (
              <StepFinish
                hardMissing={hardMissing}
                allowGenerateWithWarnings={allowGenerateWithWarnings}
                setAllowGenerateWithWarnings={setAllowGenerateWithWarnings}
                analysis={analysis}
                busy={busy}
                canGenerate={canGenerate()}
                onGenerate={generate}
                onNavigateDashboard={() => router.push("/dashboard")}
              />
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
