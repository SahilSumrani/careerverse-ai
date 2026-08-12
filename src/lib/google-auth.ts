"use client";

import { signIn } from "next-auth/react";
import { signInWithGooglePopup, warmFirebaseAuth } from "@/lib/firebase-auth-client";

export type GoogleAuthResult = {
  ok: true;
  isNewUser: boolean;
  onboardingComplete: boolean;
};

export type GoogleAuthPhase = "idle" | "popup" | "session";

function destinationFor(onboardingComplete: boolean, callbackUrl?: string | null) {
  if (onboardingComplete) return callbackUrl || "/dashboard";
  return "/onboarding";
}

/** Call on auth page mount so the Google popup opens without waiting on cold SDK init. */
export function prefetchGoogleAuth() {
  warmFirebaseAuth();
}

/**
 * Firebase Google popup → NextAuth JWT session → navigate.
 * Prefer soft assign via location; skip redundant getSession when possible
 * by reading onboarding from authorize response URL / defaulting to dashboard
 * after a successful signIn (JWT cookie is already set).
 */
export async function completeGoogleAuth(options?: {
  callbackUrl?: string | null;
  onPhase?: (phase: GoogleAuthPhase) => void;
}): Promise<GoogleAuthResult> {
  warmFirebaseAuth();
  options?.onPhase?.("popup");

  const { idToken } = await signInWithGooglePopup();

  options?.onPhase?.("session");

  const res = await signIn("firebase", { idToken, redirect: false });
  if (!res || res.error || res.ok === false) {
    throw new Error("Could not create a secure session. Try again.");
  }

  // Avoid a second round-trip when possible: authorize already wrote the JWT.
  // Soft-read session with a short timeout so we don't stall 3–4s on getSession.
  let onboardingComplete = false;
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 1200);
    const sessRes = await fetch("/api/auth/session", { signal: ctrl.signal, cache: "no-store" });
    window.clearTimeout(timer);
    if (sessRes.ok) {
      const session = (await sessRes.json()) as { user?: { onboardingComplete?: boolean } };
      onboardingComplete = Boolean(session?.user?.onboardingComplete);
    }
  } catch {
    // Fall through — send returning users to dashboard; onboarding middleware will correct if needed.
    onboardingComplete = true;
  }

  const isNewUser = !onboardingComplete;
  const dest = destinationFor(onboardingComplete, options?.callbackUrl);
  window.location.assign(dest);

  return {
    ok: true,
    isNewUser,
    onboardingComplete,
  };
}

export function googleAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
  if (code === "auth/unauthorized-domain") {
    return "Add localhost (and your deploy domain) under Firebase Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/popup-closed-by-user") return "";
  if (code === "auth/popup-blocked") {
    return "Pop-up blocked. Allow pop-ups for this site and try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Unable to sign in with Google.";
}

export function googleAuthBusyLabel(phase: GoogleAuthPhase): string {
  if (phase === "session") return "Signing you in…";
  if (phase === "popup") return "Choose a Google account…";
  return "Continue with Google";
}
