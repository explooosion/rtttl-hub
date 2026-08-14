/**
 * User Profile Service
 *
 * Provides caching and retrieval of user display names for showing
 * creator information in track listings.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { FirestoreUser } from "../types/firestore_schema";

// In-memory cache for user display names
const userDisplayNameCache = new Map<string, string>();

// Pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Get user display name by userId
 * Uses in-memory cache to minimize Firestore reads
 *
 * @param userId - Firebase Auth UID
 * @returns User's display name, or "Unknown User" if not found
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  // Check cache first
  const cached = userDisplayNameCache.get(userId);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending request
  const pending = pendingRequests.get(userId);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = fetchUserDisplayName(userId);
  pendingRequests.set(userId, request);

  try {
    const displayName = await request;
    return displayName;
  } finally {
    pendingRequests.delete(userId);
  }
}

/**
 * Fetch user display name from Firestore
 */
async function fetchUserDisplayName(userId: string): Promise<string> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as FirestoreUser;
      const displayName = userData.displayName || "Unknown User";

      // Cache the result
      userDisplayNameCache.set(userId, displayName);

      return displayName;
    }

    // User not found
    userDisplayNameCache.set(userId, "Unknown User");
    return "Unknown User";
  } catch (error) {
    console.error(`Failed to fetch user display name for ${userId}:`, error);
    return "Unknown User";
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
    const cached = userDisplayNameCache.get(userId);
    if (cached) {
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
  userDisplayNameCache.clear();
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
