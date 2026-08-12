import { MAX_TRACKS, NEW_TRACK_STUB_BODY } from "../constants";

/**
 * Returns the new tracks array after appending a new stub track.
 * Returns null when already at MAX_TRACKS.
 */
export function addTrack(tracks: string[]): string[] | null {
  if (tracks.length >= MAX_TRACKS) {
    return null;
  }
  const n = tracks.length + 1;
  return [...tracks, `Track${n}:${NEW_TRACK_STUB_BODY}`];
}

/**
 * Returns the new tracks array after removing the track at `index`.
 * Returns null when there is only one track (cannot remove the last).
 */
export function removeTrack(tracks: string[], index: number): string[] | null {
  if (tracks.length <= 1) {
    return null;
  }
  const next = [...tracks];
  next.splice(index, 1);
  return next;
}

/**
 * Returns the new tracks array after duplicating the track at `index`.
 * The copy is inserted immediately after the original with `_copy` appended to its name.
 * Returns null when already at MAX_TRACKS.
 */
export function duplicateTrack(tracks: string[], index: number): string[] | null {
  if (tracks.length >= MAX_TRACKS) {
    return null;
  }
  const original = tracks[index] ?? "";
  const colon = original.indexOf(":");
  let copy: string;
  if (colon >= 0) {
    copy = `${original.slice(0, colon)}_copy${original.slice(colon)}`;
  } else {
    copy = `${original}_copy`;
  }
  const next = [...tracks];
  next.splice(index + 1, 0, copy);
  return next;
}

/**
 * Returns the filtered tracks array with empty-body tracks removed.
 * A track is "empty" when its body (everything after the first `:`), trimmed, has length 0.
 * Always returns at least `[""]` so the editor never has zero tracks.
 */
export function removeEmptyTracks(tracks: string[]): string[] {
  const next = tracks.filter((tk) => {
    const colon = tk.indexOf(":");
    const body = colon >= 0 ? tk.slice(colon + 1).trim() : tk.trim();
    return body.length > 0;
  });
  return next.length > 0 ? next : [""];
}

/**
 * Returns the new tracks array after moving a track from `fromIndex` to `toIndex`.
 * Returns a shallow copy of the original array when from === to.
 */
export function reorderTracks(tracks: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex) {
    return [...tracks];
  }
  const next = [...tracks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  return next;
}

/**
 * Returns the new tracks array after renaming the track at `index`.
 * Only the name portion (before the first `:`) is changed.
 */
export function renameTrack(tracks: string[], index: number, newName: string): string[] {
  const current = tracks[index] ?? "";
  let updated: string;
  if (!current.trim()) {
    updated = `${newName}:`;
  } else {
    const colonIdx = current.indexOf(":");
    if (colonIdx >= 0) {
      updated = newName + current.slice(colonIdx);
    } else {
      updated = `${newName}:${current}`;
    }
  }
  const next = [...tracks];
  next[index] = updated;
  return next;
}

/**
 * Returns the adjusted focused-track index after a removal at `removedIndex`.
 * `newLength` is the length of the tracks array after removal.
 */
export function adjustFocusedIndexAfterRemove(
  focusedIndex: number,
  removedIndex: number,
  newLength: number,
): number {
  if (focusedIndex >= newLength) {
    return newLength - 1;
  }
  if (focusedIndex === removedIndex) {
    return Math.max(0, removedIndex - 1);
  }
  return focusedIndex;
}

/**
 * Returns the adjusted focused-track index after a reorder from `fromIndex` to `toIndex`.
 */
export function adjustFocusedIndexAfterReorder(
  focusedIndex: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (focusedIndex === fromIndex) {
    return toIndex;
  }
  if (fromIndex < toIndex && focusedIndex > fromIndex && focusedIndex <= toIndex) {
    return focusedIndex - 1;
  }
  if (fromIndex > toIndex && focusedIndex >= toIndex && focusedIndex < fromIndex) {
    return focusedIndex + 1;
  }
  return focusedIndex;
}
