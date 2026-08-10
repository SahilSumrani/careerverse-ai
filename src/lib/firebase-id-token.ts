import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type FirebaseIdTokenClaims = JWTPayload & {
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdTokenClaims> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }

  const { payload } = await jwtVerify(idToken, JWKS, {
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  return payload as FirebaseIdTokenClaims;
}
