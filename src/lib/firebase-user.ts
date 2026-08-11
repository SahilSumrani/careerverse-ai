import type { FirebaseIdTokenClaims } from "@/lib/firebase-id-token";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  getUserByEmail,
  getUserById,
  mapUserDoc,
  USERS_COLLECTION,
  type CareerVerseUser,
} from "@/lib/firestore-users";
import type { RoleName } from "@/lib/roles";

export type FirebaseBridgeUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: RoleName[];
  onboardingComplete: boolean;
  isNewUser: boolean;
};

function firebaseUid(claims: FirebaseIdTokenClaims): string {
  const uid = claims.user_id || claims.sub;
  if (!uid || typeof uid !== "string") {
    throw new Error("Firebase token missing user id");
  }
  return uid;
}

/** Upsert Firestore `users/{uid}` from verified Firebase ID token claims. */
export async function upsertUserFromFirebaseClaims(
  claims: FirebaseIdTokenClaims,
): Promise<FirebaseBridgeUser> {
  const email = claims.email?.toLowerCase();
  if (!email) {
    throw new Error("Google account has no email");
  }

  const uid = firebaseUid(claims);
  const now = new Date().toISOString();
  const picture = typeof claims.picture === "string" ? claims.picture : null;
  const displayName = claims.name ?? email.split("@")[0];

  const existingById = await getUserById(uid);
  if (existingById?.suspendedAt) {
    throw new Error("This account is suspended");
  }

  // Rare: email/password user later signs in with Google — merge onto Firebase uid if needed
  if (!existingById) {
    const byEmail = await getUserByEmail(email);
    if (byEmail?.suspendedAt) {
      throw new Error("This account is suspended");
    }
    if (byEmail && byEmail.id !== uid) {
      // Keep the original doc id for password accounts; update identity fields
      await getAdminDb()
        .collection(USERS_COLLECTION)
        .doc(byEmail.id)
        .set(
          {
            name: byEmail.name || displayName,
            image: byEmail.image || picture,
            emailVerified: byEmail.emailVerified || (claims.email_verified ? now : null),
            firebaseUid: uid,
            updatedAt: now,
          },
          { merge: true },
        );
      const refreshed = await getUserById(byEmail.id);
      if (!refreshed) throw new Error("Unable to load user after merge");
      return toBridge(refreshed, !refreshed.onboardingComplete);
    }
  }

  if (!existingById) {
    const data = {
      email,
      name: displayName,
      image: picture,
      emailVerified: claims.email_verified ? now : null,
      roles: ["STUDENT"] as RoleName[],
      onboardingComplete: false,
      profileCompleteness: 15,
      skills: [] as string[],
      interests: [] as string[],
      preferredIndustries: [] as string[],
      preferredLocations: [] as string[],
      resume: null,
      resumes: [],
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await getAdminDb().collection(USERS_COLLECTION).doc(uid).set(data);
    const created = mapUserDoc(uid, data)!;
    return toBridge(created, true);
  }

  const needsOnboarding = !existingById.onboardingComplete;
  await getAdminDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .set(
      {
        name: existingById.name || displayName,
        image: existingById.image || picture,
        emailVerified: existingById.emailVerified || (claims.email_verified ? now : null),
        roles: existingById.roles.length ? existingById.roles : (["STUDENT"] as RoleName[]),
        updatedAt: now,
      },
      { merge: true },
    );

  const updated = (await getUserById(uid))!;
  return toBridge(updated, needsOnboarding);
}

function toBridge(user: CareerVerseUser, isNewUser: boolean): FirebaseBridgeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    roles: user.roles,
    onboardingComplete: user.onboardingComplete,
    isNewUser: isNewUser || !user.onboardingComplete,
  };
}
