import { verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import { upsertUserFromFirebaseClaims } from "@/lib/firebase-user";
import { jsonError, jsonOk } from "@/lib/api";

/**
 * Preflight after Google popup: verify ID token + upsert Prisma user.
 * Client then creates the NextAuth JWT session via signIn("firebase").
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { idToken?: string };
    if (!body.idToken || typeof body.idToken !== "string") {
      return jsonError("Missing Firebase ID token", 400);
    }

    const claims = await verifyFirebaseIdToken(body.idToken);
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
    const message = error instanceof Error ? error.message : "Firebase sign-in failed";
    return jsonError(message, 401);
  }
}
