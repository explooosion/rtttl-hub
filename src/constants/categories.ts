import type { RtttlCategory } from "../utils/rtttl_parser";

export const RTTTL_CATEGORIES = [
  "pop",
  "classical",
  "movie-tv",
  "game",
  "holiday",
  "folk",
  "alert",
  "original",
] as const satisfies readonly RtttlCategory[];
