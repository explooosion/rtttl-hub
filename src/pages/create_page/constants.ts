export const DRAFT_KEY = "rtttl-hub:create-draft";

export const TRACK_COLORS = [
  "rgb(99, 102, 241)", // indigo-500  Track 1
  "rgb(16, 185, 129)", // emerald-500 Track 2
  "rgb(245, 158, 11)", // amber-500   Track 3
  "rgb(244, 63, 94)", //  rose-500    Track 4
  "rgb(139, 92, 246)", // violet-500  Track 5
  "rgb(6, 182, 212)", //  cyan-500    Track 6
  "rgb(249, 115, 22)", // orange-500  Track 7
  "rgb(236, 72, 153)", // pink-500    Track 8
] as const;

export const TRACK_DOT_CLASSES = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
] as const;

export const MAX_TRACKS = 8;

/** Default pixels per second for the time-aligned timeline. */
export const PX_PER_SEC_DEFAULT = 100;
export const PX_PER_SEC_MIN = 20;
export const PX_PER_SEC_MAX = 800;
/** Minimum timeline canvas width in px regardless of duration. */
export const TIMELINE_MIN_WIDTH = 600;
