"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { completeGoogleAuth, googleAuthErrorMessage } from "@/lib/google-auth";
import "@/components/auth/auth-shell.css";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.8H12z"
      />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function onGoogle() {
    setGoogleBusy(true);
    setError("");
    try {
      await completeGoogleAuth();
    } catch (err) {
      const msg = googleAuthErrorMessage(err);
      if (msg) setError(msg);
      setGoogleBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      setError(data.error || "Unable to create account");
      return;
    }
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setBusy(false);
    if (login?.error) {
      setError("Account created. Please sign in.");
      router.push("/auth/signin");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="cv-auth-shell">
      <div className="cv-auth-form-pane">
        <div className="cv-auth-form-inner">
          <Link href="/" className="cv-auth-brand">
            <span className="cv-auth-brand-mark">CV</span>
            CareerVerse AI
          </Link>
          <h1>Create your account</h1>
          <p className="cv-auth-lead">
            Start free—we’ll guide you through a short onboarding with resume upload and career goals.
          </p>

          <form onSubmit={onSubmit}>
            <div className="cv-auth-field">
              <label htmlFor="name">Full name</label>
              <div className="cv-auth-input-wrap">
                <User size={18} />
                <input
                  id="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="cv-auth-field">
              <label htmlFor="email">Email</label>
              <div className="cv-auth-input-wrap">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                  type={showPass ? "text" : "password"}
                  placeholder="Create a password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  onClick={() => setShowPass((v) => !v)}
                  style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "#98a2b3" }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="cv-auth-field">
              <label htmlFor="role">I am a</label>
              <div className="cv-auth-input-wrap">
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="STUDENT">Student / Job seeker</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="HR">HR / Recruiter</option>
                  <option value="FOUNDER">Founder</option>
                  <option value="SPEAKER">Speaker</option>
                </select>
              </div>
            </div>
            {error ? <p className="cv-auth-error">{error}</p> : null}
            <button type="submit" className="cv-auth-primary" disabled={busy || googleBusy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="cv-auth-or">OR</div>

          <button type="button" className="cv-auth-social" disabled={busy || googleBusy} onClick={() => void onGoogle()}>
            <GoogleMark />
            {googleBusy ? "Connecting Google…" : "Continue with Google"}
          </button>

          <p className="cv-auth-foot">
            Already have an Account? <Link href="/auth/signin">Sign In</Link>
          </p>
        </div>
      </div>

      <aside className="cv-auth-panel" aria-label="CareerVerse highlights">
        <h2>Build a career profile recruiters trust</h2>
        <div className="cv-auth-quote">
          <div className="cv-auth-quote-mark">“</div>
          <p>
            Uploading my resume once gave me explainable match scores across roles—no more guessing what to improve.
          </p>
          <div className="cv-auth-quote-by">
            <span className="cv-auth-avatar">JS</span>
            <div>
              <strong>Jordan Singh</strong>
              <span>UX designer · early career</span>
            </div>
          </div>
        </div>
        <div className="cv-auth-logos">
          <div className="cv-auth-logos-label">WHAT YOU GET</div>
          <div className="cv-auth-logo-grid">
            <span>AI scoring</span>
            <span>Resume parse</span>
            <span>Voice screens</span>
            <span>Hiring alerts</span>
            <span>Role bank</span>
            <span>Events</span>
            <span>Mentors</span>
            <span>Dashboard</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
