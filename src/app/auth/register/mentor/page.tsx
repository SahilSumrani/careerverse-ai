"use client";

import { useState } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";

export default function MentorRegisterPage() {
  const [creds, setCreds] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [profile, setProfile] = useState({
    headline: "",
    expertise: "",
    yearsExperience: "3",
    bio: "",
    linkedinUrl: "",
  });
  const { error, busy, submit } = useRegisterSubmit();

  return (
    <RegisterShell
      title="Mentor registration"
      lead="Tell us who you mentor and what you know. An admin reviews every mentor account before it goes live."
      panelTitle="Mentors are reviewed"
      panelBody="You can sign in after registering. Mentoring features unlock once PLATFORM_ADMIN approves your profile."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(
            {
              track: "mentor",
              ...creds,
              ...profile,
              yearsExperience: Number(profile.yearsExperience),
            },
            creds.password,
            creds.email,
          );
        }}
      >
        <AuthCredentialsFields
          form={creds}
          setForm={setCreds}
          showPass={showPass}
          setShowPass={setShowPass}
        />
        <div className="cv-auth-field">
          <label htmlFor="headline">Professional headline</label>
          <div className="cv-auth-input-wrap">
            <input
              id="headline"
              placeholder="e.g. Senior engineer · 8 yrs product"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              required
              minLength={5}
              maxLength={120}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="expertise">Expertise areas</label>
          <div className="cv-auth-input-wrap">
            <input
              id="expertise"
              placeholder="React, system design, career coaching"
              value={profile.expertise}
              onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
              required
              minLength={3}
              maxLength={200}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="years">Years of experience</label>
          <div className="cv-auth-input-wrap">
            <input
              id="years"
              type="number"
              min={0}
              max={50}
              value={profile.yearsExperience}
              onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="bio">Short bio</label>
          <textarea
            id="bio"
            className="cv-auth-textarea"
            rows={4}
            placeholder="Who you help and how you mentor (min 40 characters)"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            required
            minLength={40}
            maxLength={2000}
          />
        </div>
        <div className="cv-auth-field">
          <label htmlFor="linkedin">LinkedIn URL (optional)</label>
          <div className="cv-auth-input-wrap">
            <input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={profile.linkedinUrl}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
            />
          </div>
        </div>
        {error ? <p className="cv-auth-error">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit mentor registration"}
        </button>
      </form>
    </RegisterShell>
  );
}
