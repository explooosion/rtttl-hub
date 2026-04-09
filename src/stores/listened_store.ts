import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ListenedState {
  listenedIds: string[];
  markListened: (id: string) => void;
  clearListened: () => void;
}

export const useListenedStore = create<ListenedState>()(
  persist(
    (set, get) => ({
      listenedIds: [],
      markListened: (id) => {
        if (!get().listenedIds.includes(id)) {
          set({ listenedIds: [...get().listenedIds, id] });
        }
      },
      clearListened: () => set({ listenedIds: [] }),
    }),
    { name: "rtttl-listened" },
  ),
);
