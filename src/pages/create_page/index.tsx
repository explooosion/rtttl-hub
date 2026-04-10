import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { FaPlus, FaDesktop } from "react-icons/fa";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useCollectionStore } from "../../stores/collection_store";
import { usePlayerStore } from "../../stores/player_store";
import { parseRtttl, getTotalDuration } from "../../utils/rtttl_parser";
import type { RtttlCategory } from "../../utils/rtttl_parser";
import { ConfirmDialog } from "../../components/confirm_dialog";
import { DawHeader } from "./daw_header";
import { TransportToolbar } from "./transport_toolbar";
import { TrackLane } from "./track_lane";
import { PropertiesPanel } from "./properties_panel";
import { StatusBar } from "./status_bar";
import { ImportDialog } from "./import_dialog";
import { FavoriteImportDialog } from "./favorite_import_dialog";
import { CutDialog } from "./cut_dialog";
import { HelpDialog } from "./transport_toolbar/help_dialog";
import { CreateSummaryModal } from "./create_summary_modal";
import type { CutMode } from "./cut_dialog";
import { loadDraft, saveDraft, clearDraft } from "./draft";
import { MAX_TRACKS } from "./constants";
import { TimeRuler } from "./time_ruler";
import { useTrackManager } from "./hooks/use_track_manager";
import { usePlaybackLoop } from "./hooks/use_playback_loop";
import { useTimelineInteraction } from "./hooks/use_timeline_interaction";
import { useKeyboardShortcuts } from "./hooks/use_keyboard_shortcuts";
import { trimRtttl, deleteRegionRtttl } from "./utils/rtttl_cutter";

function nextProjectName(existingTitles: string[]): string {
  const lower = existingTitles.map((s) => s.toLowerCase());
  const base = "untitled project";
  if (!lower.includes(base)) {
    return "Untitled Project";
  }
  let n = 2;
  while (lower.includes(`${base} ${n}`)) {
    n++;
  }
  return `Untitled Project ${n}`;
}

