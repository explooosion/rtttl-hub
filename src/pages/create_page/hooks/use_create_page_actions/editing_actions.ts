import { useCallback } from "react";

import { usePlayheadStore } from "../../../../stores/playhead_store";
import { deleteRegionRtttl, trimRtttl } from "../../utils/rtttl_cutter";
import type { CutMode } from "../../cut_dialog";

interface UseEditingActionsParams {
  tracks: string[];
  trackMuted: boolean[];
  toggleMuteTrack: (i: number) => void;
  playerState: "idle" | "playing" | "paused" | "stopped";
  seekPositionMs: number;
  loopInMs: number | null;
  loopOutMs: number | null;
  setLoopInMs: (v: number | null) => void;
  setLoopOutMs: (v: number | null) => void;
  commitTracks: (v: string[]) => void;
  setCutDialogMode: (v: CutMode | null) => void;
}

export function useEditingActions({
  tracks,
  trackMuted,
  toggleMuteTrack,
  playerState,
  seekPositionMs,
  loopInMs,
  loopOutMs,
  setLoopInMs,
  setLoopOutMs,
  commitTracks,
  setCutDialogMode,
}: UseEditingActionsParams) {
  const handleMuteAll = useCallback(() => {
    for (let i = 0; i < tracks.length; i++) {
      if (!(trackMuted[i] ?? false)) {
        toggleMuteTrack(i);
      }
    }
  }, [tracks, trackMuted, toggleMuteTrack]);

  const handleUnmuteAll = useCallback(() => {
    for (let i = 0; i < tracks.length; i++) {
      if (trackMuted[i] ?? false) {
        toggleMuteTrack(i);
      }
    }
  }, [tracks, trackMuted, toggleMuteTrack]);

  const handleSetLoopIn = useCallback(() => {
    setLoopInMs(playerState !== "idle" ? usePlayheadStore.getState().playheadMs : seekPositionMs);
  }, [playerState, seekPositionMs, setLoopInMs]);

  const handleSetLoopOut = useCallback(() => {
    setLoopOutMs(playerState !== "idle" ? usePlayheadStore.getState().playheadMs : seekPositionMs);
  }, [playerState, seekPositionMs, setLoopOutMs]);

  const handleClearLoop = useCallback(() => {
    setLoopInMs(null);
    setLoopOutMs(null);
  }, [setLoopInMs, setLoopOutMs]);

  const applyCut = useCallback(
    (mode: CutMode, indices: number[]) => {
      const fn = mode === "trim" ? trimRtttl : deleteRegionRtttl;
      commitTracks(
        tracks.map((code, i) => (indices.includes(i) ? fn(code, loopInMs, loopOutMs) : code)),
      );
      setLoopInMs(null);
      setLoopOutMs(null);
    },
    [tracks, loopInMs, loopOutMs, commitTracks, setLoopInMs, setLoopOutMs],
  );

  const handleTrimRegion = useCallback(() => {
    if (tracks.length <= 1) {
      applyCut("trim", [0]);
    } else {
      setCutDialogMode("trim");
    }
  }, [tracks.length, applyCut, setCutDialogMode]);

  const handleDeleteRegion = useCallback(() => {
    if (tracks.length <= 1) {
      applyCut("delete", [0]);
    } else {
      setCutDialogMode("delete");
    }
  }, [tracks.length, applyCut, setCutDialogMode]);

  const handleCutConfirm = useCallback(
    (selectedIndices: number[], mode: CutMode | null) => {
      if (mode !== null) {
        applyCut(mode, selectedIndices);
      }
      setCutDialogMode(null);
    },
    [applyCut, setCutDialogMode],
  );

  const handleCutCancel = useCallback(() => {
    setCutDialogMode(null);
  }, [setCutDialogMode]);

  return {
    handleMuteAll,
    handleUnmuteAll,
    handleSetLoopIn,
    handleSetLoopOut,
    handleClearLoop,
    handleTrimRegion,
    handleDeleteRegion,
    handleCutConfirm,
    handleCutCancel,
  };
}
