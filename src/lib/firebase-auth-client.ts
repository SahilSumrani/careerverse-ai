"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { signOut as authjsSignOut } from "next-auth/react";
import { getFirebaseAuth, getFirebaseAnalytics, getFirebaseDb } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let authWarmed = false;

/** Prefetch Firebase Auth so the first Google click does not wait on cold SDK init. */
export function warmFirebaseAuth(): void {
  if (typeof window === "undefined" || authWarmed) return;
  try {
    getFirebaseAuth();
    authWarmed = true;
  } catch {
    // Env missing — sign-in will surface a clear error on click.
  }
}

export async function signInWithGooglePopup(): Promise<{ user: User; idToken: string }> {
  warmFirebaseAuth();
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  // Prefer cached token from the popup result; force-refresh only if needed.
  const idToken = await result.user.getIdToken(/* forceRefresh */ false);

  void getFirebaseAnalytics();
  // Never block auth on Firestore (DB may be missing / rules may hang)
  void upsertFirestoreUser(result.user);

  return { user: result.user, idToken };
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Clear Firebase + Auth.js, then hard-navigate to a public page. The navigation is deliberately
 * not gated on the network so a hung sign-out request cannot leave the user parked on a protected
 * route with a dead session.
 */
export async function signOutEverywhere(destination = "/"): Promise<void> {
  // ponytail: fixed 4s ceiling instead of per-provider retries; upgrade when sign-out must report failures.
  await Promise.race([
    Promise.allSettled([signOutFirebase(), authjsSignOut({ redirect: false })]),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
  window.location.replace(destination);
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

async function upsertFirestoreUser(user: User) {
  try {
    const db = getFirebaseDb();
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Firestore may not be provisioned yet; auth still succeeds.
  }
}
