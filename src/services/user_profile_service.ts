/**
 * User Profile Service
 *
 * Provides caching and retrieval of user display names for showing
 * creator information in track listings.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../libs/firebase";
import type { FirestoreUser } from "../types/firestore_schema";
import { createPersistentCache } from "../utils/persistent_cache";

const FALLBACK_NAME = "Unknown User";

/**
 * A Firebase Auth UID never changes, but the display name behind it can —
 * revalidate a cached entry in the background once it's older than this.
 */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

// Persisted across page reloads/sessions, keyed by uid (see persistent_cache.ts).
const displayNameCache = createPersistentCache<string>("user-display-names");

// Pending requests to avoid duplicate in-flight fetches per uid
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Get user display name by userId.
 *
 * Stale-while-revalidate: if a cached value exists it's returned
 * immediately (even if stale), while a background Firestore fetch
 * refreshes the cache. Pass `onFreshValue` to be notified if that
 * background refresh resolves to a different name than what was returned.
 *
 * @param userId - Firebase Auth UID
 * @param onFreshValue - Optional callback invoked with the up-to-date name
 *   if a background revalidation finds it has changed.
 * @returns User's display name, or "Unknown User" if not found
 */
export async function getUserDisplayName(
  userId: string,
  onFreshValue?: (name: string) => void,
): Promise<string> {
  const cached = displayNameCache.get(userId);

  if (cached !== undefined && !displayNameCache.isStale(userId, STALE_AFTER_MS)) {
    return cached;
  }

  const request = fetchAndCacheDisplayName(userId);

  if (cached !== undefined) {
    // Serve the stale value now; notify the caller if revalidation changes it.
    void request.then((fresh) => {
      if (fresh !== cached) {
        onFreshValue?.(fresh);
      }
    });
    return cached;
  }

  return request;
}

function fetchAndCacheDisplayName(userId: string): Promise<string> {
  const pending = pendingRequests.get(userId);
  if (pending) {
    return pending;
  }

  const request = fetchUserDisplayName(userId).finally(() => {
    pendingRequests.delete(userId);
  });
  pendingRequests.set(userId, request);
  return request;
}

/**
 * Fetch user display name from Firestore
 */
async function fetchUserDisplayName(userId: string): Promise<string> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const displayName = userDoc.exists()
      ? (userDoc.data() as FirestoreUser).displayName || FALLBACK_NAME
      : FALLBACK_NAME;

    displayNameCache.set(userId, displayName);
    return displayName;
  } catch (error) {
    console.error(`Failed to fetch user display name for ${userId}:`, error);
    return displayNameCache.get(userId) ?? FALLBACK_NAME;
  }
}

/**
 * Batch fetch multiple user display names
 * More efficient when loading many tracks
 *
 * @param userIds - Array of Firebase Auth UIDs
 * @returns Map of userId to display name
 */
export async function batchGetUserDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)];
  const results = new Map<string, string>();

  // Separate cached and uncached IDs
  const uncachedIds: string[] = [];
  for (const userId of uniqueIds) {
    const cached = displayNameCache.get(userId);
    if (cached !== undefined) {
      results.set(userId, cached);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached IDs in parallel
  if (uncachedIds.length > 0) {
    const promises = uncachedIds.map((userId) => getUserDisplayName(userId));
    const displayNames = await Promise.all(promises);

    uncachedIds.forEach((userId, index) => {
      results.set(userId, displayNames[index]);
    });
  }

  return results;
}

/**
 * Clear the user display name cache
 * Useful for testing or when user data changes
 */
export function clearUserDisplayNameCache(): void {
  displayNameCache.clear();
}

/**
 * Immediately overwrite the cached display name for `userId`. Call this
 * right after the current user successfully changes their own display
 * name, so the persisted cache doesn't serve the old name until the next
 * revalidation.
 */
export function setCachedUserDisplayName(userId: string, displayName: string): void {
  displayNameCache.set(userId, displayName);
}

/**
 * Preload user display names for a list of items
 * Call this before rendering to warm up the cache
 *
 * @param items - Array of items with userId field
 */
export async function preloadUserDisplayNames(items: Array<{ userId?: string }>): Promise<void> {
  const userIds = items.map((item) => item.userId).filter((id): id is string => !!id);

  if (userIds.length === 0) {
    return;
  }

  await batchGetUserDisplayNames(userIds);
}
