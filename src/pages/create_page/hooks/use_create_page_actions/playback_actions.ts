import { useCallback } from "react";

import { usePlayheadStore } from "../../../../stores/playhead_store";

interface UsePlaybackActionsParams {
  tracks: string[];
  deactivatedTracks: Set<number>;
  lastPlayedTracksRef: React.MutableRefObject<{ tracks: string[]; deactivated: Set<number> }>;
  playerState: "idle" | "playing" | "paused" | "stopped";
  seekPositionMs: number;
  trackListRef: React.RefObject<HTMLDivElement | null>;
  setSeekPositionMs: (v: number) => void;
  stop: VoidFunction;
  pause: VoidFunction;
  resume: VoidFunction;
  playTracks: (codes: string[], startMs?: number) => void;
  playCode: (code: string, startMs?: number) => void;
}

export function usePlaybackActions({
  tracks,
  deactivatedTracks,
  lastPlayedTracksRef,
  playerState,
  seekPositionMs,
  trackListRef,
  setSeekPositionMs,
  stop,
  pause,
  resume,
  playTracks,
  playCode,
}: UsePlaybackActionsParams) {
  const handleStop = useCallback(() => {
    stop();
    setSeekPositionMs(0);
    usePlayheadStore.getState().setPlayheadMs(0);
    if (trackListRef.current) {
      trackListRef.current.scrollLeft = 0;
    }
  }, [stop, setSeekPositionMs, trackListRef]);

  const handlePlayToggle = useCallback(() => {
    if (playerState === "playing") {
      pause();
      return;
    }
    if (
      playerState === "paused" &&
      tracks === lastPlayedTracksRef.current.tracks &&
      deactivatedTracks === lastPlayedTracksRef.current.deactivated
    ) {
      resume();
      return;
    }
    const nonEmpty = tracks.filter((tk, i) => !deactivatedTracks.has(i) && tk.trim().length > 0);
    const startMs =
      playerState === "paused"
        ? usePlayheadStore.getState().playheadMs
        : seekPositionMs > 0
          ? seekPositionMs
          : undefined;
    if (nonEmpty.length > 1) {
      playTracks(nonEmpty, startMs);
    } else if (nonEmpty.length === 1) {
      playCode(nonEmpty[0]!.trim(), startMs);
    }
    lastPlayedTracksRef.current = { tracks, deactivated: deactivatedTracks };
    if (playerState !== "paused") {
      setSeekPositionMs(0);
    }
  }, [
    playerState,
    tracks,
    deactivatedTracks,
    seekPositionMs,
    pause,
    resume,
    playTracks,
    playCode,
    lastPlayedTracksRef,
    setSeekPositionMs,
  ]);

  return {
    handleStop,
    handlePlayToggle,
  };
}
