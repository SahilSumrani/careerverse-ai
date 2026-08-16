"use client";

import { useState, type ReactNode } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";

export default function StudentRegisterPage() {
  const [creds, setCreds] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [details, setDetails] = useState({
    role: "STUDENT" as "STUDENT" | "PROFESSIONAL",
    phone: "",
    city: "",
    state: "",
    educationLevel: "BACHELORS",
    institution: "",
    course: "",
    graduationYear: String(new Date().getFullYear()),
    skills: "",
    preferredRole: "",
    linkedinUrl: "",
  });
  const [hasResume, setHasResume] = useState(true);
  const [resume, setResume] = useState<File | null>(null);
  const { error, busy, submit } = useRegisterSubmit();

  return (
    <RegisterShell
      title="Student / job seeker registration"
      lead="Complete your contact, education, career, and optional resume details."
      panelTitle="One profile for your career"
      panelBody="Your details improve job matching. If you do not have a resume, choose “I don’t have a resume” and continue."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (hasResume && !resume) {
            window.alert("Please select your resume, or choose “I don’t have a resume”.");
            return;
          }
          void submit(
            {
              track: "student",
              ...creds,
              ...details,
              graduationYear: Number(details.graduationYear),
              hasResume,
            },
            creds.password,
            creds.email,
            {
              resume: hasResume ? resume : null,
              successMessage: hasResume
                ? "Student registration submitted and resume uploaded successfully."
                : "Student registration submitted successfully. You can create or upload a resume later.",
            },
          );
        }}
      >
        <fieldset className="cv-auth-section">
          <legend>Account details</legend>
          <AuthCredentialsFields
            form={creds}
            setForm={setCreds}
            showPass={showPass}
            setShowPass={setShowPass}
          />
          <div className="cv-auth-grid">
            <Field label="Phone number" id="phone">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                required
              />
            </Field>
            <Field label="I am a" id="role">
              <select
                id="role"
                value={details.role}
                onChange={(e) =>
                  setDetails({ ...details, role: e.target.value as "STUDENT" | "PROFESSIONAL" })
                }
              >
                <option value="STUDENT">Student / early career</option>
                <option value="PROFESSIONAL">Working professional</option>
              </select>
            </Field>
          </div>
          <div className="cv-auth-grid">
            <Field label="City" id="city">
              <input
                id="city"
                autoComplete="address-level2"
                value={details.city}
                onChange={(e) => setDetails({ ...details, city: e.target.value })}
                required
              />
            </Field>
            <Field label="State" id="state">
              <input
                id="state"
                autoComplete="address-level1"
                value={details.state}
                onChange={(e) => setDetails({ ...details, state: e.target.value })}
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Education</legend>
          <div className="cv-auth-grid">
            <Field label="Education level" id="educationLevel">
              <select
                id="educationLevel"
                value={details.educationLevel}
                onChange={(e) => setDetails({ ...details, educationLevel: e.target.value })}
              >
                <option value="SCHOOL">School</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="BACHELORS">Bachelor&apos;s</option>
                <option value="MASTERS">Master&apos;s</option>
                <option value="DOCTORATE">Doctorate</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Graduation year" id="graduationYear">
              <input
                id="graduationYear"
                type="number"
                min={1980}
                max={2040}
                value={details.graduationYear}
                onChange={(e) => setDetails({ ...details, graduationYear: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="School / college / university" id="institution">
            <input
              id="institution"
              value={details.institution}
              onChange={(e) => setDetails({ ...details, institution: e.target.value })}
              required
            />
          </Field>
          <Field label="Course / degree" id="course">
            <input
              id="course"
              placeholder="e.g. B.Tech Computer Science"
              value={details.course}
              onChange={(e) => setDetails({ ...details, course: e.target.value })}
              required
            />
          </Field>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Career preferences</legend>
          <Field label="Skills (comma separated)" id="skills">
            <input
              id="skills"
              placeholder="React, Python, communication"
              value={details.skills}
              onChange={(e) => setDetails({ ...details, skills: e.target.value })}
              required
            />
          </Field>
          <Field label="Preferred job role" id="preferredRole">
            <input
              id="preferredRole"
              placeholder="e.g. Frontend Developer"
              value={details.preferredRole}
              onChange={(e) => setDetails({ ...details, preferredRole: e.target.value })}
              required
            />
          </Field>
          <Field label="LinkedIn URL (optional)" id="linkedinUrl">
            <input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={details.linkedinUrl}
              onChange={(e) => setDetails({ ...details, linkedinUrl: e.target.value })}
            />
          </Field>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Resume</legend>
          <div className="cv-auth-choice-row">
            <label>
              <input
                type="radio"
                name="resumeChoice"
                checked={hasResume}
                onChange={() => setHasResume(true)}
              />
              I have a resume
            </label>
            <label>
              <input
                type="radio"
                name="resumeChoice"
                checked={!hasResume}
                onChange={() => {
                  setHasResume(false);
                  setResume(null);
                }}
              />
              I don&apos;t have a resume
            </label>
          </div>
          {hasResume ? (
            <div className="cv-auth-field">
              <label htmlFor="resume">Upload resume (PDF or DOCX, max 5MB)</label>
              <input
                id="resume"
                className="cv-auth-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          ) : (
            <p className="cv-auth-note">No problem—you can build or upload your resume after registration.</p>
          )}
        </fieldset>

        {error ? <p className="cv-auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy}>
          {busy ? "Creating profile…" : "Submit student registration"}
        </button>
      </form>
    </RegisterShell>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="cv-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="cv-auth-input-wrap">{children}</div>
    </div>
  );
}
