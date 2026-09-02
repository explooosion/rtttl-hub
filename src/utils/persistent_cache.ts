/**
 * Generic persisted key-value cache backed by localStorage.
 *
 * Intended for read-mostly reference lookups where the *key* is stable and
 * never changes (e.g. a Firebase Auth UID) but the *value* behind it can be
 * updated later (e.g. a display name). Reads are served instantly from an
 * in-memory Map hydrated once from localStorage; writes update both the
 * in-memory Map and localStorage so the cache survives page reloads and new
 * sessions.
 *
 * This is a generic building block — create one instance per data type (see
 * `user_profile_service.ts` for the display-name cache) rather than adding
 * ad-hoc localStorage reads/writes elsewhere.
 */

const STORAGE_PREFIX = "rtttl-hub:cache:";

interface CacheEntry<T> {
  value: T;
  updatedAt: number;
}

export interface PersistentCache<T> {
  /** Returns the cached value for `key`, or `undefined` if never cached. */
  get(key: string): T | undefined;
  /** Timestamp (ms) the value for `key` was last written, or `undefined`. */
  getUpdatedAt(key: string): number | undefined;
  /** Returns true if `key` has no entry or its entry is older than `maxAgeMs`. */
  isStale(key: string, maxAgeMs: number): boolean;
  /** Writes `value` for `key` to memory and localStorage. */
  set(key: string, value: T): void;
  /** Removes one entry, or the whole namespace when `key` is omitted. */
  clear(key?: string): void;
}

/**
 * Creates a namespaced persistent cache. Each namespace is stored under its
 * own localStorage key as a single JSON object, so keep namespaces scoped to
 * one logical data type (e.g. "user-display-names").
 */
export function createPersistentCache<T>(namespace: string): PersistentCache<T> {
  const storageKey = `${STORAGE_PREFIX}${namespace}`;
  const memory = new Map<string, CacheEntry<T>>();

  // Hydrate once from localStorage on first use.
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CacheEntry<T>>;
      for (const [key, entry] of Object.entries(parsed)) {
        memory.set(key, entry);
      }
    }
  } catch {
    // Corrupted or inaccessible storage (private browsing, quota, etc.) — start empty.
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(memory)));
    } catch {
      // Ignore storage write failures — the in-memory cache still works for this session.
    }
  }

  return {
    get(key) {
      return memory.get(key)?.value;
    },
    getUpdatedAt(key) {
      return memory.get(key)?.updatedAt;
    },
    isStale(key, maxAgeMs) {
      const entry = memory.get(key);
      if (!entry) {
        return true;
      }
      return Date.now() - entry.updatedAt > maxAgeMs;
    },
    set(key, value) {
      memory.set(key, { value, updatedAt: Date.now() });
      persist();
    },
    clear(key) {
      if (key) {
        memory.delete(key);
      } else {
        memory.clear();
      }
      persist();
    },
  };
}
