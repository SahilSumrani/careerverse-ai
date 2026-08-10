import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/db";

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
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role.name);
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
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName, description: `${roleName} role` },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

export async function ensureDefaultRoles() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
  }
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key: description },
      update: { description: key },
      create: { key: description, description: key },
    });
  }
}