export function CreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const userItems = useCollectionStore((s) => s.userItems);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playCode = usePlayerStore((s) => s.playCode);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const trackMuted = usePlayerStore((s) => s.trackMuted);
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);
  const resetMutedTracks = usePlayerStore((s) => s.resetMutedTracks);
  const playerState = usePlayerStore((s) => s.playerState);

  /* ── Local state ── */
  const [importOpen, setImportOpen] = useState(false);
  const [favImportOpen, setFavImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<string[] | null>(null);
  const [pendingAction, setPendingAction] = useState<"new" | "discard" | null>(null);
  const _draft = loadDraft();
  const [name, setName] = useState(
    () => _draft?.name || nextProjectName(userItems.map((u) => u.title)),
  );
  const [categories, setCategories] = useState<RtttlCategory[]>(() => _draft?.categories ?? []);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const trackListRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const trackRowsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Track manager hook ── */
  const {
    tracks,
    setTracks: commitTracks,
    focusedTrackIndex,
    setFocusedTrackIndex,
    expandedTracks,
    deactivatedTracks,
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
    trackColors,
    setTrackColor,
  } = useTrackManager({ initialTracks: _draft?.tracks ?? [] });

  /* ── Derived values ── */
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

  const [playheadMs, setPlayheadMs] = useState(0);
  const [loopInMs, setLoopInMs] = useState<number | null>(null);
  const [loopOutMs, setLoopOutMs] = useState<number | null>(null);
  const [cutDialogMode, setCutDialogMode] = useState<CutMode | null>(null);

  /** Snapshot of tracks + deactivated set at the last playTracks/playCode call.
   *  Used to detect whether tracks were edited or deactivated while paused,
   *  so we reload audio instead of resuming stale engine data. */
  const lastPlayedTracksRef = useRef<{ tracks: string[]; deactivated: Set<number> }>({
    tracks: [],
    deactivated: new Set(),
  });

  const {
    guideMs,
    setGuideMs,
    seekPositionMs,
    setSeekPositionMs,
    pxPerSec,
    timelineWidthPx,
    handleTrackAreaMouseMove,
    handleTrackAreaClick,
  } = useTimelineInteraction({ trackListRef, maxTrackDurationMs, setPlayheadMs });

  usePlaybackLoop({
    trackListRef,
    maxTrackDurationMs,
    timelineWidthPx,
    pxPerSec,
    seekPositionMs,
    playheadMs,
    setPlayheadMs,
    loopInMs,
    loopOutMs,
  });

  const hasDraft = name.trim().length > 0 || tracks.some((tk) => tk.trim().length > 0);
  const hasPlayableContent = tracks.some((tk) => tk.trim().length > 0);
  const hasUnsavedData = tracks.some((tk) => tk.trim().length > 0);
  const hasEmptyTracks = tracks.some((tk) => {
    const colon = tk.indexOf(":");
    const body = colon >= 0 ? tk.slice(colon + 1).trim() : tk.trim();
    return body.length === 0;
  });
  const allTracksMuted = tracks.length > 0 && tracks.every((_, i) => trackMuted[i] ?? false);
  const anyTrackMuted = tracks.some((_, i) => trackMuted[i] ?? false);

  const focusedTrackName = useMemo(() => {
    const code = tracks[focusedTrackIndex] ?? "";
    if (!code.trim()) {
      return `Track ${focusedTrackIndex + 1}`;
    }
    const colonIdx = code.indexOf(":");
    if (colonIdx > 0) {
      return code.slice(0, colonIdx).trim() || `Track ${focusedTrackIndex + 1}`;
    }
    return `Track ${focusedTrackIndex + 1}`;
  }, [tracks, focusedTrackIndex]);

  /* ── Drag-and-drop (track reorder) ── */
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

  /* ── Scroll focused track into view ── */
  useEffect(
    function scrollIntoViewWhenFocusedTrackChange() {
      const el = trackRowsRef.current[focusedTrackIndex];
      if (el && trackListRef.current) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
    [focusedTrackIndex],
  );

  /* ── Draft persistence ── */
  useEffect(
    function saveDraftOnChange() {
      saveDraft({ name, code: tracks[0] ?? "", categories, tracks });
    },
    [name, categories, tracks],
  );

  /* ── Apply pending import after dialog has closed ── */
  useEffect(
    function applyImportWhenPendingChange() {
      if (!pendingImport) {
        return;
      }
      stop();
      setSeekPositionMs(0);
      setPlayheadMs(0);
      setLoopInMs(null);
      setLoopOutMs(null);
      resetMutedTracks();
      resetTracks(pendingImport);
      setPendingImport(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingImport],
  );

  /* ── New project ── */
  const _doNew = useCallback(() => {
    stop();
    clearDraft();
    setName(nextProjectName(userItems.map((u) => u.title)));
    setCategories([]);
    setErrors([]);
    setSeekPositionMs(0);
    setPlayheadMs(0);
    setLoopInMs(null);
    setLoopOutMs(null);
    resetMutedTracks();
    resetTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, resetMutedTracks, resetTracks, userItems]);

  function handleNew() {
    if (hasUnsavedData) {
      setPendingAction("new");
    } else {
      _doNew();
    }
  }

  /* ── Stop (resets playhead + scrolls to start) ── */
  function handleStop() {
    stop();
    setSeekPositionMs(0);
    setPlayheadMs(0);
    if (trackListRef.current) {
      trackListRef.current.scrollLeft = 0;
    }
  }

  /* ── Mute All / Unmute All ── */
  function handleMuteAll() {
    for (let i = 0; i < tracks.length; i++) {
      if (!(trackMuted[i] ?? false)) {
        toggleMuteTrack(i);
      }
    }
  }

  function handleUnmuteAll() {
    for (let i = 0; i < tracks.length; i++) {
      if (trackMuted[i] ?? false) {
        toggleMuteTrack(i);
      }
    }
  }

  /* ── A-B loop markers ── */
  function handleSetLoopIn() {
    const pos = playerState !== "idle" ? playheadMs : seekPositionMs;
    setLoopInMs(pos);
  }

  function handleSetLoopOut() {
    const pos = playerState !== "idle" ? playheadMs : seekPositionMs;
    setLoopOutMs(pos);
  }

  function handleClearLoop() {
    setLoopInMs(null);
    setLoopOutMs(null);
  }

  /* ── Cut (Trim / Delete Region) ── */
  const canCutRegion = loopInMs !== null || loopOutMs !== null;

  function applyCut(mode: CutMode, indices: number[]) {
    const fn = mode === "trim" ? trimRtttl : deleteRegionRtttl;
    const next = tracks.map((code, i) =>
      indices.includes(i) ? fn(code, loopInMs, loopOutMs) : code,
    );
    commitTracks(next);
  }

  function handleTrimRegion() {
    if (tracks.length <= 1) {
      applyCut("trim", [0]);
    } else {
      setCutDialogMode("trim");
    }
  }

  function handleDeleteRegion() {
    if (tracks.length <= 1) {
      applyCut("delete", [0]);
    } else {
      setCutDialogMode("delete");
    }
  }

  function handleCutConfirm(selectedIndices: number[]) {
    if (cutDialogMode !== null) {
      applyCut(cutDialogMode, selectedIndices);
    }
    setCutDialogMode(null);
  }

  function handleCutCancel() {
    setCutDialogMode(null);
  }

  /* ── Playback ── */
  function handlePlayToggle() {
    if (playerState === "playing") {
      pause();
    } else if (
      playerState === "paused" &&
      tracks === lastPlayedTracksRef.current.tracks &&
      deactivatedTracks === lastPlayedTracksRef.current.deactivated
    ) {
      // Tracks and deactivated set unchanged: seamless resume
      resume();
    } else {
      // idle, OR paused with edited tracks/deactivated state: start fresh
      const nonEmpty = tracks.filter((tk, i) => !deactivatedTracks.has(i) && tk.trim().length > 0);
      const startMs =
        playerState === "paused" ? playheadMs : seekPositionMs > 0 ? seekPositionMs : undefined;
      if (nonEmpty.length > 1) {
        playTracks(nonEmpty, startMs);
      } else if (nonEmpty.length === 1) {
        playCode(nonEmpty[0].trim(), startMs);
      }
      lastPlayedTracksRef.current = { tracks, deactivated: deactivatedTracks };
      if (playerState !== "paused") {
        setSeekPositionMs(0);
      }
    }
  }

  /* ── Submit / Discard ── */
  const [createSummaryOpen, setCreateSummaryOpen] = useState(false);

  function handleSubmit() {
    const newErrors: string[] = [];
    if (!name.trim()) {
      newErrors.push(t("create.nameRequired"));
    }
    const primaryCode = tracks[0] ?? "";
    if (!primaryCode.trim() || !parseRtttl(primaryCode.trim())) {
      newErrors.push(t("create.invalidCode"));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors([]);
    setCreateSummaryOpen(true);
  }

  function handleConfirmCreate() {
    const primaryCode = tracks[0] ?? "";
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
      categories: categories.length > 0 ? categories : undefined,
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
    if (hasUnsavedData) {
      setPendingAction("discard");
    } else {
      _doDiscard();
    }
  }

  function _doDiscard() {
    stop();
    clearDraft();
    navigate(-1);
  }

  /* ── Import ── */
  function handleImportClick() {
    setImportOpen(true);
  }
  function handleImportConfirm(parsed: string[]) {
    const firstName = parsed[0].split(":")[0]?.trim();
    if (firstName) {
      setName(firstName);
    }
    setPendingImport(parsed.slice(0, MAX_TRACKS));
    setImportOpen(false);
  }

  /* ── Keyboard shortcuts ── */
  useKeyboardShortcuts([
    { key: "ctrl+z", action: undo, ignoreInInput: false },
    { key: "meta+z", action: undo, ignoreInInput: false },
    { key: "ctrl+shift+z", action: redo, ignoreInInput: false },
    { key: "meta+shift+z", action: redo, ignoreInInput: false },
    { key: "ctrl+y", action: redo, ignoreInInput: false },
    { key: "meta+y", action: redo, ignoreInInput: false },
  ]);

  /* ── Render ── */
  return (
    <>
      {/* Mobile not-supported screen — visible on phones (< sm: 640px) */}
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-8 text-center sm:hidden dark:bg-gray-950">
        <FaDesktop size={64} className="text-indigo-400 dark:text-indigo-500" />
        <div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            {t("create.mobileNotSupported")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("create.mobileNotSupportedDesc")}
          </p>
        </div>
        <Link
          to="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t("create.mobileNotSupportedBack")}
        </Link>
      </div>

      {/* Full DAW — visible on tablet and above (>= sm: 640px) */}
      <div className="hidden h-screen flex-col overflow-hidden bg-gray-200 sm:flex dark:bg-gray-950">
        <DawHeader />
        <TransportToolbar
          hasPlayableContent={hasPlayableContent}
          onPlayToggle={handlePlayToggle}
          onToolbarInsert={handleToolbarInsert}
          onNew={handleNew}
          onImport={handleImportClick}
          onImportFromFavorites={() => setFavImportOpen(true)}
          onNavigateHome={() => navigate("/")}
          onFocusName={() => nameInputRef.current?.focus()}
          onCreate={handleSubmit}
          onDiscard={handleDiscard}
          onStop={handleStop}
          onAddTrack={handleAddTrack}
          onRemoveFocusedTrack={() => setConfirmRemoveIndex(focusedTrackIndex)}
          onToggleMuteFocusedTrack={() => toggleMuteTrack(focusedTrackIndex)}
          onUndo={undo}
          onRedo={redo}
          onMuteAll={handleMuteAll}
          onUnmuteAll={handleUnmuteAll}
          onRemoveEmptyTracks={handleRemoveEmptyTracks}
          onCollapseAll={collapseAllTracks}
          onExpandAll={expandAllTracks}
          onSetLoopIn={handleSetLoopIn}
          onSetLoopOut={handleSetLoopOut}
          onClearLoop={handleClearLoop}
          onLoopInChange={setLoopInMs}
          onLoopOutChange={setLoopOutMs}
          onTrimRegion={handleTrimRegion}
          onDeleteRegion={handleDeleteRegion}
          canCutRegion={canCutRegion}
          canAddTrack={tracks.length < MAX_TRACKS}
          canRemoveTrack={tracks.length > 1}
          focusedTrackIsMuted={trackMuted[focusedTrackIndex] ?? false}
          canUndo={canUndo}
          canRedo={canRedo}
          loopInMs={loopInMs}
          loopOutMs={loopOutMs}
          hasEmptyTracks={hasEmptyTracks}
          allTracksMuted={allTracksMuted}
          anyTrackMuted={anyTrackMuted}
          onHelpOpen={() => setHelpOpen(true)}
          maxTrackDurationMs={maxTrackDurationMs}
          playheadMs={playheadMs}
          seekPositionMs={seekPositionMs}
          guideMs={guideMs}
        />

        {/* Main area: track list (left) + properties panel (right) */}
        <div className="flex flex-1 gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4">
          {/* Track list */}
          <div
            ref={trackListRef}
            className="relative flex flex-1 flex-col overflow-x-auto overflow-y-auto border border-gray-400 bg-gray-300 pb-12 dark:border-gray-800 dark:bg-gray-900"
            onMouseMove={handleTrackAreaMouseMove}
            onMouseLeave={() => setGuideMs(null)}
            onClick={handleTrackAreaClick}
          >
            {/* Inner width driver — forces scrollWidth of the overflow-x-auto container */}
            <div className="relative" style={{ minWidth: `calc(12rem + ${timelineWidthPx}px)` }}>
              <TimeRuler
                totalMs={maxTrackDurationMs}
                timelineWidthPx={timelineWidthPx}
                pxPerSec={pxPerSec}
              />

              {/* Global playhead line — spans all tracks, aligned with TimeRuler.
                Position is driven by --playhead-px CSS var (set by rAF or sync useEffect)
                to avoid React re-render jitter. React-computed fallback covers initial render. */}
              {maxTrackDurationMs > 0 &&
                (playerState !== "idle" || seekPositionMs > 0 || playheadMs > 0) && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-gray-600/80 dark:bg-white/90"
                    style={{
                      left: `var(--playhead-px, ${192 + ((playerState !== "idle" ? playheadMs : seekPositionMs) / maxTrackDurationMs) * timelineWidthPx}px)`,
                    }}
                  />
                )}

              {/* A marker line */}
              {loopInMs !== null && maxTrackDurationMs > 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-[21] w-0.5 bg-indigo-500/70 dark:bg-indigo-400/80"
                  style={{ left: `${192 + (loopInMs / maxTrackDurationMs) * timelineWidthPx}px` }}
                />
              )}

              {/* B marker line */}
              {loopOutMs !== null && maxTrackDurationMs > 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-[21] w-0.5 bg-purple-500/70 dark:bg-purple-400/80"
                  style={{ left: `${192 + (loopOutMs / maxTrackDurationMs) * timelineWidthPx}px` }}
                />
              )}

              {/* Hover guide line */}
              {guideMs !== null && maxTrackDurationMs > 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-indigo-500/60 dark:bg-indigo-400/60"
                  style={{ left: `${192 + (guideMs / maxTrackDurationMs) * timelineWidthPx}px` }}
                />
              )}

              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
                  <div className="flex cursor-crosshair flex-col gap-3 py-3">
                    {tracks.map((trackCode, idx) => (
                      <div
                        key={trackIds[idx]}
                        ref={(el) => {
                          trackRowsRef.current[idx] = el;
                        }}
                      >
                        <TrackLane
                          key={trackIds[idx]}
                          id={trackIds[idx]!}
                          index={idx}
                          code={trackCode}
                          totalMs={maxTrackDurationMs}
                          timelineWidthPx={timelineWidthPx}
                          playheadMs={playerState !== "idle" ? playheadMs : seekPositionMs}
                          isFocused={focusedTrackIndex === idx}
                          isExpanded={expandedTracks.has(idx)}
                          isDeactivated={deactivatedTracks.has(idx)}
                          canRemove={tracks.length > 1}
                          canDuplicate={tracks.length < MAX_TRACKS}
                          trackColor={trackColors[idx] ?? `rgb(99, 102, 241)`}
                          onColorChange={(color) => setTrackColor(idx, color)}
                          onFocus={() => setFocusedTrackIndex(idx)}
                          onToggleExpand={() => toggleTrackExpanded(idx)}
                          onChange={(val) => handleTrackCodeChange(idx, val)}
                          onRemove={() => setConfirmRemoveIndex(idx)}
                          onRename={(newName) => handleRenameTrack(idx, newName)}
                          onDuplicate={() => handleDuplicateTrack(idx)}
                          onDeactivate={() => toggleDeactivateTrack(idx)}
                          editorRef={(handle) => {
                            trackEditorRefs.current[idx] = handle;
                          }}
                        />
                      </div>
                    ))}

                    {tracks.length < MAX_TRACKS && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddTrack();
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                      >
                        <FaPlus size={11} />
                        {t("editor.addTrack", { defaultValue: "Add Track" })}
                      </button>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            {/* end inner width driver */}
          </div>

          {/* Right: Properties */}
          <PropertiesPanel
            name={name}
            nameInputRef={nameInputRef}
            tracks={tracks}
            focusedTrackIndex={focusedTrackIndex}
            onNameChange={setName}
            onRenameTrack={(newName) => handleRenameTrack(focusedTrackIndex, newName)}
            categories={categories}
            onCategoriesChange={setCategories}
            errors={errors}
            onDiscard={handleDiscard}
            onSubmit={handleSubmit}
          />
        </div>

        <StatusBar
          hasDraft={hasDraft}
          focusedTrackIndex={focusedTrackIndex}
          focusedTrackName={focusedTrackName}
          onHelpOpen={() => setHelpOpen(true)}
        />

        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onConfirm={handleImportConfirm}
        />

        <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

        <FavoriteImportDialog
          open={favImportOpen}
          onClose={() => setFavImportOpen(false)}
          onConfirm={handleImportConfirm}
        />

        <ConfirmDialog
          isOpen={confirmRemoveIndex !== null}
          title={t("editor.removeTrack", { defaultValue: "Remove Track" })}
          message={(() => {
            const idx = confirmRemoveIndex ?? 0;
            const code = tracks[idx] ?? "";
            const colonIdx = code.indexOf(":");
            const trackName =
              (colonIdx > 0 ? code.slice(0, colonIdx).trim() : "") || `Track ${idx + 1}`;
            return t("editor.removeTrackConfirm", {
              defaultValue: `Are you sure you want to remove "${trackName}"?`,
              trackName,
            });
          })()}
          confirmLabel={t("editor.removeTrack", { defaultValue: "Remove" })}
          variant="danger"
          onConfirm={() => {
            if (confirmRemoveIndex !== null) {
              handleRemoveTrack(confirmRemoveIndex);
            }
            setConfirmRemoveIndex(null);
          }}
          onCancel={() => setConfirmRemoveIndex(null)}
        />

        {/* Confirm: new project / discard when data exists */}
        <ConfirmDialog
          isOpen={pendingAction !== null}
          title={
            pendingAction === "new"
              ? t("create.menuNew", { defaultValue: "New Project" })
              : t("create.cancel", { defaultValue: "Discard" })
          }
          message={
            pendingAction === "new"
              ? t("create.newProjectConfirm", {
                  defaultValue:
                    "You have unsaved track data. Create a new project and discard current data?",
                })
              : t("create.discardConfirm", { defaultValue: "Discard current edits and exit?" })
          }
          confirmLabel={t("confirm.ok", { defaultValue: "Yes" })}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            if (action === "new") {
              _doNew();
            } else {
              _doDiscard();
            }
          }}
          onCancel={() => setPendingAction(null)}
        />

        {/* Cut dialog — multi-track A-B trim / delete region */}
        <CutDialog
          mode={cutDialogMode ?? "trim"}
          open={cutDialogMode !== null}
          tracks={tracks}
          trackColors={trackColors}
          inMs={loopInMs}
          outMs={loopOutMs}
          onConfirm={handleCutConfirm}
          onCancel={handleCutCancel}
        />

        {/* Create summary modal */}
        <CreateSummaryModal
          isOpen={createSummaryOpen}
          name={name}
          categories={categories}
          tracks={tracks}
          onConfirm={() => {
            setCreateSummaryOpen(false);
            handleConfirmCreate();
          }}
          onCancel={() => setCreateSummaryOpen(false)}
          onNameChange={setName}
          onRenameTrack={(idx, newName) => handleRenameTrack(idx, newName)}
        />
      </div>
    </>
  );
}
