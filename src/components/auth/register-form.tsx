"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import "@/components/auth/auth-shell.css";

export function RegisterShell({
  title,
  lead,
  panelTitle,
  panelBody,
  children,
}: {
  title: string;
  lead: string;
  panelTitle: string;
  panelBody: string;
  children: ReactNode;
}) {
  return (
    <div className="cv-auth-shell">
      <div className="cv-auth-form-pane">
        <div className="cv-auth-form-inner cv-auth-form-inner--wide">
          <Link href="/" className="cv-auth-brand">
            <span className="cv-auth-brand-mark">CV</span>
            CareerVerse AI
          </Link>
          <p className="cv-auth-back">
            <Link href="/auth/register">← All registration types</Link>
          </p>
          <h1>{title}</h1>
          <p className="cv-auth-lead">{lead}</p>
          {children}
          <p className="cv-auth-foot">
            Already have an Account? <Link href="/auth/signin">Sign In</Link>
          </p>
        </div>
      </div>
      <aside className="cv-auth-panel" aria-label="Registration info">
        <h2>{panelTitle}</h2>
        <p className="cv-auth-panel-copy">{panelBody}</p>
      </aside>
    </div>
  );
}

export function AuthCredentialsFields({
  form,
  setForm,
  showPass,
  setShowPass,
  emailPlaceholder = "you@example.com",
}: {
  form: { firstName: string; lastName: string; email: string; password: string };
  setForm: (next: { firstName: string; lastName: string; email: string; password: string }) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  emailPlaceholder?: string;
}) {
  return (
    <>
      <div className="cv-auth-grid">
        <div className="cv-auth-field">
          <label htmlFor="firstName">First name</label>
          <div className="cv-auth-input-wrap">
            <User size={18} />
            <input
              id="firstName"
              name="given-name"
              autoComplete="given-name"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
        </div>
        <div className="cv-auth-field">
          <label htmlFor="lastName">Last name</label>
          <div className="cv-auth-input-wrap">
            <input
              id="lastName"
              name="family-name"
              autoComplete="family-name"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              minLength={1}
              maxLength={50}
            />
          </div>
        </div>
      </div>
      <div className="cv-auth-field">
        <label htmlFor="email">Work / personal email</label>
        <div className="cv-auth-input-wrap">
          <Mail size={18} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="cv-auth-field">
        <label htmlFor="password">Password</label>
        <div className="cv-auth-input-wrap">
          <Lock size={18} />
          <input
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            aria-label={showPass ? "Hide password" : "Show password"}
            onClick={() => setShowPass(!showPass)}
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "#98a2b3" }}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}

export function useRegisterSubmit() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      next?: string;
    };
    if (!res.ok) {
      setBusy(false);
      setError(data.error || "Unable to create account");
      return;
    }
    router.replace(data.next || "/auth/waitlist");
  }

  return { error, busy, setError, submit };
}
