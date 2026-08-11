/**
 * Soft-cache of the last authenticated shell profile so brief auth flicker
 * during soft navigations does not blank the sidebar/topbar identity.
 * Server module cache survives within the same Node process (dev + serverless warm instances).
 */
export type ShellProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
};

const g = globalThis as typeof globalThis & { __cvShellProfile?: ShellProfile | null };

export function rememberShellProfile(profile: ShellProfile) {
  g.__cvShellProfile = profile;
}

export function peekShellProfile(userId?: string | null): ShellProfile | null {
  const cached = g.__cvShellProfile ?? null;
  if (!cached) return null;
  if (userId && cached.id !== userId) return null;
  return cached;
}
