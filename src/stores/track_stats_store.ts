/**
 * Track Statistics Store
 *
 * Client-side state management for track statistics with:
 * - Caching with TTL
 * - Optimistic updates
 * - Debounced play tracking
 * - Offline queue support
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getMultipleTrackStats,
  recordPlay,
  type TrackStats,
} from "../services/track_stats_service";

/**
 * Cached stats with metadata
 */
interface CachedTrackStats extends TrackStats {
  /** Local optimistic increments before sync */
  localPlayIncrement: number;

  /** Timestamp when stats were fetched */
  cachedAt: number;
}

/**
 * Pending operation for offline mode
 */
interface PendingOperation {
  type: "play";
  trackId: string;
  userId?: string;
  timestamp: number;
}

/**
 * Play tracking debounce state
 */
interface PlayDebounce {
  trackId: string;
  userId?: string;
  timeoutId: number;
}

interface TrackStatsStoreState {
  /** Cache of stats by trackId */
  statsCache: Map<string, CachedTrackStats>;

  /** Pending operations for offline mode */
  pendingOperations: PendingOperation[];

  /** Active debounce timers */
  playDebounces: Map<string, PlayDebounce>;

  /** Cache TTL in milliseconds (5 minutes) */
  cacheTTL: number;

  /** Play debounce delay in milliseconds (3 seconds) */
  playDebounceMs: number;

  /** Actions */
  loadStats: (trackIds: string[]) => Promise<void>;
  getStatsForTrack: (trackId: string) => TrackStats | null;
  recordPlayDebounced: (trackId: string, userId?: string) => void;
  syncPendingOperations: () => Promise<void>;
  clearCache: () => void;
  invalidateTrack: (trackId: string) => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PLAY_DEBOUNCE_MS = 3000; // 3 seconds

export const useTrackStatsStore = create<TrackStatsStoreState>()(
  persist(
    (set, get) => ({
      statsCache: new Map(),
      pendingOperations: [],
      playDebounces: new Map(),
      cacheTTL: CACHE_TTL,
      playDebounceMs: PLAY_DEBOUNCE_MS,

      /**
       * Load stats for multiple tracks
       * Only fetches if not in cache or cache expired
       */
      loadStats: async (trackIds: string[]) => {
        const now = Date.now();
        const cache = get().statsCache;
        const ttl = get().cacheTTL;

        // Filter out tracks that are already cached and not expired
        const trackIdsToFetch = trackIds.filter((trackId) => {
          const cached = cache.get(trackId);
          if (!cached) {
            return true;
          }
          return now - cached.cachedAt > ttl;
        });

        if (trackIdsToFetch.length === 0) {
          return;
        }

        try {
          const statsMap = await getMultipleTrackStats(trackIdsToFetch);
          const newCache = new Map(cache);

          statsMap.forEach((stats, trackId) => {
            newCache.set(trackId, {
              ...stats,
              localPlayIncrement: 0,
              cachedAt: now,
            });
          });

          // Initialize missing tracks with zero stats
          trackIdsToFetch.forEach((trackId) => {
            if (!newCache.has(trackId)) {
              newCache.set(trackId, {
                trackId,
                playCount: 0,
                localPlayIncrement: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cachedAt: now,
              });
            }
          });

          set({ statsCache: newCache });
        } catch (error) {
          console.error("Failed to load track stats:", error);
        }
      },

      /**
       * Get stats for a single track from cache
       * Returns with optimistic updates applied
       */
      getStatsForTrack: (trackId: string) => {
        const cached = get().statsCache.get(trackId);
        if (!cached) {
          return null;
        }

        return {
          ...cached,
          playCount: cached.playCount + cached.localPlayIncrement,
        };
      },

      /**
       * Record a play event with debouncing
       * Prevents spam by debouncing 3 seconds per track
       */
      recordPlayDebounced: (trackId: string, userId?: string) => {
        const debounces = get().playDebounces;
        const existing = debounces.get(trackId);

        // Clear existing timeout
        if (existing) {
          clearTimeout(existing.timeoutId);
        }

        // Optimistic update
        const cache = get().statsCache;
        const cached = cache.get(trackId);
        if (cached) {
          const newCache = new Map(cache);
          newCache.set(trackId, {
            ...cached,
            localPlayIncrement: cached.localPlayIncrement + 1,
          });
          set({ statsCache: newCache });
        }

        // Set new debounce timeout
        const timeoutId = window.setTimeout(async () => {
          try {
            await recordPlay(trackId, userId);

            // Reset local increment after successful sync
            const currentCache = get().statsCache;
            const currentCached = currentCache.get(trackId);
            if (currentCached) {
              const updatedCache = new Map(currentCache);
              updatedCache.set(trackId, {
                ...currentCached,
                playCount: currentCached.playCount + currentCached.localPlayIncrement,
                localPlayIncrement: 0,
                updatedAt: new Date().toISOString(),
              });
              set({ statsCache: updatedCache });
            }

            // Remove debounce
            const newDebounces = new Map(get().playDebounces);
            newDebounces.delete(trackId);
            set({ playDebounces: newDebounces });
          } catch (error) {
            console.error("Failed to record play:", error);

            // Add to pending operations for retry
            set({
              pendingOperations: [
                ...get().pendingOperations,
                {
                  type: "play",
                  trackId,
                  userId,
                  timestamp: Date.now(),
                },
              ],
            });
          }
        }, get().playDebounceMs);

        // Store debounce state
        const newDebounces = new Map(debounces);
        newDebounces.set(trackId, { trackId, userId, timeoutId });
        set({ playDebounces: newDebounces });
      },

      /**
       * Sync pending operations (for offline mode recovery)
       */
      syncPendingOperations: async () => {
        const pending = get().pendingOperations;
        if (pending.length === 0) {
          return;
        }

        const results = await Promise.allSettled(
          pending.map(async (op) => {
            await recordPlay(op.trackId, op.userId);
          }),
        );

        // Remove successful operations
        const failed = pending.filter((_, idx) => {
          return results[idx]!.status === "rejected";
        });
        set({ pendingOperations: failed });
      },

      /**
       * Clear entire cache
       */
      clearCache: () => {
        set({ statsCache: new Map() });
      },

      /**
       * Invalidate cache for a specific track
       */
      invalidateTrack: (trackId: string) => {
        const cache = get().statsCache;
        const newCache = new Map(cache);
        newCache.delete(trackId);
        set({ statsCache: newCache });
      },
    }),
    {
      name: "rtttl-track-stats",
      partialize: (state) => ({
        pendingOperations: state.pendingOperations,
      }),
      // Don't persist cache and debounces
    },
  ),
);
