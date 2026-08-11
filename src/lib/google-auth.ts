"use client";

import { getSession, signIn } from "next-auth/react";
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
 * Firebase Google popup → NextAuth JWT session → hard navigate.
 * Hard navigation avoids cookie/session races with client router.push.
 *
 * Flow is intentionally lean: one token verify/upsert inside NextAuth authorize
 * (no separate /api/auth/firebase + /api/auth/me round-trips).
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

  const session = await getSession();
  const onboardingComplete = Boolean(session?.user?.onboardingComplete);
  // New Google accounts land on onboarding; treat incomplete as "new" for callers.
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
