import { useState, useCallback, useRef } from "react";
import type { RtttlEditorInputHandle } from "@/components/rtttl_editor/rtttl_editor_input";
import { MAX_TRACKS, TRACK_COLORS } from "./constants";

interface UseTrackManagerInit {
  initialTracks: string[];
}

export function useTrackManager({ initialTracks }: UseTrackManagerInit) {
  const [tracks, setTracks] = useState<string[]>(() =>
    initialTracks.length > 0 ? initialTracks : [""],
  );
  const [focusedTrackIndex, setFocusedTrackIndex] = useState(0);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(
    () => new Set(tracks.map((_, i) => i)),
  );
  const [deactivatedTracks, setDeactivatedTracks] = useState<Set<number>>(new Set());
  const trackEditorRefs = useRef<(RtttlEditorInputHandle | null)[]>([]);

  const [trackColors, setTrackColorsState] = useState<string[]>(() =>
    (initialTracks.length > 0 ? initialTracks : [""]).map(
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
    if (tracks.length >= MAX_TRACKS) {
      return;
    }
    const n = tracks.length + 1;
    const stub = `Track${n}:`;
    const next = [...tracks, stub];
    commitTracks(next);
    const newIdx = next.length - 1;
    setFocusedTrackIndex(newIdx);
    setExpandedTracks((prev) => new Set(prev).add(newIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      if (tracks.length <= 1) {
        return;
      }
      const next = [...tracks];
      next.splice(index, 1);
      commitTracks(next);

      if (focusedTrackIndex >= next.length) {
        setFocusedTrackIndex(next.length - 1);
      } else if (focusedTrackIndex === index) {
        setFocusedTrackIndex(Math.max(0, index - 1));
      }

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
    if (tracks.length >= MAX_TRACKS) {
      return;
    }
    const original = tracks[index] ?? "";
    const colon = original.indexOf(":");
    let copy: string;
    if (colon >= 0) {
      const name = original.slice(0, colon);
      copy = `${name}_copy${original.slice(colon)}`;
    } else {
      copy = `${original}_copy`;
    }
    const next = [...tracks];
    next.splice(index + 1, 0, copy);
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
    const next = tracks.filter((tk) => {
      const colon = tk.indexOf(":");
      const body = colon >= 0 ? tk.slice(colon + 1).trim() : tk.trim();
      return body.length > 0;
    });
    if (next.length === 0) {
      commitTracks([""]);
    } else {
      commitTracks(next);
    }
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
    const current = tracks[idx] ?? "";
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
    next[idx] = updated;
    commitTracks(next);
  }

  function handleToolbarInsert(text: string) {
    trackEditorRefs.current[focusedTrackIndex]?.insertText(text);
  }

  function handleReorderTracks(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    const next = [...tracks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commitTracks(next);

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

    if (focusedTrackIndex === fromIndex) {
      setFocusedTrackIndex(toIndex);
    } else if (
      fromIndex < toIndex &&
      focusedTrackIndex > fromIndex &&
      focusedTrackIndex <= toIndex
    ) {
      setFocusedTrackIndex(focusedTrackIndex - 1);
    } else if (
      fromIndex > toIndex &&
      focusedTrackIndex >= toIndex &&
      focusedTrackIndex < fromIndex
    ) {
      setFocusedTrackIndex(focusedTrackIndex + 1);
    }

    setTrackColorsState((prev) => {
      const c = [...prev];
      const defaultColor = TRACK_COLORS[fromIndex % TRACK_COLORS.length] ?? "rgb(99, 102, 241)";
      const [moved] = c.splice(fromIndex, 1);
      c.splice(toIndex, 0, moved ?? defaultColor);
      return c;
    });
  }

  function resetTracks(newTracks?: string[]) {
    const initial = newTracks ?? [""];
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
