import type { CollectionSlug, RtttlCategory, RtttlEntry } from "./rtttl_parser";

/** Unified shape for collection JSON files (picaxe.json, esc-configurator.json). */
export interface CollectionEntry {
  name: string;
  artist?: string;
  category?: RtttlCategory;
  /** Source category label (e.g. "Mixed 1", "TV Themes") — picaxe only. */
  sourceCategory?: string;
  /** One RTTTL string per voice/track. tracks[0] is used as the primary `code`. */
  tracks: string[];
}

function getFirstLetter(artist: string | undefined, name: string): string {
  const source = (artist ?? name).trim();
  if (!source) return "#";
  const first = source.charAt(0).toUpperCase();
  if (/[A-Z]/.test(first)) return first;
  if (/[0-9]/.test(first)) return "0-9";
  return "#";
}

/**
 * Convert a raw `CollectionEntry[]` (fetched from a public JSON file) into
 * fully-typed `RtttlEntry[]` objects by deriving `id`, `firstLetter`, and
 * `code` at runtime.
 *
 * @param entries  Raw entries from the JSON file.
 * @param collection  Slug identifying which collection these entries belong to.
 * @param idPrefix  Prefix for stable synthetic IDs (e.g. "picaxe", "esc").
 */
export function toRtttlEntries(
  entries: CollectionEntry[],
  collection: CollectionSlug,
  idPrefix: string,
): RtttlEntry[] {
  return entries.map((entry, index) => ({
    id: `${idPrefix}-${index}`,
    title: entry.name,
    artist: entry.artist ?? "",
    firstLetter: getFirstLetter(entry.artist, entry.name),
    code: entry.tracks[0] ?? "",
    collection,
    category: entry.category,
    sourceCategory: entry.sourceCategory,
    tracks: entry.tracks.length > 1 ? entry.tracks : undefined,
  }));
}
