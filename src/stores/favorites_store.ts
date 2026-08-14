import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncFavorites, getUserFavorites } from "../services/firestore_service";

interface FavoritesState {
  favoriteIds: string[];
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
      isSyncing: false,
      syncTimeoutId: null,

      toggleFavorite: (id, userId) => {
        const current = get().favoriteIds;
        const newFavorites = current.includes(id)
          ? current.filter((fid) => fid !== id)
          : [...current, id];

        set({ favoriteIds: newFavorites });

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
      partialize: (state) => ({ favoriteIds: state.favoriteIds }),
    },
  ),
);
