import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { parseRtttl, getTotalDuration } from "@/utils/rtttl-parser";
import type { RtttlCategory } from "@/utils/rtttl-parser";
import type { RtttlEditorInputHandle } from "@/components/RtttlEditor/RtttlEditorInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DawHeader } from "./DawHeader";
import { TransportToolbar } from "./TransportToolbar";
import { TrackLane } from "./TrackLane";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { ImportDialog } from "./ImportDialog";
import { loadDraft, saveDraft, clearDraft } from "./draft";
import {
  MAX_TRACKS,
  PX_PER_SEC_DEFAULT,
  PX_PER_SEC_MIN,
  PX_PER_SEC_MAX,
  TIMELINE_MIN_WIDTH,
} from "./constants";
import { TimeRuler } from "./TimeRuler";

export function CreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playCode = usePlayerStore((s) => s.playCode);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const seekToMs = usePlayerStore((s) => s.seekToMs);
  const trackMuted = usePlayerStore((s) => s.trackMuted);
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);
  const playerState = usePlayerStore((s) => s.playerState);

  /* ── Local state ── */
  const [importOpen, setImportOpen] = useState(false);

  const _draft = loadDraft();
  const [name, setName] = useState(() => _draft?.name ?? "");
  const [code, setCode] = useState(() => _draft?.code ?? "");
  const [category, setCategory] = useState<RtttlCategory | "">(() => _draft?.category ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  const [tracks, setTracks] = useState<string[]>(() =>
    _draft?.tracks && _draft.tracks.length > 0 ? _draft.tracks : [""],
  );
  const [focusedTrackIndex, setFocusedTrackIndex] = useState(0);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(
    () => new Set(tracks.map((_, i) => i)),
  );

  const trackEditorRefs = useRef<(RtttlEditorInputHandle | null)[]>([]);
  const trackListRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [guideMs, setGuideMs] = useState<number | null>(null);
  const [seekPositionMs, setSeekPositionMs] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(PX_PER_SEC_DEFAULT);
  const [playheadMs, setPlayheadMs] = useState(0);

  // Auto-scroll: track playback start time
  const playbackStartMs = useRef<number | null>(null);
  const pausedOffsetMs = useRef(0);
  const lastPauseStart = useRef<number | null>(null);
  const rafAutoScroll = useRef(0);
  const pxPerSecRef = useRef(pxPerSec);
  const maxTrackDurationMsRef = useRef(0);

  const maxTrackDurationMs = useMemo(() => {
    let max = 0;
    for (const tk of tracks) {
      const parsed = tk.trim() ? parseRtttl(tk.trim()) : null;
      if (parsed) {
        const dur = getTotalDuration(parsed.notes);
        if (dur > max) max = dur;
      }
    }
    return max;
  }, [tracks]);

  const timelineWidthPx = Math.max(
    TIMELINE_MIN_WIDTH,
    Math.round((maxTrackDurationMs / 1000) * pxPerSec),
  );
  // Sync mutable refs used inside rAF closures
  useEffect(() => {
    pxPerSecRef.current = pxPerSec;
  });
  useEffect(() => {
    maxTrackDurationMsRef.current = maxTrackDurationMs;
  });

  // Update playback clock refs when state changes
  useEffect(() => {
    if (playerState === "playing") {
      if (lastPauseStart.current !== null) {
        pausedOffsetMs.current += Date.now() - lastPauseStart.current;
        lastPauseStart.current = null;
      }
      if (playbackStartMs.current === null) {
        playbackStartMs.current = Date.now();
        pausedOffsetMs.current = 0;
      }
    } else if (playerState === "paused") {
      if (lastPauseStart.current === null) {
        lastPauseStart.current = Date.now();
      }
    } else {
      playbackStartMs.current = null;
      pausedOffsetMs.current = 0;
      lastPauseStart.current = null;
    }
  }, [playerState]);

  // Auto-scroll the track container to follow the playhead during playback
  useEffect(() => {
    if (playerState !== "playing") {
      cancelAnimationFrame(rafAutoScroll.current);
      return;
    }
    const HEADER_W = 176; // w-44 = 11rem = 176px
    const animate = () => {
      const el = trackListRef.current;
      if (!el || playbackStartMs.current === null) {
        rafAutoScroll.current = requestAnimationFrame(animate);
        return;
      }
      const elapsed = Date.now() - playbackStartMs.current - pausedOffsetMs.current;
      const dur = maxTrackDurationMsRef.current;
      // Update global playhead
      setPlayheadMs(Math.min(dur, elapsed));
      if (dur <= 0) {
        rafAutoScroll.current = requestAnimationFrame(animate);
        return;
      }
      const playheadPx =
        HEADER_W +
        (elapsed / dur) *
          Math.max(TIMELINE_MIN_WIDTH, Math.round((dur / 1000) * pxPerSecRef.current));
      const visible = el.clientWidth;
      // Keep playhead at ~30% from left edge; only move if it goes past 70%
      const targetLeft = playheadPx - visible * 0.3;
      const rightEdge = el.scrollLeft + visible * 0.7;
      if (playheadPx > rightEdge || playheadPx < el.scrollLeft + HEADER_W) {
        el.scrollLeft = Math.max(0, targetLeft);
      }
      rafAutoScroll.current = requestAnimationFrame(animate);
    };
    rafAutoScroll.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafAutoScroll.current);
  }, [playerState]);

  const hasDraft = name.trim().length > 0 || tracks.some((tk) => tk.trim().length > 0);
  const hasPlayableContent = tracks.some((tk) => tk.trim().length > 0);

  /* ── Draft persistence ── */
  useEffect(
    function saveDraftOnChange() {
      saveDraft({ name, code, category, tracks });
    },
    [name, code, category, tracks],
  );

  /* ── Track handlers ── */
  function handleTrackCodeChange(idx: number, newCode: string) {
    const next = [...tracks];
    next[idx] = newCode;
    setTracks(next);
    if (idx === 0) setCode(newCode);
  }

  const handleAddTrack = useCallback(() => {
    if (tracks.length >= MAX_TRACKS) return;
    const next = [...tracks, ""];
    setTracks(next);
    const newIdx = next.length - 1;
    setFocusedTrackIndex(newIdx);
    setExpandedTracks((prev) => new Set(prev).add(newIdx));
  }, [tracks]);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      if (tracks.length <= 1) return;
      const next = [...tracks];
      next.splice(index, 1);
      setTracks(next);
      if (next.length > 0) setCode(next[0]);

      if (focusedTrackIndex >= next.length) {
        setFocusedTrackIndex(next.length - 1);
      } else if (focusedTrackIndex === index) {
        setFocusedTrackIndex(Math.max(0, index - 1));
      }

      setExpandedTracks((prev) => {
        const rebuilt = new Set<number>();
        for (const v of prev) {
          if (v < index) rebuilt.add(v);
          else if (v > index) rebuilt.add(v - 1);
        }
        return rebuilt;
      });
    },
    [tracks, focusedTrackIndex],
  );

  function toggleTrackExpanded(index: number) {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  /* ── Toolbar insert → focused track ── */
  function handleToolbarInsert(text: string) {
    trackEditorRefs.current[focusedTrackIndex]?.insertText(text);
  }

  /* ── New project ── */
  function handleNew() {
    stop();
    clearDraft();
    setName("");
    setCode("");
    setCategory("");
    setErrors([]);
    setTracks([""]);
    setFocusedTrackIndex(0);
    setExpandedTracks(new Set([0]));
  }

  /* ── Playback ── */
  function handlePlayToggle() {
    if (playerState === "playing") {
      pause();
    } else if (playerState === "paused") {
      resume();
    } else {
      const nonEmpty = tracks.filter((tk) => tk.trim().length > 0);
      if (nonEmpty.length > 1) {
        playTracks(nonEmpty);
      } else if (nonEmpty.length === 1) {
        playCode(nonEmpty[0].trim());
      }
      // Apply pending seek position: adjust clock so elapsed starts at seekPositionMs
      if (seekPositionMs > 0 && maxTrackDurationMs > 0) {
        playbackStartMs.current = Date.now() - seekPositionMs;
        pausedOffsetMs.current = 0;
        seekToMs(seekPositionMs);
        setSeekPositionMs(0);
      }
    }
  }

  /* ── Submit / Discard ── */
  function handleSubmit() {
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push(t("create.nameRequired"));
    const primaryCode = tracks[0] ?? "";
    if (!primaryCode.trim() || !parseRtttl(primaryCode.trim())) {
      newErrors.push(t("create.invalidCode"));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const firstLetter = name.charAt(0).toUpperCase();
    const id = `user-${crypto.randomUUID()}`;
    const nonEmptyTracks = tracks.filter((tk) => tk.trim().length > 0);

    const newItem = {
      id,
      artist: "",
      title: name.trim(),
      firstLetter: /[A-Z]/.test(firstLetter)
        ? firstLetter
        : /[0-9]/.test(firstLetter)
          ? "0-9"
          : "#",
      code: primaryCode.trim(),
      collection: "community" as const,
      category: category || undefined,
      createdAt: new Date().toISOString(),
      ...(nonEmptyTracks.length > 1 ? { tracks: nonEmptyTracks } : {}),
    };

    addUserItem(newItem);
    setCurrentItem(newItem);
    clearDraft();
    stop();
    navigate("/collections/community");
  }

  function handleDiscard() {
    stop();
    clearDraft();
    navigate(-1);
  }

  /* ── Import ── */
  function handleImportConfirm(parsed: string[]) {
    const firstName = parsed[0].split(":")[0]?.trim();
    if (firstName) setName(firstName);

    setTracks(parsed.slice(0, MAX_TRACKS));
    setCode(parsed[0]);
    setFocusedTrackIndex(0);
    setExpandedTracks(new Set(parsed.map((_, i) => i)));
    setImportOpen(false);
  }

  function handleTrackAreaMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackListRef.current;
    if (!el || maxTrackDurationMs <= 0) return;
    const rect = el.getBoundingClientRect();
    const HEADER_W = 176;
    const timelineX = e.clientX - rect.left + el.scrollLeft - HEADER_W;
    if (timelineX < 0) {
      setGuideMs(null);
      return;
    }
    const ms = Math.max(
      0,
      Math.min(maxTrackDurationMs, (timelineX / timelineWidthPx) * maxTrackDurationMs),
    );
    setGuideMs(ms);
  }

  function handleTrackAreaClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackListRef.current;
    if (!el || maxTrackDurationMs <= 0) return;
    const rect = el.getBoundingClientRect();
    const HEADER_W = 176;
    const timelineX = e.clientX - rect.left + el.scrollLeft - HEADER_W;
    if (timelineX < 0) return;
    const ms = Math.max(
      0,
      Math.min(maxTrackDurationMs, (timelineX / timelineWidthPx) * maxTrackDurationMs),
    );
    if (playerState === "playing") {
      // Adjust clock so elapsed jumps to ms
      playbackStartMs.current = Date.now() - pausedOffsetMs.current - ms;
      setPlayheadMs(ms);
      seekToMs(ms);
    } else {
      // Not playing: store seek position + show visually
      setSeekPositionMs(ms);
      setPlayheadMs(ms);
    }
  }

  // Non-passive wheel handler for zoom-to-cursor
  useEffect(
    function attachWheelZoom() {
      const el = trackListRef.current;
      if (!el) return;
      function onWheel(e: WheelEvent) {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const HEADER_W = 176;
        const rect = el!.getBoundingClientRect();
        const cursorOffsetPx = e.clientX - rect.left - HEADER_W; // px from timeline start
        const scrollLeft = el!.scrollLeft;
        const cursorTimeSec = (scrollLeft + cursorOffsetPx) / pxPerSec;

        setPxPerSec((prev) => {
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          const next = Math.min(PX_PER_SEC_MAX, Math.max(PX_PER_SEC_MIN, prev * factor));
          // Adjust scrollLeft so cursor time stays fixed
          requestAnimationFrame(() => {
            el!.scrollLeft = cursorTimeSec * next - cursorOffsetPx;
          });
          return next;
        });
      }
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    },
    [pxPerSec],
  );

  /* ── Render ── */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-950">
      <DawHeader />
      <TransportToolbar
        hasPlayableContent={hasPlayableContent}
        onPlayToggle={handlePlayToggle}
        onToolbarInsert={handleToolbarInsert}
        onNew={handleNew}
        onImport={() => setImportOpen(true)}
        onNavigateHome={() => navigate("/")}
        onFocusName={() => nameInputRef.current?.focus()}
        onCreate={handleSubmit}
        onDiscard={handleDiscard}
        onAddTrack={handleAddTrack}
        onRemoveFocusedTrack={() => setConfirmRemoveIndex(focusedTrackIndex)}
        onToggleMuteFocusedTrack={() => toggleMuteTrack(focusedTrackIndex)}
        canAddTrack={tracks.length < MAX_TRACKS}
        canRemoveTrack={tracks.length > 1}
        focusedTrackIsMuted={trackMuted[focusedTrackIndex] ?? false}
      />

      {/* Main area: track list (left) + properties panel (right) */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Track list */}
        <div
          ref={trackListRef}
          className="relative flex flex-1 flex-col overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800"
          onMouseMove={handleTrackAreaMouseMove}
          onMouseLeave={() => setGuideMs(null)}
          onClick={handleTrackAreaClick}
        >
          {/* Inner width driver — forces scrollWidth of the overflow-x-auto container */}
          <div className="relative" style={{ minWidth: `calc(11rem + ${timelineWidthPx}px)` }}>
            <TimeRuler
              totalMs={maxTrackDurationMs}
              timelineWidthPx={timelineWidthPx}
              pxPerSec={pxPerSec}
            />

            {/* Global playhead line — spans all tracks, aligned with TimeRuler */}
            {maxTrackDurationMs > 0 &&
              (playerState !== "idle" || seekPositionMs > 0 || playheadMs > 0) && (
                <div
                  className="pointer-events-none absolute top-7 bottom-0 z-20 w-[2px] bg-white/90 shadow-[0_0_4px_rgba(255,255,255,0.35)]"
                  style={{
                    left: `${176 + ((playerState !== "idle" ? playheadMs : seekPositionMs) / maxTrackDurationMs) * timelineWidthPx}px`,
                  }}
                />
              )}

            {/* Hover guide line */}
            {guideMs !== null && maxTrackDurationMs > 0 && (
              <div
                className="pointer-events-none absolute top-7 bottom-0 z-19 w-px bg-indigo-400/60"
                style={{ left: `${176 + (guideMs / maxTrackDurationMs) * timelineWidthPx}px` }}
              />
            )}

            <div className="flex cursor-crosshair flex-col gap-3 py-3">
              {tracks.map((trackCode, idx) => (
                <TrackLane
                  key={idx}
                  index={idx}
                  code={trackCode}
                  totalMs={maxTrackDurationMs}
                  timelineWidthPx={timelineWidthPx}
                  playheadMs={playerState !== "idle" ? playheadMs : seekPositionMs}
                  isFocused={focusedTrackIndex === idx}
                  isExpanded={expandedTracks.has(idx)}
                  canRemove={tracks.length > 1}
                  onFocus={() => setFocusedTrackIndex(idx)}
                  onToggleExpand={() => toggleTrackExpanded(idx)}
                  onChange={(val) => handleTrackCodeChange(idx, val)}
                  onRemove={() => setConfirmRemoveIndex(idx)}
                  editorRef={(handle) => {
                    trackEditorRefs.current[idx] = handle;
                  }}
                />
              ))}

              {tracks.length < MAX_TRACKS && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTrack();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-200 py-2 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                >
                  <FaPlus size={10} />
                  {t("editor.addTrack", { defaultValue: "Add Track" })}
                </button>
              )}
            </div>
          </div>
          {/* end inner width driver */}
        </div>

        {/* Right: Properties */}
        <PropertiesPanel
          name={name}
          nameInputRef={nameInputRef}
          tracks={tracks}
          onNameChange={setName}
          category={category}
          onCategoryChange={setCategory}
          errors={errors}
          onDiscard={handleDiscard}
          onSubmit={handleSubmit}
        />
      </div>

      <StatusBar hasDraft={hasDraft} />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={handleImportConfirm}
      />

      <ConfirmDialog
        isOpen={confirmRemoveIndex !== null}
        title={t("editor.removeTrack", { defaultValue: "Remove Track" })}
        message={t("editor.removeTrackConfirm", {
          defaultValue: `Are you sure you want to remove Track ${(confirmRemoveIndex ?? 0) + 1}?`,
          index: (confirmRemoveIndex ?? 0) + 1,
        })}
        confirmLabel={t("editor.removeTrack", { defaultValue: "Remove" })}
        variant="danger"
        onConfirm={() => {
          if (confirmRemoveIndex !== null) handleRemoveTrack(confirmRemoveIndex);
          setConfirmRemoveIndex(null);
        }}
        onCancel={() => setConfirmRemoveIndex(null)}
      />
    </div>
  );
}
