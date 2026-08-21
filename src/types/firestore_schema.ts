/**
 * Firestore Database Schema
 *
 * This file defines the TypeScript interfaces for all Firestore collections
 * used in the application. It serves as the single source of truth for
 * database structure and ensures type safety across the codebase.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Collection: users
 * Document ID: {userId} (Firebase Auth UID)
 *
 * Stores user profile information and settings.
 */
export interface FirestoreUser {
  /** Firebase Auth UID */
  uid: string;

  /** User's display name */
  displayName: string;

  /** User's email address */
  email: string;

  /** Google profile photo URL (from OAuth) */
  photoURL: string | null;

  /** Custom uploaded avatar URL (Firebase Storage) */
  customPhotoURL: string | null;

  /** Account creation timestamp */
  createdAt: Timestamp;

  /** Last profile update timestamp */
  updatedAt: Timestamp;
}

/**
 * Collection: user_creations
 * Document ID: {creationId} (auto-generated)
 *
 * Stores user-created RTTTL compositions.
 * Index: userId (ascending) for efficient querying of user's creations
 * Index: isPublic (ascending) + updatedAt (descending) for public feed
 */
export interface FirestoreUserCreation {
  /** Unique creation ID */
  id: string;

  /** Creator's Firebase Auth UID */
  userId: string;

  /** Composition title */
  title: string;

  /**
   * Artist name - should be empty string for user creations
   * User's display name is fetched dynamically via userId
   * Only used for backward compatibility with static collections
   */
  artist: string;

  /** RTTTL format code */
  code: string;

  /** Multi-track RTTTL codes (optional) */
  tracks?: string[];

  /** Category tags (optional) */
  categories?: string[];

  /** Public visibility flag - defaults to false (private) */
  isPublic: boolean;

  /** Creation timestamp */
  createdAt: Timestamp;

  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Collection: user_favorites
 * Document ID: {userId} (Firebase Auth UID)
 *
 * Stores a user's favorited tracks.
 * Each user has exactly one document containing all their favorites.
 */
export interface FirestoreUserFavorites {
  /** User's Firebase Auth UID */
  userId: string;

  /** Array of favorited track IDs */
  favorites: string[];

  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Collection: track_stats
 * Document ID: {trackId}
 *
 * Stores aggregate statistics for tracks.
 * Write access restricted to Cloud Functions only.
 */
export interface FirestoreTrackStats {
  /** Unique track identifier */
  trackId: string;

  /** Total play count */
  playCount: number;

  /** Last play timestamp (optional) */
  lastPlayedAt?: Timestamp;

  /** Stats record creation timestamp */
  createdAt: Timestamp;

  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Collection: user_track_interactions
 * Document ID: auto-generated
 *
 * Stores individual user interactions with tracks.
 * Composite Index: [userId, trackId] for efficient user-track lookup
 */
export interface FirestoreUserTrackInteraction {
  /** User's Firebase Auth UID */
  userId: string;

  /** Track identifier */
  trackId: string;

  /** Last time user played this track */
  lastPlayedAt?: Timestamp;

  /** Number of times this user played this track */
  playCount: number;

  /** Record creation timestamp */
  createdAt: Timestamp;

  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Collection: pending_stats_updates
 * Document ID: auto-generated
 *
 * Queue for pending statistics updates to be processed by Cloud Functions.
 * TTL Index: createdAt (auto-delete after 24 hours)
 */
export interface FirestorePendingStatsUpdate {
  /** Track identifier */
  trackId: string;

  /** Type of statistics update */
  type: "play";

  /** User ID (optional - null for anonymous plays) */
  userId?: string;

  /** Creation timestamp */
  createdAt: Timestamp;
}

/**
 * Collection: audio_recognitions
 * Document ID: auto-generated
 *
 * Stores AI audio recognition results linked to user accounts.
 * Index: userId (ascending) + createdAt (descending) for user history
 */
export interface FirestoreAudioRecognition {
  /** Unique record ID */
  id: string;

  /** User's Firebase Auth UID */
  userId: string;

  /** Original audio filename (file is NOT stored) */
  fileName: string;

  /** Original file size in bytes */
  fileSizeBytes: number;

  /** Audio duration in seconds */
  durationSec: number;

  /** Analysis start time (seconds) */
  startTime: number;

  /** Analysis end time (seconds) */
  endTime: number;

  /** Stems selected for extraction */
  stems: string[];

  /** Extracted RTTTL tracks */
  tracks: {
    stem: string;
    rtttl: string;
    noteCount: number;
    bpm: number;
    durationSec: number;
    error?: string;
  }[];

  /** Replicate processing logs (internal, not shown to user) */
  replicateLogs: string;

  /** Recognition timestamp */
  createdAt: Timestamp;
}

/**
 * Collection Names
 * Centralized collection name constants to avoid typos
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  USER_CREATIONS: "user_creations",
  USER_FAVORITES: "user_favorites",
  TRACK_STATS: "track_stats",
  USER_TRACK_INTERACTIONS: "user_track_interactions",
  PENDING_STATS_UPDATES: "pending_stats_updates",
  AUDIO_RECOGNITIONS: "audio_recognitions",
} as const;

/**
 * Type-safe collection name type
 */
export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
