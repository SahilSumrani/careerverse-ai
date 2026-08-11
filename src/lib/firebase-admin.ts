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
 *    FIREBASE_PRIVATE_KEY  (JSON private_key; literal \n OK; quotes optional)
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

/**
 * Normalize FIREBASE_PRIVATE_KEY from Vercel/local env into a PEM string.
 * Env UIs often store the JSON `private_key` with literal `\n` and/or wrapping quotes.
 */
function normalizeFirebasePrivateKey(raw: string): string {
  let key = raw.trim();

  // Strip one layer of wrapping double quotes (common when pasting JSON string values)
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1).trim();
  }

  // Convert escaped newlines (and Windows \\r\\n) to real line breaks
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  // Normalize any real CRLF sequences to LF
  key = key.replace(/\r\n/g, "\n");

  const hasPemHeaders =
    key.includes("-----BEGIN PRIVATE KEY-----") &&
    key.includes("-----END PRIVATE KEY-----");

  if (!hasPemHeaders) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is invalid: missing PEM BEGIN/END PRIVATE KEY headers. " +
        "Copy the full `private_key` value from your Firebase service account JSON " +
        "(including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----, " +
        "with \\n escaped newlines). Paste into Vercel as-is; surrounding quotes are optional.",
    );
  }

  return key;
}

function buildCredential() {
  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKeyRaw) {
    const privateKey = normalizeFirebasePrivateKey(privateKeyRaw);
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

function resolveStorageBucket() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    ""
  );
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

  const cred = buildCredential();
  const storageBucket = resolveStorageBucket();
  return initializeApp({
    ...cred,
    ...(storageBucket ? { storageBucket } : {}),
  });
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
