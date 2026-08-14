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
 */
export interface FirestoreUserCreation {
  /** Unique creation ID */
  id: string;

  /** Creator's Firebase Auth UID */
  userId: string;

  /** Composition title */
  title: string;

  /** Artist name (usually empty for user creations) */
  artist: string;

  /** RTTTL format code */
  code: string;

  /** Multi-track RTTTL codes (optional) */
  tracks?: string[];

  /** Category tags (optional) */
  categories?: string[];

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

  /** Total like/favorite count */
  likeCount: number;

  /** Last play timestamp (optional) */
  lastPlayedAt?: Timestamp;

  /** Last like timestamp (optional) */
  lastLikedAt?: Timestamp;

  /** Stats record creation timestamp */
  createdAt: Timestamp;

  /** Last update timestamp */
  updatedAt: Timestamp;
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
} as const;

/**
 * Type-safe collection name type
 */
export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
