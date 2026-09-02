import { parseRtttl, getTotalDuration } from "./rtttl_parser";

/**
 * Compute the total playback duration of an RTTTL string in milliseconds.
 * Returns `null` when the code is empty or cannot be parsed.
 */
export function getRtttlDurationMs(code: string): number | null {
  if (!code.trim()) {
    return null;
  }
  const parsed = parseRtttl(code.trim());
  if (!parsed) {
    return null;
  }
  const total = getTotalDuration(parsed.notes);
  return total > 0 ? total : null;
}

/**
 * Compute the longest playback duration (in ms) across one or more RTTTL
 * track codes — used to display total duration for multi-track items.
 */
export function getMaxTrackDurationMs(codes: string[]): number {
  return codes.reduce((max, code) => Math.max(max, getRtttlDurationMs(code) ?? 0), 0);
}

/**
 * Format milliseconds into a human-readable duration string.
 * - < 1 min:  "42s"
 * - >= 1 min: "1m 05s"
 */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Format milliseconds into a playback clock string: MM:SS.
 */
export function formatPlaybackClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format an ISO date string as a short locale date (e.g. "Aug 19").
 */
export function formatShortDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
