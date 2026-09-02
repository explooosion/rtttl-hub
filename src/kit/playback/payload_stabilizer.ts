import type { PlaybackCallbackPayload } from "./types";

function sameArray<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function createPayloadStabilizer(): (
  next: PlaybackCallbackPayload,
) => PlaybackCallbackPayload | null {
  let prev: PlaybackCallbackPayload | null = null;

  return (next) => {
    if (!prev) {
      prev = next;
      return next;
    }

    const sameIndices = sameArray(prev.trackNoteIndices, next.trackNoteIndices);
    const sameTotals = sameArray(prev.trackTotalNotes, next.trackTotalNotes);
    const sameMuted = sameArray(prev.trackMuted, next.trackMuted);

    if (
      sameIndices &&
      sameTotals &&
      sameMuted &&
      prev.state === next.state &&
      prev.currentNoteIndex === next.currentNoteIndex &&
      prev.totalNotes === next.totalNotes
    ) {
      return null;
    }

    const stabilized: PlaybackCallbackPayload = {
      state: next.state,
      currentNoteIndex: next.currentNoteIndex,
      totalNotes: next.totalNotes,
      trackNoteIndices: sameIndices ? prev.trackNoteIndices : next.trackNoteIndices,
      trackTotalNotes: sameTotals ? prev.trackTotalNotes : next.trackTotalNotes,
      trackMuted: sameMuted ? prev.trackMuted : next.trackMuted,
    };
    prev = stabilized;
    return stabilized;
  };
}
