import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Firebase Admin for server routes (Firestore + optional Storage).
 *
 * Vercel / local env (pick one auth mode):
 * 1) Service account JSON fields:
 *    FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 *    FIREBASE_CLIENT_EMAIL
 *    FIREBASE_PRIVATE_KEY  (escape newlines as \n in env)
 * 2) Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS / GCP runtime)
 */
function resolveProjectId() {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    ""
  );
}

function buildCredential() {
  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    return {
      credential: cert({
        projectId: projectId || undefined,
        clientEmail,
        privateKey,
      }),
      projectId: projectId || undefined,
    };
  }

  // ADC / Cloud Run / Firebase App Hosting — projectId still helps when set
  return { projectId: projectId || undefined };
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  if (!hasFirebaseAdminCredentials() && !resolveProjectId()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) and either FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or use Application Default Credentials.",
    );
  }

  if (!hasFirebaseAdminCredentials()) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (service account JSON) for Vercel/local Firestore writes.",
    );
  }

  return initializeApp(buildCredential());
}

export function getAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}

export function hasFirebaseAdminCredentials(): boolean {
  return Boolean(
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}
