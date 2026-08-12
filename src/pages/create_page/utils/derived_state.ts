/**
 * Returns true if any track has non-empty content (trim-safe).
 */
export function computeHasPlayableContent(tracks: string[]): boolean {
  return tracks.some((tk) => tk.trim().length > 0);
}

/**
 * Returns true if any track has an empty body (the part after the first `:`,
 * trimmed, has length 0; or the whole string is empty when there is no `:`).
 */
export function computeHasEmptyTracks(tracks: string[]): boolean {
  return tracks.some((tk) => {
    const colon = tk.indexOf(":");
    const body = colon >= 0 ? tk.slice(colon + 1).trim() : tk.trim();
    return body.length === 0;
  });
}

/**
 * Returns true when every track is muted.
 * Missing entries in the `muted` array are treated as `false`.
 */
export function computeAllTracksMuted(tracks: string[], muted: boolean[]): boolean {
  return tracks.length > 0 && tracks.every((_, i) => muted[i] ?? false);
}

/**
 * Returns true when at least one track is muted.
 * Missing entries in the `muted` array are treated as `false`.
 */
export function computeAnyTrackMuted(tracks: string[], muted: boolean[]): boolean {
  return tracks.some((_, i) => muted[i] ?? false);
}

/**
 * Returns true when at least one A-B loop marker is set.
 */
export function computeCanCutRegion(loopIn: number | null, loopOut: number | null): boolean {
  return loopIn !== null || loopOut !== null;
}

/**
 * Returns the display name for the track at `index`.
 * Falls back to "Track N" when the code is empty or has no non-empty name
 * before the first `:`.
 */
export function computeFocusedTrackName(tracks: string[], index: number): string {
  const code = tracks[index] ?? "";
  if (!code.trim()) {
    return `Track ${index + 1}`;
  }
  const colonIdx = code.indexOf(":");
  if (colonIdx > 0) {
    return code.slice(0, colonIdx).trim() || `Track ${index + 1}`;
  }
  return `Track ${index + 1}`;
}
