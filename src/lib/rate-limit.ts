import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

/**
 * Per-user daily counter in users/{uid}/rateLimits/{key}.
 * Fail-closed: on Firestore errors returns false (deny) for paid AI / abuse paths.
 */
export async function consumeDailyQuota(
  userId: string,
  key: string,
  cap: number,
  opts?: { failOpen?: boolean },
): Promise<{ ok: boolean; remaining: number }> {
  const failOpen = opts?.failOpen ?? false;
  if (!hasFirebaseAdminCredentials()) {
    return failOpen ? { ok: true, remaining: cap } : { ok: false, remaining: 0 };
  }
  const day = new Date().toISOString().slice(0, 10);
  const ref = getAdminDb().collection("users").doc(userId).collection("rateLimits").doc(key);
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const count = data.day === day ? Number(data.count || 0) : 0;
      if (count >= cap) return { ok: false, remaining: 0 };
      const next = count + 1;
      tx.set(ref, { day, count: next, updatedAt: new Date().toISOString() }, { merge: true });
      return { ok: true, remaining: Math.max(0, cap - next) };
    });
  } catch {
    return failOpen ? { ok: true, remaining: cap } : { ok: false, remaining: 0 };
  }
}

export async function peekDailyQuota(
  userId: string,
  key: string,
  cap: number,
): Promise<{ used: number; remaining: number }> {
  if (!hasFirebaseAdminCredentials()) return { used: 0, remaining: cap };
  const day = new Date().toISOString().slice(0, 10);
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(userId)
      .collection("rateLimits")
      .doc(key)
      .get();
    const data = snap.data() || {};
    const used = data.day === day ? Number(data.count || 0) : 0;
    return { used, remaining: Math.max(0, cap - used) };
  } catch {
    return { used: 0, remaining: cap };
  }
}

/** Sliding window counter (e.g. signup per IP/email per hour). Fail-closed. */
export async function consumeWindowQuota(
  bucket: string,
  id: string,
  cap: number,
  windowKey: string,
): Promise<boolean> {
  if (!hasFirebaseAdminCredentials()) return false;
  const ref = getAdminDb().collection("rateLimits").doc(`${bucket}_${id}`);
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const count = data.window === windowKey ? Number(data.count || 0) : 0;
      if (count >= cap) return false;
      tx.set(
        ref,
        { window: windowKey, count: count + 1, updatedAt: new Date().toISOString() },
        { merge: true },
      );
      return true;
    });
  } catch {
    return false;
  }
}
