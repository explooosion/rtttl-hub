/**
 * Track Statistics Type Definitions
 *
 * This file defines the data structure for track statistics that will be
 * integrated with Firebase Firestore in the future.
 */

/**
 * Firestore Collection: track_stats
 * Document ID: trackId (RtttlEntry.id)
 *
 * Stores aggregate statistics for each track.
 */
export interface TrackStats {
  /** Unique track identifier (matches RtttlEntry.id) */
  trackId: string;

  /** Total number of times this track has been played */
  playCount: number;

  /** Total number of users who liked/recommended this track */
  likeCount: number;

  /** ISO timestamp of the most recent play */
  lastPlayedAt?: string;

  /** ISO timestamp of the most recent like */
  lastLikedAt?: string;

  /** ISO timestamp when the stats record was created */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Firestore Collection: user_track_likes
 * Document ID: auto-generated
 * Composite Index: [userId, trackId] for efficient lookup
 *
 * Tracks which users liked which tracks (for preventing duplicate likes).
 */
export interface UserTrackLike {
  /** User ID from authentication system */
  userId: string;

  /** Track ID being liked */
  trackId: string;

  /** ISO timestamp when the user liked this track */
  likedAt: string;
}

/**
 * Firestore Collection: user_track_plays
 * Document ID: auto-generated
 * Composite Index: [trackId, playedAt] for analytics
 *
 * Optional: Detailed play history for analytics (can be aggregated periodically).
 */
export interface UserTrackPlay {
  /** User ID (optional - may be null for anonymous plays) */
  userId?: string;

  /** Track ID being played */
  trackId: string;

  /** ISO timestamp of play event */
  playedAt: string;

  /** Play duration in milliseconds (optional) */
  durationMs?: number;

  /** Whether the user completed the track (optional) */
  completed?: boolean;
}

/**
 * Mock data generator for development
 *
 * Generates realistic-looking statistics for testing UI before Firestore integration.
 */
export function generateMockStats(trackId: string, seed: number = 0): TrackStats {
  // Use track ID to generate deterministic but varied stats
  const hash = trackId.split("").reduce((acc, char) => acc + char.charCodeAt(0), seed);
  const playCount = Math.floor(Math.abs(Math.sin(hash)) * 10000);
  const likeCount = Math.floor(playCount * (0.05 + Math.abs(Math.cos(hash)) * 0.15)); // 5-20% like rate

  return {
    trackId,
    playCount,
    likeCount,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Format large numbers with K/M suffix
 *
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2K", "1.5M", "999")
 */
export function formatCount(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}
