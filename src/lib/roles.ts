/** App roles (previously Prisma RoleName enum). */
export const ROLE_NAMES = [
  "STUDENT",
  "PROFESSIONAL",
  "MENTOR",
  "HR",
  "FOUNDER",
  "SPEAKER",
  "INSTITUTION_ADMIN",
  "PLATFORM_ADMIN",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (ROLE_NAMES as readonly string[]).includes(value);
}
