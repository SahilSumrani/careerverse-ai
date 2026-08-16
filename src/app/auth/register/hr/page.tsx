"use client";

import { useState, type ReactNode } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";

export default function HrRegisterPage() {
  const [creds, setCreds] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [company, setCompany] = useState({
    companyName: "",
    companyType: "PRIVATE_LIMITED",
    registrationNumber: "",
    gstNumber: "",
    industry: "",
    companyWebsite: "",
    jobTitle: "",
    companySize: "11-50",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pinCode: "",
    companyDescription: "",
  });
  const [consent, setConsent] = useState(false);
  const { error, busy, submit } = useRegisterSubmit();

  return (
    <RegisterShell
      title="Company / HR registration"
      lead="Register the company and authorised contact before posting any opportunity."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit({ track: "hr", ...creds, ...company, consent });
        }}
      >
        <fieldset className="cv-auth-section">
          <legend>Authorised contact</legend>
          <AuthCredentialsFields
            form={creds}
            setForm={setCreds}
            showPass={showPass}
            setShowPass={setShowPass}
            emailPlaceholder="you@company.com"
          />
          <div className="cv-auth-grid">
            <Field label="Job title" id="jobTitle">
              <input
                id="jobTitle"
                placeholder="Talent Acquisition Lead"
                value={company.jobTitle}
                onChange={(e) => setCompany({ ...company, jobTitle: e.target.value })}
                required
              />
            </Field>
            <Field label="Mobile number" id="phone">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Company identity</legend>
          <Field label="Company / organisation name" id="companyName">
            <input
              id="companyName"
              autoComplete="organization"
              value={company.companyName}
              onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
              required
            />
          </Field>
          <div className="cv-auth-grid">
            <Field label="Company type" id="companyType">
              <select
                id="companyType"
                value={company.companyType}
                onChange={(e) => setCompany({ ...company, companyType: e.target.value })}
              >
                <option value="LLP">LLP</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="PRIVATE_LIMITED">Private limited</option>
                <option value="PUBLIC_LIMITED">Public limited</option>
                <option value="SOLE_PROPRIETORSHIP">Sole proprietorship</option>
                <option value="NON_PROFIT">Non-profit</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Company size" id="companySize">
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
            </Field>
          </div>
          <div className="cv-auth-grid">
            <Field label="Registration / CIN number" id="registrationNumber">
              <input
                id="registrationNumber"
                value={company.registrationNumber}
                onChange={(e) => setCompany({ ...company, registrationNumber: e.target.value })}
                required
              />
            </Field>
            <Field label="GST number (optional)" id="gstNumber">
              <input
                id="gstNumber"
                value={company.gstNumber}
                onChange={(e) => setCompany({ ...company, gstNumber: e.target.value.toUpperCase() })}
                maxLength={20}
              />
            </Field>
          </div>
          <Field label="Industry" id="industry">
            <input
              id="industry"
              placeholder="e.g. Information Technology"
              value={company.industry}
              onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              required
            />
          </Field>
          <Field label="Company website (optional)" id="companyWebsite">
            <input
              id="companyWebsite"
              type="url"
              placeholder="https://company.com"
              value={company.companyWebsite}
              onChange={(e) => setCompany({ ...company, companyWebsite: e.target.value })}
            />
          </Field>
          <div className="cv-auth-field">
            <label htmlFor="companyDescription">Company description</label>
            <textarea
              id="companyDescription"
              className="cv-auth-textarea"
              rows={4}
              placeholder="What the company does, its products, and hiring focus (min 40 characters)"
              value={company.companyDescription}
              onChange={(e) => setCompany({ ...company, companyDescription: e.target.value })}
              required
              minLength={40}
              maxLength={2000}
            />
          </div>
        </fieldset>

        <fieldset className="cv-auth-section">
          <legend>Registered address</legend>
          <Field label="Address line 1" id="address1">
            <input
              id="address1"
              autoComplete="address-line1"
              value={company.address1}
              onChange={(e) => setCompany({ ...company, address1: e.target.value })}
              required
            />
          </Field>
          <Field label="Address line 2 (optional)" id="address2">
            <input
              id="address2"
              autoComplete="address-line2"
              value={company.address2}
              onChange={(e) => setCompany({ ...company, address2: e.target.value })}
            />
          </Field>
          <div className="cv-auth-grid">
            <Field label="City" id="city">
              <input
                id="city"
                autoComplete="address-level2"
                value={company.city}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                required
              />
            </Field>
            <Field label="State" id="state">
              <input
                id="state"
                autoComplete="address-level1"
                value={company.state}
                onChange={(e) => setCompany({ ...company, state: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="PIN code" id="pinCode">
            <input
              id="pinCode"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              value={company.pinCode}
              onChange={(e) => setCompany({ ...company, pinCode: e.target.value })}
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
          <span>I confirm that I am authorised to represent this company and the information is accurate.</span>
        </label>

        {error ? <p className="cv-auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit company registration"}
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
