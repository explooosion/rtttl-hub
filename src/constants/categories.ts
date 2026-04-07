import type { RtttlCategory } from "@/utils/rtttl-parser";

export const RTTTL_CATEGORIES = [
  "pop",
  "rock",
  "classical",
  "movie-tv",
  "game",
  "holiday",
  "folk",
  "nursery",
  "alert",
  "original",
] as const satisfies readonly RtttlCategory[];
