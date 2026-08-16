"use client";

import { useEffect, useState } from "react";
import {
  AuthCredentialsFields,
  RegisterShell,
  useRegisterSubmit,
} from "@/components/auth/register-form";
import {
  completeGoogleAuth,
  googleAuthBusyLabel,
  googleAuthErrorMessage,
  prefetchGoogleAuth,
  type GoogleAuthPhase,
} from "@/lib/google-auth";

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

export default function StudentRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as "STUDENT" | "PROFESSIONAL",
  });
  const [showPass, setShowPass] = useState(false);
  const [googlePhase, setGooglePhase] = useState<GoogleAuthPhase>("idle");
  const { error, busy, setError, submit } = useRegisterSubmit();
  const googleBusy = googlePhase !== "idle";

  useEffect(() => {
    prefetchGoogleAuth();
  }, []);

  async function onGoogle() {
    if (googleBusy) return;
    setError("");
    try {
      await completeGoogleAuth({ onPhase: setGooglePhase });
    } catch (err) {
      const msg = googleAuthErrorMessage(err);
      if (msg) setError(msg);
      setGooglePhase("idle");
    }
  }

  return (
    <RegisterShell
      title="Student / job seeker"
      lead="Create your account, then complete a short career onboarding with resume and goals."
      panelTitle="Built for early careers"
      panelBody="Explore real openings, save roles, track applications, and get AI career guidance after you finish onboarding."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(
            {
              track: "student",
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
            },
            form.password,
            form.email,
          );
        }}
      >
        <AuthCredentialsFields
          form={form}
          setForm={(next) => setForm({ ...form, ...next })}
          showPass={showPass}
          setShowPass={setShowPass}
        />
        <div className="cv-auth-field">
          <label htmlFor="role">I am a</label>
          <div className="cv-auth-input-wrap">
            <select
              id="role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "STUDENT" | "PROFESSIONAL" })
              }
            >
              <option value="STUDENT">Student / early career</option>
              <option value="PROFESSIONAL">Working professional</option>
            </select>
          </div>
        </div>
        {error ? <p className="cv-auth-error">{error}</p> : null}
        <button type="submit" className="cv-auth-primary" disabled={busy || googleBusy}>
          {busy ? "Creating account…" : "Create student account"}
        </button>
      </form>

      <div className="cv-auth-or">OR</div>
      <button type="button" className="cv-auth-social" disabled={busy || googleBusy} onClick={() => void onGoogle()}>
        <GoogleMark />
        {googleAuthBusyLabel(googlePhase)}
      </button>
    </RegisterShell>
  );
}
