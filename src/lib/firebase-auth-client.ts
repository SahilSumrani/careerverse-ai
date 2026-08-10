"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseAnalytics, getFirebaseDb } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGooglePopup(): Promise<{ user: User; idToken: string }> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  void getFirebaseAnalytics();
  await upsertFirestoreUser(result.user);

  return { user: result.user, idToken };
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
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
