import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncFavorites, getUserFavorites } from "../services/firestore_service";

interface FavoritesState {
  favoriteIds: string[];
  /** ISO timestamp of when each item was favorited, keyed by item id */
  favoritedAt: Record<string, string>;
  isSyncing: boolean;
  syncTimeoutId: number | null;
  toggleFavorite: (id: string, userId?: string) => void;
  isFavorite: (id: string) => boolean;
  loadFavorites: (userId: string) => Promise<void>;
  syncToFirestore: (userId: string, favoriteIds: string[]) => Promise<void>;
}

const SYNC_DEBOUNCE_MS = 1000;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      favoritedAt: {},
      isSyncing: false,
      syncTimeoutId: null,

      toggleFavorite: (id, userId) => {
        const current = get().favoriteIds;
        const isAdding = !current.includes(id);
        const newFavorites = isAdding ? [...current, id] : current.filter((fid) => fid !== id);

        const newFavoritedAt = { ...get().favoritedAt };
        if (isAdding) {
          newFavoritedAt[id] = new Date().toISOString();
        } else {
          delete newFavoritedAt[id];
        }

        set({ favoriteIds: newFavorites, favoritedAt: newFavoritedAt });

        if (userId) {
          const existingTimeout = get().syncTimeoutId;
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeoutId = setTimeout(() => {
            get().syncToFirestore(userId, newFavorites);
          }, SYNC_DEBOUNCE_MS);

          set({ syncTimeoutId: timeoutId });
        }
      },

      isFavorite: (id) => get().favoriteIds.includes(id),

      loadFavorites: async (userId) => {
        try {
          const favorites = await getUserFavorites(userId);
          set({ favoriteIds: favorites });
        } catch (error) {
          console.error("Failed to load favorites:", error);
        }
      },

      syncToFirestore: async (userId, favoriteIds) => {
        if (get().isSyncing) {
          return;
        }

        try {
          set({ isSyncing: true });
          await syncFavorites(userId, favoriteIds);
        } catch (error) {
          console.error("Failed to sync favorites:", error);
        } finally {
          set({ isSyncing: false, syncTimeoutId: null });
        }
      },
    }),
    {
      name: "rtttl-favorites",
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        favoritedAt: state.favoritedAt,
      }),
    },
  ),
);
