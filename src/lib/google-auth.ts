"use client";

import { signInWithGooglePopup } from "@/lib/firebase-auth-client";
import { signIn } from "next-auth/react";

export type GoogleAuthResult = {
  ok: true;
  isNewUser: boolean;
  onboardingComplete: boolean;
};

function destinationFor(onboardingComplete: boolean, callbackUrl?: string | null) {
  if (onboardingComplete) return callbackUrl || "/dashboard";
  return "/onboarding";
}

/**
 * Firebase Google popup → Prisma upsert → NextAuth JWT session → hard navigate.
 * Hard navigation avoids cookie/session races with client router.push.
 */
export async function completeGoogleAuth(options?: {
  callbackUrl?: string | null;
}): Promise<GoogleAuthResult> {
  const { idToken } = await signInWithGooglePopup();

  const prep = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  const prepData = (await prep.json().catch(() => ({}))) as {
    error?: string;
    user?: { onboardingComplete?: boolean; isNewUser?: boolean };
  };
  if (!prep.ok) {
    throw new Error(prepData.error || "Unable to verify Google account");
  }

  const onboardingComplete = Boolean(prepData.user?.onboardingComplete);
  const isNewUser = Boolean(prepData.user?.isNewUser);

  const res = await signIn("firebase", { idToken, redirect: false });
  if (!res || res.error || res.ok === false) {
    throw new Error("Could not create a secure session. Try again.");
  }

  // Confirm cookie session before leaving the page
  const me = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
  if (!me.ok) {
    throw new Error("Session was not established. Please try Google sign-in again.");
  }

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
