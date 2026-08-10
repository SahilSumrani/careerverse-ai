"use client";

import { signInWithGooglePopup } from "@/lib/firebase-auth-client";
import { signIn } from "next-auth/react";

export type GoogleAuthResult = {
  ok: true;
  isNewUser: boolean;
  onboardingComplete: boolean;
};

/**
 * Firebase Google popup → verified NextAuth session via idToken bridge.
 * Returns onboarding flags from the authorize payload (JWT includes them).
 */
export async function completeGoogleAuth(): Promise<GoogleAuthResult> {
  const { idToken } = await signInWithGooglePopup();
  const res = await signIn("firebase", { idToken, redirect: false });
  if (res?.error) {
    throw new Error("Google sign-in failed");
  }

  const me = await fetch("/api/auth/me", { cache: "no-store" });
  if (!me.ok) {
    throw new Error("Unable to establish session");
  }
  const data = (await me.json()) as {
    user?: { onboardingComplete?: boolean; isNewUser?: boolean };
  };

  return {
    ok: true,
    isNewUser: Boolean(data.user?.isNewUser),
    onboardingComplete: Boolean(data.user?.onboardingComplete),
  };
}

export function googleAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
  if (code === "auth/unauthorized-domain") {
    return "Add localhost (and your deploy domain) under Firebase Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/popup-closed-by-user") return "";
  if (err instanceof Error && err.message) return err.message;
  return "Unable to sign in with Google.";
}
