/**
 * Module-level soft cache so client pages can keep previous content on remount
 * instead of flashing a full-page skeleton on every tab change.
 */
export type SoftCacheEntry<T> = { value: T; at: number };

export function createSoftCache<T>(ttlMs = 120_000) {
  let entry: SoftCacheEntry<T> | null = null;

  return {
    peek(): T | undefined {
      return entry?.value;
    },
    has(): boolean {
      return entry != null;
    },
    isFresh(): boolean {
      return entry != null && Date.now() - entry.at < ttlMs;
    },
    set(value: T) {
      entry = { value, at: Date.now() };
    },
    clear() {
      entry = null;
    },
  };
}
