import { prisma } from "@/lib/db";
import { assignRole, ensureDefaultRoles } from "@/lib/rbac";
import type { FirebaseIdTokenClaims } from "@/lib/firebase-id-token";
import type { RoleName } from "@prisma/client";

export type FirebaseBridgeUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: RoleName[];
  onboardingComplete: boolean;
  isNewUser: boolean;
};

/** Upsert Prisma user from verified Firebase ID token claims. */
export async function upsertUserFromFirebaseClaims(
  claims: FirebaseIdTokenClaims,
): Promise<FirebaseBridgeUser> {
  const email = claims.email?.toLowerCase();
  if (!email) {
    throw new Error("Google account has no email");
  }

  await ensureDefaultRoles();

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: { include: { role: true } },
      profile: true,
    },
  });

  if (user?.suspendedAt) {
    throw new Error("This account is suspended");
  }

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email,
        name: claims.name ?? email.split("@")[0],
        image: typeof claims.picture === "string" ? claims.picture : null,
        emailVerified: claims.email_verified ? new Date() : null,
        profile: {
          create: {
            onboardingComplete: false,
            profileCompleteness: 15,
          },
        },
      },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });
    await assignRole(user.id, "STUDENT");
    user = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });
  } else {
    if (!user.profile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          onboardingComplete: false,
          profileCompleteness: 15,
        },
      });
      isNewUser = true;
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name || claims.name || undefined,
        image: user.image || (typeof claims.picture === "string" ? claims.picture : undefined),
        emailVerified: user.emailVerified ?? (claims.email_verified ? new Date() : null),
      },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });

    if (!user.roles.length) {
      await assignRole(user.id, "STUDENT");
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          roles: { include: { role: true } },
          profile: true,
        },
      });
    }
  }

  const onboardingComplete = Boolean(user.profile?.onboardingComplete);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    roles: user.roles.map((r) => r.role.name),
    onboardingComplete,
    isNewUser: isNewUser || !onboardingComplete,
  };
}
