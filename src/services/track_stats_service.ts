/**
 * Track Statistics Service
 *
 * Handles all Firestore operations related to track statistics,
 * user interactions, and pending statistics updates.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../libs/firebase";
import { FIRESTORE_COLLECTIONS } from "../types/firestore_schema";
import type {
  FirestoreTrackStats,
  FirestoreUserTrackInteraction,
  FirestorePendingStatsUpdate,
} from "../types/firestore_schema";

/**
 * Client-side representation of track stats with optional fields as numbers
 */
export interface TrackStats {
  trackId: string;
  playCount: number;
  lastPlayedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client-side representation of user track interaction
 */
export interface UserTrackInteraction {
  userId: string;
  trackId: string;
  lastPlayedAt?: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch track statistics for a single track
 */
export async function getTrackStats(trackId: string): Promise<TrackStats | null> {
  const statsRef = doc(db, FIRESTORE_COLLECTIONS.TRACK_STATS, trackId);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    return null;
  }

  const data = statsDoc.data() as FirestoreTrackStats;
  return {
    trackId: data.trackId,
    playCount: data.playCount,
    lastPlayedAt: data.lastPlayedAt?.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

/**
 * Batch fetch track statistics for multiple tracks
 * Returns a Map for efficient lookup
 */
export async function getMultipleTrackStats(trackIds: string[]): Promise<Map<string, TrackStats>> {
  if (trackIds.length === 0) {
    return new Map();
  }

  // Firestore 'in' queries are limited to 30 items, so we batch
  const batchSize = 30;
  const batches: string[][] = [];

  for (let i = 0; i < trackIds.length; i += batchSize) {
    batches.push(trackIds.slice(i, i + batchSize));
  }

  const allStats = new Map<string, TrackStats>();

  await Promise.all(
    batches.map(async (batch) => {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.TRACK_STATS),
        where("trackId", "in", batch),
      );
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as FirestoreTrackStats;
        allStats.set(data.trackId, {
          trackId: data.trackId,
          playCount: data.playCount,
          lastPlayedAt: data.lastPlayedAt?.toDate().toISOString(),
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        });
      });
    }),
  );

  return allStats;
}

/**
 * Record a play event by creating a pending stats update
 * This is debounced on the client side before calling
 */
export async function recordPlay(trackId: string, userId?: string): Promise<void> {
  const update: Omit<FirestorePendingStatsUpdate, "createdAt"> & { createdAt: Timestamp } = {
    trackId,
    type: "play",
    createdAt: Timestamp.now(),
    // Firestore rejects `undefined` field values — omit userId entirely for anonymous plays
    ...(userId ? { userId } : {}),
  };

  await addDoc(collection(db, FIRESTORE_COLLECTIONS.PENDING_STATS_UPDATES), update);

  // Also update user interaction if user is logged in
  if (userId) {
    await updateUserInteraction(userId, trackId);
  }
}

/**
 * Get user's interaction with a specific track
 */
export async function getUserTrackInteraction(
  userId: string,
  trackId: string,
): Promise<UserTrackInteraction | null> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_TRACK_INTERACTIONS),
    where("userId", "==", userId),
    where("trackId", "==", trackId),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0]!.data() as FirestoreUserTrackInteraction;
  return {
    userId: data.userId,
    trackId: data.trackId,
    lastPlayedAt: data.lastPlayedAt?.toDate().toISOString(),
    playCount: data.playCount,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

/**
 * Batch fetch user interactions for multiple tracks
 */
export async function getUserTrackInteractions(
  userId: string,
  trackIds: string[],
): Promise<Map<string, UserTrackInteraction>> {
  if (trackIds.length === 0) {
    return new Map();
  }

  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_TRACK_INTERACTIONS),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(q);
  const interactions = new Map<string, UserTrackInteraction>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as FirestoreUserTrackInteraction;
    if (trackIds.includes(data.trackId)) {
      interactions.set(data.trackId, {
        userId: data.userId,
        trackId: data.trackId,
        lastPlayedAt: data.lastPlayedAt?.toDate().toISOString(),
        playCount: data.playCount,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      });
    }
  });

  return interactions;
}

/**
 * Update user's interaction with a track
 * Internal helper function
 */
async function updateUserInteraction(userId: string, trackId: string): Promise<void> {
  // Find existing interaction
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_TRACK_INTERACTIONS),
    where("userId", "==", userId),
    where("trackId", "==", trackId),
  );

  const snapshot = await getDocs(q);
  const now = Timestamp.now();

  if (snapshot.empty) {
    // Create new interaction
    const newInteraction: Omit<FirestoreUserTrackInteraction, "createdAt" | "updatedAt"> & {
      createdAt: Timestamp;
      updatedAt: Timestamp;
    } = {
      userId,
      trackId,
      lastPlayedAt: now,
      playCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    await addDoc(collection(db, FIRESTORE_COLLECTIONS.USER_TRACK_INTERACTIONS), newInteraction);
  } else {
    // Update existing interaction
    const docRef = snapshot.docs[0]!.ref;
    const existingData = snapshot.docs[0]!.data() as FirestoreUserTrackInteraction;

    const updates: Partial<FirestoreUserTrackInteraction> & { updatedAt: Timestamp } = {
      updatedAt: now,
      lastPlayedAt: now,
      playCount: existingData.playCount + 1,
    };

    await setDoc(docRef, updates, { merge: true });
  }
}

/**
 * Initialize track stats document if it doesn't exist
 * This can be called optimistically when displaying a track
 */
export async function initializeTrackStats(trackId: string): Promise<void> {
  const statsRef = doc(db, FIRESTORE_COLLECTIONS.TRACK_STATS, trackId);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    const now = Timestamp.now();
    const initialStats: Omit<FirestoreTrackStats, "createdAt" | "updatedAt"> & {
      createdAt: Timestamp;
      updatedAt: Timestamp;
    } = {
      trackId,
      playCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(statsRef, initialStats);
  }
}
