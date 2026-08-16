"use client";

import { useState, type ReactNode } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";

export default function MentorRegisterPage() {
  const [creds, setCreds] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [profile, setProfile] = useState({
    phone: "",
    jobTitle: "",
    currentOrganization: "",
    headline: "",
    expertise: "",
    yearsExperience: "3",
    bio: "",
    linkedinUrl: "",
    mentoringExperience: "",
    motivation: "",
    achievements: "",
    availabilityDays: "",
    hoursPerWeek: "2",
    languages: "",
    menteeAudience: "",
  });
  const [consent, setConsent] = useState(false);
  const { error, busy, submit } = useRegisterSubmit();

  return (
    <RegisterShell
      title="Mentor application"
      lead="Complete your professional profile, mentoring focus, and availability for admin review."
      panelTitle="Mentors are reviewed"
      panelBody="CareerVerse verifies experience and profile quality before mentors become discoverable to students."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(
            {
              track: "mentor",
              ...creds,
              ...profile,
              yearsExperience: Number(profile.yearsExperience),
              hoursPerWeek: Number(profile.hoursPerWeek),
              consent,
            },
            creds.password,
            creds.email,
            {
              successMessage:
                "Mentor application submitted successfully. CareerVerse will review your profile before activation.",
            },
          );
        }}
      >
        <fieldset className="cv-auth-section">
          <legend>Contact details</legend>
          <AuthCredentialsFields
            form={creds}
            setForm={setCreds}
            showPass={showPass}
            setShowPass={setShowPass}
          />
          <Field label="Phone number" id="phone">
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              required
            />
          </Field>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Professional background</legend>
          <div className="cv-auth-grid">
            <Field label="Current job title" id="jobTitle">
              <input
                id="jobTitle"
                value={profile.jobTitle}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                required
              />
            </Field>
            <Field label="Current organisation" id="currentOrganization">
              <input
                id="currentOrganization"
                value={profile.currentOrganization}
                onChange={(e) => setProfile({ ...profile, currentOrganization: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Professional headline" id="headline">
            <input
              id="headline"
              placeholder="Senior engineer · Product and career mentor"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              required
              minLength={5}
              maxLength={120}
            />
          </Field>
          <Field label="Expertise areas (comma separated)" id="expertise">
            <input
              id="expertise"
              placeholder="React, system design, career coaching"
              value={profile.expertise}
              onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
              required
            />
          </Field>
          <div className="cv-auth-grid">
            <Field label="Years of experience" id="yearsExperience">
              <input
                id="yearsExperience"
                type="number"
                min={0}
                max={50}
                value={profile.yearsExperience}
                onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })}
                required
              />
            </Field>
            <Field label="LinkedIn profile" id="linkedinUrl">
              <input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/…"
                value={profile.linkedinUrl}
                onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="cv-auth-field">
            <label htmlFor="bio">Professional bio</label>
            <textarea
              id="bio"
              className="cv-auth-textarea"
              rows={4}
              placeholder="Describe your career journey and the value you bring (min 40 characters)"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              required
              minLength={40}
              maxLength={2000}
            />
          </div>
          <div className="cv-auth-field">
            <label htmlFor="achievements">Key accomplishments</label>
            <textarea
              id="achievements"
              className="cv-auth-textarea"
              rows={3}
              value={profile.achievements}
              onChange={(e) => setProfile({ ...profile, achievements: e.target.value })}
              required
              minLength={20}
              maxLength={2000}
            />
          </div>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Mentoring fit</legend>
          <div className="cv-auth-field">
            <label htmlFor="motivation">Why do you want to mentor?</label>
            <textarea
              id="motivation"
              className="cv-auth-textarea"
              rows={4}
              value={profile.motivation}
              onChange={(e) => setProfile({ ...profile, motivation: e.target.value })}
              required
              minLength={40}
              maxLength={2000}
            />
          </div>
          <div className="cv-auth-field">
            <label htmlFor="mentoringExperience">Previous mentoring experience (optional)</label>
            <textarea
              id="mentoringExperience"
              className="cv-auth-textarea"
              rows={3}
              placeholder="Formal or informal mentoring, coaching, teaching, or team leadership"
              value={profile.mentoringExperience}
              onChange={(e) => setProfile({ ...profile, mentoringExperience: e.target.value })}
              maxLength={2000}
            />
          </div>
          <Field label="Who can you help?" id="menteeAudience">
            <input
              id="menteeAudience"
              placeholder="e.g. Students and frontend developers with 0–2 years experience"
              value={profile.menteeAudience}
              onChange={(e) => setProfile({ ...profile, menteeAudience: e.target.value })}
              required
            />
          </Field>
          <div className="cv-auth-grid">
            <Field label="Available days" id="availabilityDays">
              <input
                id="availabilityDays"
                placeholder="Weekday evenings, Saturday"
                value={profile.availabilityDays}
                onChange={(e) => setProfile({ ...profile, availabilityDays: e.target.value })}
                required
              />
            </Field>
            <Field label="Hours available per week" id="hoursPerWeek">
              <input
                id="hoursPerWeek"
                type="number"
                min={1}
                max={40}
                value={profile.hoursPerWeek}
                onChange={(e) => setProfile({ ...profile, hoursPerWeek: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Languages" id="languages">
            <input
              id="languages"
              placeholder="English, Hindi"
              value={profile.languages}
              onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
              required
            />
          </Field>
        </fieldset>

        <label className="cv-auth-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>I confirm that this information is accurate and consent to profile review.</span>
        </label>

        {error ? <p className="cv-auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit mentor application"}
        </button>
      </form>
    </RegisterShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="cv-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="cv-auth-input-wrap">{children}</div>
    </div>
  );
}
