import type { SortMode } from "../../stores/collection_store";
import type { RtttlEntry, RtttlCategory } from "../../utils/rtttl_parser";
import type { TrackRowAction } from "../../components/track_row";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface ListPageLayoutProps {
  items: RtttlEntry[];
  isLoading?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  source?: string;
  headerActions?: React.ReactNode;
  extraRowActions?: TrackRowAction[];
  showActionsAsMenu?: boolean;
  /** Row action always rendered inline, never collapsed into the "..." menu. */
  pinnedRowAction?: TrackRowAction;
  emptyNode?: React.ReactNode;
}

export interface RowHeaderData {
  type: "header";
  letter: string;
}

export interface RowItemData {
  type: "item";
  item: RtttlEntry;
}

export type RowData = RowHeaderData | RowItemData;

export const ITEMS_PER_PAGE = 50;

interface SortItemsOptions {
  stablePlayCountById?: ReadonlyMap<string, number>;
  stableOrderById?: ReadonlyMap<string, number>;
}

function resolveStableOrder(id: string, stableOrderById?: ReadonlyMap<string, number>): number {
  if (!stableOrderById) {
    return Number.MAX_SAFE_INTEGER;
  }
  return stableOrderById.get(id) ?? Number.MAX_SAFE_INTEGER;
}

function compareByStableOrder(
  a: RtttlEntry,
  b: RtttlEntry,
  stableOrderById?: ReadonlyMap<string, number>,
) {
  return resolveStableOrder(a.id, stableOrderById) - resolveStableOrder(b.id, stableOrderById);
}

export function matchesSearch(item: RtttlEntry, query: string) {
  const normalizedQuery = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(normalizedQuery) ||
    item.artist.toLowerCase().includes(normalizedQuery) ||
    item.code.toLowerCase().includes(normalizedQuery)
  );
}

export function sortItems(arr: RtttlEntry[], mode: SortMode, options?: SortItemsOptions) {
  const sorted = [...arr];
  if (mode === "a-z") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mode === "z-a") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  } else if (mode === "artist-a-z") {
    sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  } else if (mode === "artist-z-a") {
    sorted.sort((a, b) => b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title));
  } else if (mode === "plays-high") {
    sorted.sort((a, b) => {
      const aPlays = options?.stablePlayCountById?.get(a.id) ?? a.playCount ?? 0;
      const bPlays = options?.stablePlayCountById?.get(b.id) ?? b.playCount ?? 0;
      const diff = bPlays - aPlays;
      if (diff !== 0) {
        return diff;
      }
      return compareByStableOrder(a, b, options?.stableOrderById);
    });
  } else if (mode === "plays-low") {
    sorted.sort((a, b) => {
      const aPlays = options?.stablePlayCountById?.get(a.id) ?? a.playCount ?? 0;
      const bPlays = options?.stablePlayCountById?.get(b.id) ?? b.playCount ?? 0;
      const diff = aPlays - bPlays;
      if (diff !== 0) {
        return diff;
      }
      return compareByStableOrder(a, b, options?.stableOrderById);
    });
  } else if (mode === "updated-desc") {
    sorted.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  } else if (mode === "updated-asc") {
    sorted.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return aTime - bTime;
    });
  }
  return sorted;
}

export function getFirstLetter(item: RtttlEntry) {
  return item.firstLetter ?? (item.title[0] ?? "#").toUpperCase();
}

export interface SortOption {
  value: SortMode;
  label: string;
}

export type CategoryToggleHandlers = Record<RtttlCategory, () => void>;
