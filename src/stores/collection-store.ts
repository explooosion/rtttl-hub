import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CollectionSlug, RtttlCategory, RtttlEntry } from "@/utils/rtttl-parser";

export type SortMode = "a-z" | "z-a" | "artist-a-z" | "artist-z-a";

interface CollectionState {
  items: RtttlEntry[];
  userItems: RtttlEntry[];
  searchQuery: string;
  sortMode: SortMode;
  activeLetter: string | null;
  activeCollection: CollectionSlug | null;
  activeCategories: RtttlCategory[];
  isLoading: boolean;
  setItems: (items: RtttlEntry[]) => void;
  addUserItem: (item: RtttlEntry) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  setActiveLetter: (letter: string | null) => void;
  setActiveCollection: (collection: CollectionSlug | null) => void;
  toggleCategory: (category: RtttlCategory) => void;
  clearCategories: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      items: [],
      userItems: [],
      searchQuery: "",
      sortMode: "a-z",
      activeLetter: null,
      activeCollection: null,
      activeCategories: [],
      isLoading: true,
      setItems: (items) => set({ items, isLoading: false }),
      addUserItem: (item) => set((state) => ({ userItems: [...state.userItems, item] })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortMode: (sortMode) => set({ sortMode }),
      setActiveLetter: (activeLetter) => set({ activeLetter }),
      setActiveCollection: (activeCollection) => set({ activeCollection }),
      toggleCategory: (category) =>
        set((state) => ({
          activeCategories: state.activeCategories.includes(category)
            ? state.activeCategories.filter((c) => c !== category)
            : [...state.activeCategories, category],
        })),
      clearCategories: () => set({ activeCategories: [] }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "rtttl-user-items",
      partialize: (state) => ({ userItems: state.userItems }),
    },
  ),
);

function matchesSearch(item: RtttlEntry, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.artist.toLowerCase().includes(q) ||
    item.code.toLowerCase().includes(q)
  );
}

function sortItems(items: RtttlEntry[], mode: SortMode): RtttlEntry[] {
  const sorted = [...items];
  if (mode === "a-z") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mode === "z-a") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  } else if (mode === "artist-a-z") {
    sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  } else if (mode === "artist-z-a") {
    sorted.sort((a, b) => b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title));
  }
  return sorted;
}

function getItemsByCollection(
  items: RtttlEntry[],
  userItems: RtttlEntry[],
  collection: CollectionSlug | null,
): RtttlEntry[] {
  if (!collection) {
    return [...items, ...userItems];
  }
  if (collection === "picaxe") {
    return items.filter((item) => item.collection === "picaxe");
  }
  if (collection === "community") {
    return userItems;
  }
  return [...items, ...userItems].filter((item) => item.collection === collection);
}

export function useFilteredItems(): RtttlEntry[] {
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const searchQuery = useCollectionStore((s) => s.searchQuery);
  const sortMode = useCollectionStore((s) => s.sortMode);
  const activeLetter = useCollectionStore((s) => s.activeLetter);
  const activeCollection = useCollectionStore((s) => s.activeCollection);
  const activeCategories = useCollectionStore((s) => s.activeCategories);

  const collectionItems = getItemsByCollection(items, userItems, activeCollection);

  let filtered = collectionItems;

  if (searchQuery.trim()) {
    filtered = filtered.filter((item) => matchesSearch(item, searchQuery));
  }

  if (activeLetter) {
    filtered = filtered.filter((item) => item.firstLetter === activeLetter);
  }

  if (activeCategories.length > 0) {
    filtered = filtered.filter(
      (item) =>
        (item.category && activeCategories.includes(item.category)) ||
        (item.sourceCategory && activeCategories.includes(item.sourceCategory as RtttlCategory)),
    );
  }

  return sortItems(filtered, sortMode);
}

export function useCollectionItemCount(collection: CollectionSlug): number {
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  if (collection === "picaxe") {
    return items.filter((item) => item.collection === "picaxe").length;
  }
  if (collection === "community") {
    return userItems.length;
  }
  return 0;
}

export function useAvailableLetters(): string[] {
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const activeCollection = useCollectionStore((s) => s.activeCollection);

  const collectionItems = getItemsByCollection(items, userItems, activeCollection);
  const letters = new Set(collectionItems.map((item) => item.firstLetter));
  return Array.from(letters).sort((a, b) => {
    if (a === "0-9") {
      return -1;
    }
    if (b === "0-9") {
      return 1;
    }
    if (a === "#") {
      return 1;
    }
    if (b === "#") {
      return -1;
    }
    return a.localeCompare(b);
  });
}
