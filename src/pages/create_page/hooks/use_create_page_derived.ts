import { useMemo } from "react";
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import { parseRtttl, getTotalDuration } from "../../../utils/rtttl_parser";
import {
  computeHasEmptyTracks,
  computeHasPlayableContent,
  computeAllTracksMuted,
  computeAnyTrackMuted,
  computeCanCutRegion,
  computeFocusedTrackName,
} from "../utils/derived_state";

interface UseCreatePageDerivedParams {
  tracks: string[];
  deactivatedTracks: Set<number>;
  trackMuted: boolean[];
  focusedTrackIndex: number;
  name: string;
  loopInMs: number | null;
  loopOutMs: number | null;
  handleReorderTracks: (from: number, to: number) => void;
}

export function useCreatePageDerived({
  tracks,
  deactivatedTracks,
  trackMuted,
  focusedTrackIndex,
  name,
  loopInMs,
  loopOutMs,
  handleReorderTracks,
}: UseCreatePageDerivedParams) {
  const maxTrackDurationMs = useMemo(() => {
    let max = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (deactivatedTracks.has(i)) {
        continue;
      }
      const tk = tracks[i]!;
      const parsed = tk.trim() ? parseRtttl(tk.trim()) : null;
      if (parsed) {
        const dur = getTotalDuration(parsed.notes);
        if (dur > max) {
          max = dur;
        }
      }
    }
    return max;
  }, [tracks, deactivatedTracks]);

  const trackIds = useMemo(() => tracks.map((_, i) => `track-${i}`), [tracks]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const fromIndex = trackIds.indexOf(active.id as string);
    const toIndex = trackIds.indexOf(over.id as string);
    if (fromIndex !== -1 && toIndex !== -1) {
      handleReorderTracks(fromIndex, toIndex);
    }
  }

  const hasDraft = name.trim().length > 0 || tracks.some((tk) => tk.trim().length > 0);
  const hasPlayableContent = computeHasPlayableContent(tracks);
  const hasUnsavedData = tracks.some((tk) => tk.trim().length > 0);
  const hasEmptyTracks = computeHasEmptyTracks(tracks);
  const allTracksMuted = computeAllTracksMuted(tracks, trackMuted);
  const anyTrackMuted = computeAnyTrackMuted(tracks, trackMuted);
  const canCutRegion = computeCanCutRegion(loopInMs, loopOutMs);

  const focusedTrackName = useMemo(
    () => computeFocusedTrackName(tracks, focusedTrackIndex),
    [tracks, focusedTrackIndex],
  );

  return {
    maxTrackDurationMs,
    trackIds,
    dndSensors,
    handleDragEnd,
    hasDraft,
    hasPlayableContent,
    hasUnsavedData,
    hasEmptyTracks,
    allTracksMuted,
    anyTrackMuted,
    canCutRegion,
    focusedTrackName,
  };
}
