import { getUserById } from "@/lib/firestore-users";
import { getAdminDb } from "@/lib/firebase-admin";
import { USERS_COLLECTION } from "@/lib/firestore-users";
import { ROLE_NAMES, type RoleName } from "@/lib/roles";

export const PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  USER_MANAGE: "user.manage",
  OPPORTUNITY_MANAGE: "opportunity.manage",
  OPPORTUNITY_CREATE: "opportunity.create",
  EVENT_MANAGE: "event.manage",
  COMMUNITY_MODERATE: "community.moderate",
  APPROVAL_REVIEW: "approval.review",
  INSTITUTION_MANAGE: "institution.manage",
  AI_CONFIGURE: "ai.configure",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  STUDENT: [],
  PROFESSIONAL: [],
  MENTOR: [],
  HR: [PERMISSIONS.OPPORTUNITY_CREATE],
  FOUNDER: [],
  SPEAKER: [],
  INSTITUTION_ADMIN: [PERMISSIONS.APPROVAL_REVIEW, PERMISSIONS.INSTITUTION_MANAGE],
  PLATFORM_ADMIN: Object.values(PERMISSIONS),
};

export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const user = await getUserById(userId);
  return user?.roles ?? [];
}

export async function userHasRole(userId: string, roles: RoleName | RoleName[]) {
  const userRoles = await getUserRoles(userId);
  const needed = Array.isArray(roles) ? roles : [roles];
  return needed.some((r) => userRoles.includes(r));
}

export async function userHasPermission(userId: string, permission: PermissionKey) {
  const roles = await getUserRoles(userId);
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export async function requirePermission(userId: string, permission: PermissionKey) {
  const ok = await userHasPermission(userId, permission);
  if (!ok) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function assignRole(userId: string, roleName: RoleName) {
  const user = await getUserById(userId);
  const roles = new Set(user?.roles ?? []);
  roles.add(roleName);
  await getAdminDb()
    .collection(USERS_COLLECTION)
    .doc(userId)
    .set({ roles: Array.from(roles), updatedAt: new Date().toISOString() }, { merge: true });
}

/** No-op under Firestore — roles live on the user document. */
export async function ensureDefaultRoles() {
  void ROLE_NAMES;
}
