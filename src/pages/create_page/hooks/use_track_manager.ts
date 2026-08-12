import { useState, useCallback, useRef } from "react";

import type { RtttlEditorInputHandle } from "../../../components/rtttl_editor/rtttl_editor_input";
import { TRACK_COLORS, NEW_TRACK_STUB_BODY } from "../constants";
import {
  addTrack,
  removeTrack,
  duplicateTrack,
  removeEmptyTracks,
  reorderTracks,
  renameTrack,
  adjustFocusedIndexAfterRemove,
  adjustFocusedIndexAfterReorder,
} from "../utils/track_operations";

interface UseTrackManagerInit {
  initialTracks: string[];
}

export function useTrackManager({ initialTracks }: UseTrackManagerInit) {
  const [tracks, setTracks] = useState<string[]>(() =>
    initialTracks.length > 0 ? initialTracks : [`Track1:${NEW_TRACK_STUB_BODY}`],
  );
  const [focusedTrackIndex, setFocusedTrackIndex] = useState(0);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(
    () => new Set(tracks.map((_, i) => i)),
  );
  const [deactivatedTracks, setDeactivatedTracks] = useState<Set<number>>(new Set());
  const trackEditorRefs = useRef<(RtttlEditorInputHandle | null)[]>([]);

  const [trackColors, setTrackColorsState] = useState<string[]>(() =>
    (initialTracks.length > 0 ? initialTracks : [`Track1:${NEW_TRACK_STUB_BODY}`]).map(
      (_, i) => TRACK_COLORS[i % TRACK_COLORS.length] ?? "rgb(99, 102, 241)",
    ),
  );

  function setTrackColor(index: number, color: string) {
    setTrackColorsState((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push(TRACK_COLORS[next.length % TRACK_COLORS.length] ?? "rgb(99, 102, 241)");
      }
      next[index] = color;
      return next;
    });
  }

  /* ── Undo / Redo history ── */
  const pastRef = useRef<string[][]>([]);
  const futureRef = useRef<string[][]>([]);
  const [historyVersion, setHistoryVersion] = useState(0); // triggers re-render for canUndo/canRedo

  function commitTracks(next: string[]) {
    pastRef.current = [...pastRef.current, tracks];
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
    setTracks(next);
  }

  const canUndo = historyVersion >= 0 && pastRef.current.length > 0;
  const canRedo = historyVersion >= 0 && futureRef.current.length > 0;

  function undo() {
    if (pastRef.current.length === 0) {
      return;
    }
    const prev = pastRef.current[pastRef.current.length - 1]!;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [tracks, ...futureRef.current];
    setHistoryVersion((v) => v + 1);
    setTracks(prev);
  }

  function redo() {
    if (futureRef.current.length === 0) {
      return;
    }
    const next = futureRef.current[0]!;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, tracks];
    setHistoryVersion((v) => v + 1);
    setTracks(next);
  }

  function handleTrackCodeChange(idx: number, newCode: string) {
    const next = [...tracks];
    next[idx] = newCode;
    commitTracks(next);
  }

  const handleAddTrack = useCallback(() => {
    const next = addTrack(tracks);
    if (!next) {
      return;
    }
    commitTracks(next);
    const newIdx = next.length - 1;
    setFocusedTrackIndex(newIdx);
    setExpandedTracks((prev) => new Set(prev).add(newIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      const next = removeTrack(tracks, index);
      if (!next) {
        return;
      }
      commitTracks(next);

      setFocusedTrackIndex((fi) => adjustFocusedIndexAfterRemove(fi, index, next.length));

      setExpandedTracks((prev) => {
        const rebuilt = new Set<number>();
        for (const v of prev) {
          if (v < index) {
            rebuilt.add(v);
          } else if (v > index) {
            rebuilt.add(v - 1);
          }
        }
        return rebuilt;
      });

      setDeactivatedTracks((prev) => {
        const rebuilt = new Set<number>();
        for (const v of prev) {
          if (v < index) {
            rebuilt.add(v);
          } else if (v > index) {
            rebuilt.add(v - 1);
          }
        }
        return rebuilt;
      });

      setTrackColorsState((prev) => {
        const c = [...prev];
        c.splice(index, 1);
        return c;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tracks, focusedTrackIndex],
  );

  function handleDuplicateTrack(index: number) {
    const next = duplicateTrack(tracks, index);
    if (!next) {
      return;
    }
    commitTracks(next);
    const newIdx = index + 1;
    setFocusedTrackIndex(newIdx);
    setExpandedTracks((prev) => {
      const rebuilt = new Set<number>();
      for (const v of prev) {
        if (v <= index) {
          rebuilt.add(v);
        } else {
          rebuilt.add(v + 1);
        }
      }
      rebuilt.add(newIdx);
      return rebuilt;
    });
    setDeactivatedTracks((prev) => {
      const rebuilt = new Set<number>();
      for (const v of prev) {
        if (v <= index) {
          rebuilt.add(v);
        } else {
          rebuilt.add(v + 1);
        }
      }
      return rebuilt;
    });

    setTrackColorsState((prev) => {
      const c = [...prev];
      const defaultColor = TRACK_COLORS[index % TRACK_COLORS.length] ?? "rgb(99, 102, 241)";
      c.splice(index + 1, 0, c[index] ?? defaultColor);
      return c;
    });
  }

  function toggleDeactivateTrack(index: number) {
    setDeactivatedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleRemoveEmptyTracks() {
    const next = removeEmptyTracks(tracks);
    commitTracks(next);
    setFocusedTrackIndex(0);
    setExpandedTracks(new Set(next.map((_, i) => i)));
    setDeactivatedTracks(new Set());
  }

  function toggleTrackExpanded(index: number) {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function collapseAllTracks() {
    setExpandedTracks(new Set());
  }

  function expandAllTracks() {
    setExpandedTracks(new Set(tracks.map((_, i) => i)));
  }

  function handleRenameTrack(idx: number, newName: string) {
    commitTracks(renameTrack(tracks, idx, newName));
  }

  function handleToolbarInsert(text: string) {
    trackEditorRefs.current[focusedTrackIndex]?.insertText(text);
  }

  function handleReorderTracks(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    commitTracks(reorderTracks(tracks, fromIndex, toIndex));

    setExpandedTracks((prev) => {
      const rebuilt = new Set<number>();
      for (const v of prev) {
        if (v === fromIndex) {
          rebuilt.add(toIndex);
        } else if (fromIndex < toIndex && v > fromIndex && v <= toIndex) {
          rebuilt.add(v - 1);
        } else if (fromIndex > toIndex && v >= toIndex && v < fromIndex) {
          rebuilt.add(v + 1);
        } else {
          rebuilt.add(v);
        }
      }
      return rebuilt;
    });

    setDeactivatedTracks((prev) => {
      const rebuilt = new Set<number>();
      for (const v of prev) {
        if (v === fromIndex) {
          rebuilt.add(toIndex);
        } else if (fromIndex < toIndex && v > fromIndex && v <= toIndex) {
          rebuilt.add(v - 1);
        } else if (fromIndex > toIndex && v >= toIndex && v < fromIndex) {
          rebuilt.add(v + 1);
        } else {
          rebuilt.add(v);
        }
      }
      return rebuilt;
    });

    setFocusedTrackIndex((fi) => adjustFocusedIndexAfterReorder(fi, fromIndex, toIndex));

    setTrackColorsState((prev) => {
      const c = [...prev];
      const defaultColor = TRACK_COLORS[fromIndex % TRACK_COLORS.length] ?? "rgb(99, 102, 241)";
      const [moved] = c.splice(fromIndex, 1);
      c.splice(toIndex, 0, moved ?? defaultColor);
      return c;
    });
  }

  function resetTracks(newTracks?: string[]) {
    const initial = newTracks ?? [`Track1:${NEW_TRACK_STUB_BODY}`];
    pastRef.current = [];
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
    setTracks(initial);
    setFocusedTrackIndex(0);
    setExpandedTracks(new Set(initial.map((_, i) => i)));
    setDeactivatedTracks(new Set());
    setTrackColorsState(
      initial.map((_, i) => TRACK_COLORS[i % TRACK_COLORS.length] ?? "rgb(99, 102, 241)"),
    );
  }

  return {
    tracks,
    setTracks: commitTracks,
    focusedTrackIndex,
    setFocusedTrackIndex,
    expandedTracks,
    deactivatedTracks,
    trackColors,
    setTrackColor,
    trackEditorRefs,
    canUndo,
    canRedo,
    undo,
    redo,
    handleTrackCodeChange,
    handleAddTrack,
    handleRemoveTrack,
    handleDuplicateTrack,
    toggleDeactivateTrack,
    handleRemoveEmptyTracks,
    toggleTrackExpanded,
    collapseAllTracks,
    expandAllTracks,
    handleRenameTrack,
    handleToolbarInsert,
    handleReorderTracks,
    resetTracks,
  };
}
