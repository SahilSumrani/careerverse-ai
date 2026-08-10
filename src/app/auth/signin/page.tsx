"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
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

function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function routeAfterAuth(onboardingComplete: boolean) {
    const callback = params.get("callbackUrl");
    const dest = onboardingComplete ? callback || "/dashboard" : "/onboarding";
    window.location.assign(dest);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error || res?.ok === false) {
        setError("Invalid email or password.");
        return;
      }
      const me = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      const data = me.ok ? await me.json() : null;
      await routeAfterAuth(Boolean(data?.user?.onboardingComplete));
    } catch {
      setError("Unable to sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setGoogleBusy(true);
    setError("");
    try {
      await completeGoogleAuth({ callbackUrl: params.get("callbackUrl") });
    } catch (err) {
      const msg = googleAuthErrorMessage(err);
      if (msg) setError(msg);
      setGoogleBusy(false);
    }
  }

  return (
    <div className="cv-auth-shell">
      <div className="cv-auth-form-pane">
        <div className="cv-auth-form-inner">
          <Link href="/" className="cv-auth-brand">
            <span className="cv-auth-brand-mark">CV</span>
            CareerVerse AI
          </Link>
          <h1>Welcome Back!</h1>
          <p className="cv-auth-lead">
            Sign in to access your recruiting workspace and keep hiring with clear signal.
          </p>

          <form onSubmit={onSubmit}>
            <div className="cv-auth-field">
              <label htmlFor="email">Email</label>
              <div className="cv-auth-input-wrap">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
              <div className="cv-auth-forgot">
                <Link href="/auth/forgot-password">Forgot Password?</Link>
              </div>
            </div>
            {error ? <p className="cv-auth-error">{error}</p> : null}
            <button type="submit" className="cv-auth-primary" disabled={busy || googleBusy}>
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="cv-auth-or">OR</div>

          <button type="button" className="cv-auth-social" disabled={busy || googleBusy} onClick={() => void onGoogle()}>
            <GoogleMark />
            {googleBusy ? "Connecting Google…" : "Continue with Google"}
          </button>

          <p className="cv-auth-foot">
            Don&apos;t have an Account? <Link href="/auth/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      <aside className="cv-auth-panel" aria-label="CareerVerse highlights">
        <h2>Hire with signal, not noise</h2>
        <div className="cv-auth-quote">
          <div className="cv-auth-quote-mark">“</div>
          <p>
            CareerVerse turned opaque rankings into clear strengths and gaps—our hiring managers finally trust the
            shortlist.
          </p>
          <div className="cv-auth-quote-by">
            <span className="cv-auth-avatar">AR</span>
            <div>
              <strong>Anika Rao</strong>
              <span>Head of Talent at Northstar</span>
            </div>
          </div>
        </div>
        <div className="cv-auth-logos">
          <div className="cv-auth-logos-label">TRUSTED BY RECRUITING TEAMS</div>
          <div className="cv-auth-logo-grid">
            <span>Northstar</span>
            <span>Harbor</span>
            <span>Cascade</span>
            <span>Orbit</span>
            <span>BrightPath</span>
            <span>Vertex HR</span>
            <span>Lumen Ops</span>
            <span>Fieldwork</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="cv-auth-shell" style={{ placeItems: "center" }}>Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
