"use client";

import { useState } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";

export default function HrRegisterPage() {
  const [creds, setCreds] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [company, setCompany] = useState({
    companyName: "",
    companyWebsite: "",
    jobTitle: "",
    companySize: "11-50",
    phone: "",
  });
  const { error, busy, submit } = useRegisterSubmit();

  return (
    <RegisterShell
      title="Company / HR registration"
      lead="Register your company first. Job posting unlocks only after CareerVerse approves your recruiter account."
      panelTitle="Companies register before posting"
      panelBody="You get an HR account immediately, but /recruiter posting stays locked until an admin sets recruiterApproved."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(
            {
              track: "hr",
              ...creds,
              companyName: company.companyName,
              companyWebsite: company.companyWebsite || undefined,
              jobTitle: company.jobTitle,
              companySize: company.companySize,
              phone: company.phone || undefined,
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
          emailPlaceholder="you@company.com"
        />
        <div className="cv-auth-field">
          <label htmlFor="companyName">Company name</label>
          <div className="cv-auth-input-wrap">
            <input
              id="companyName"
              placeholder="Acme Pvt Ltd"
              value={company.companyName}
              onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
              required
              minLength={2}
              maxLength={120}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="jobTitle">Your job title</label>
          <div className="cv-auth-input-wrap">
            <input
              id="jobTitle"
              placeholder="Talent Acquisition Lead"
              value={company.jobTitle}
              onChange={(e) => setCompany({ ...company, jobTitle: e.target.value })}
              required
              minLength={2}
              maxLength={80}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="companyWebsite">Company website (optional)</label>
          <div className="cv-auth-input-wrap">
            <input
              id="companyWebsite"
              type="url"
              placeholder="https://company.com"
              value={company.companyWebsite}
              onChange={(e) => setCompany({ ...company, companyWebsite: e.target.value })}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="companySize">Company size</label>
          <div className="cv-auth-input-wrap">
            <select
              id="companySize"
              value={company.companySize}
              onChange={(e) => setCompany({ ...company, companySize: e.target.value })}
            >
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="phone">Phone (optional)</label>
          <div className="cv-auth-input-wrap">
            <input
              id="phone"
              type="tel"
              placeholder="+91 …"
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              minLength={7}
              maxLength={24}
            />
          </div>
        </div>
        {error ? <p className="cv-auth-error">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit company registration"}
        </button>
      </form>
    </RegisterShell>
  );
}
