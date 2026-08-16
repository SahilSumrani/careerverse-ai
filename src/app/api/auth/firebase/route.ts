import { verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import { upsertUserFromFirebaseClaims } from "@/lib/firebase-user";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { consumeWindowQuota } from "@/lib/rate-limit";

/**
 * Preflight after Google popup: verify ID token + upsert Firestore user.
 * Client then creates the NextAuth JWT session via signIn("firebase").
 */
export async function POST(req: Request) {
  try {
    const body = (await readJsonBody(req, 16_384)) as { idToken?: unknown } | null;
    const idToken = body?.idToken;
    if (typeof idToken !== "string" || !idToken) {
      return jsonError("Missing Firebase ID token", 400);
    }

    const hour = new Date().toISOString().slice(0, 13);
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = (forwarded || req.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
    if (!(await consumeWindowQuota("firebase-auth-ip", ip, 30, hour))) {
      return jsonError("Too many sign-in attempts. Try again later.", 429);
    }

    const claims = await verifyFirebaseIdToken(idToken);
    const user = await upsertUserFromFirebaseClaims(claims);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        isNewUser: user.isNewUser,
      },
    });
  } catch (error) {
    console.error("Firebase preflight failed", error);
    const status = (error as { status?: number }).status;
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Firebase sign-in failed", 401);
  }
}
