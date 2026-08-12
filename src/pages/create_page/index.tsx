import { useEffect } from "react";

import { usePlayerStore } from "../../stores/player_store";
import { saveDraft } from "./draft";
import { useTrackManager } from "./hooks/use_track_manager";
import { usePlaybackLoop } from "./hooks/use_playback_loop";
import { useTimelineInteraction } from "./hooks/use_timeline_interaction";
import { useHotkeys } from "react-hotkeys-hook";
import { platformShortcut } from "./utils/keyboard_utils";
import { useCreatePageActions } from "./hooks/use_create_page_actions";
import { useCreatePageDerived } from "./hooks/use_create_page_derived";
import { useCreatePageUiState } from "./hooks/use_create_page_ui_state";
import { CreatePageView } from "./create_page_view";

export function CreatePage() {
  const trackMuted = usePlayerStore((s) => s.trackMuted);
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);
  const resetMutedTracks = usePlayerStore((s) => s.resetMutedTracks);
  const playerState = usePlayerStore((s) => s.playerState);
  const stop = usePlayerStore((s) => s.stop);

  /* ── UI state + refs ── */
  const {
    editId,
    editItem,
    draft,
    userItemTitles,
    importOpen,
    setImportOpen,
    favImportOpen,
    setFavImportOpen,
    helpOpen,
    setHelpOpen,
    createSummaryOpen,
    setCreateSummaryOpen,
    pendingImport,
    setPendingImport,
    pendingAction,
    setPendingAction,
    cutDialogMode,
    setCutDialogMode,
    confirmRemoveIndex,
    setConfirmRemoveIndex,
    errors,
    setErrors,
    name,
    setName,
    categories,
    setCategories,
    playheadMs,
    setPlayheadMs,
    loopInMs,
    setLoopInMs,
    loopOutMs,
    setLoopOutMs,
    trackListRef,
    nameInputRef,
    trackRowsRef,
    lastPlayedTracksRef,
  } = useCreatePageUiState();
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
  } = useTrackManager({
    initialTracks: editItem?.tracks ?? draft?.tracks ?? [],
  });

  /* ── Derived values + DnD ── */
  const {
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
  } = useCreatePageDerived({
    tracks,
    deactivatedTracks,
    trackMuted,
    focusedTrackIndex,
    name,
    loopInMs,
    loopOutMs,
    handleReorderTracks,
  });

  /* ── Timeline interaction ── */
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

  /* ── Actions hook ── */
  const {
    handleStop,
    handleMuteAll,
    handleUnmuteAll,
    handleSetLoopIn,
    handleSetLoopOut,
    handleClearLoop,
    handleTrimRegion,
    handleDeleteRegion,
    handleCutConfirm,
    handleCutCancel,
    handlePlayToggle,
    handleSubmit,
    handleConfirmCreate,
    handleNew,
    handleDiscard,
    handleImportClick,
    handleImportConfirm,
    handleConfirmRemove,
    handlePendingActionConfirm,
  } = useCreatePageActions({
    editId,
    name,
    tracks,
    categories,
    loopInMs,
    loopOutMs,
    playheadMs,
    seekPositionMs,
    deactivatedTracks,
    trackMuted,
    hasUnsavedData,
    userItemTitles: userItemTitles,
    lastPlayedTracksRef,
    setName,
    setCategories,
    setErrors,
    setPlayheadMs,
    setSeekPositionMs,
    setLoopInMs,
    setLoopOutMs,
    setImportOpen,
    setPendingImport,
    setPendingAction,
    setCutDialogMode,
    setCreateSummaryOpen,
    setConfirmRemoveIndex,
    commitTracks,
    resetTracks,
    resetMutedTracks,
    toggleMuteTrack,
    handleAddTrack,
    handleRemoveTrack,
    trackListRef,
  });

  /* ── Effects ── */
  useEffect(
    function scrollIntoViewWhenFocusedTrackChange() {
      const el = trackRowsRef.current[focusedTrackIndex];
      if (el && trackListRef.current) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
    [focusedTrackIndex],
  );

  useEffect(
    function saveDraftOnChange() {
      saveDraft({ name, code: tracks[0] ?? "", categories, tracks });
    },
    [name, categories, tracks],
  );

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

  // Keyboard Shortcuts using react-hotkeys-hook
  // Undo / Redo - standard shortcuts with preventDefault
  useHotkeys(
    platformShortcut("z"),
    (e) => {
      e.preventDefault();
      undo();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("shift+z"),
    (e) => {
      e.preventDefault();
      redo();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("y"),
    (e) => {
      e.preventDefault();
      redo();
    },
    { preventDefault: true },
  );

  // Transport - only active when not in text input
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      handlePlayToggle();
    },
    { enableOnFormTags: false, preventDefault: true },
  );
  useHotkeys(
    "i",
    (e) => {
      e.preventDefault();
      handleSetLoopIn();
    },
    { enableOnFormTags: false, preventDefault: true },
  );
  useHotkeys(
    "o",
    (e) => {
      e.preventDefault();
      handleSetLoopOut();
    },
    { enableOnFormTags: false, preventDefault: true },
  );

  // File - using Option/Alt to completely avoid Chrome conflicts
  useHotkeys(
    platformShortcut("alt+n"),
    (e) => {
      e.preventDefault();
      handleNew();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("i"),
    (e) => {
      e.preventDefault();
      handleImportClick();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("s"),
    (e) => {
      e.preventDefault();
      handleSubmit();
    },
    { preventDefault: true },
  );

  // Edit - using = (plus key) instead of T to avoid Chrome "new tab" conflict
  useHotkeys(
    platformShortcut("="),
    (e) => {
      e.preventDefault();
      handleAddTrack();
    },
    { preventDefault: true },
  );
  useHotkeys(
    "delete",
    (e) => {
      if (canCutRegion) {
        e.preventDefault();
        handleDeleteRegion();
      }
    },
    { enableOnFormTags: false },
  );
  useHotkeys(
    "backspace",
    (e) => {
      if (canCutRegion) {
        e.preventDefault();
        handleDeleteRegion();
      }
    },
    { enableOnFormTags: false },
  );

  const ui = {
    editId,
    importOpen,
    setImportOpen,
    favImportOpen,
    setFavImportOpen,
    helpOpen,
    setHelpOpen,
    createSummaryOpen,
    setCreateSummaryOpen,
    pendingAction,
    setPendingAction,
    cutDialogMode,
    confirmRemoveIndex,
    setConfirmRemoveIndex,
    errors,
    name,
    setName,
    categories,
    setCategories,
    playheadMs,
    loopInMs,
    setLoopInMs,
    loopOutMs,
    setLoopOutMs,
    nameInputRef,
    trackListRef,
    trackRowsRef,
  };
  const track = {
    tracks,
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
    handleDuplicateTrack,
    toggleDeactivateTrack,
    handleRemoveEmptyTracks,
    toggleTrackExpanded,
    collapseAllTracks,
    expandAllTracks,
    handleRenameTrack,
    handleToolbarInsert,
    trackColors,
    setTrackColor,
  };
  const derived = {
    maxTrackDurationMs,
    trackIds,
    dndSensors,
    handleDragEnd,
    hasDraft,
    hasPlayableContent,
    hasEmptyTracks,
    allTracksMuted,
    anyTrackMuted,
    canCutRegion,
    focusedTrackName,
  };
  const timeline = {
    guideMs,
    setGuideMs,
    seekPositionMs,
    pxPerSec,
    timelineWidthPx,
    handleTrackAreaMouseMove,
    handleTrackAreaClick,
  };
  const actions = {
    handleStop,
    handleMuteAll,
    handleUnmuteAll,
    handleSetLoopIn,
    handleSetLoopOut,
    handleClearLoop,
    handleTrimRegion,
    handleDeleteRegion,
    handleCutConfirm,
    handleCutCancel,
    handlePlayToggle,
    handleSubmit,
    handleConfirmCreate,
    handleNew,
    handleDiscard,
    handleImportClick,
    handleImportConfirm,
    handleConfirmRemove,
    handlePendingActionConfirm,
  };

  return (
    <CreatePageView
      ui={ui}
      track={track}
      derived={derived}
      timeline={timeline}
      actions={actions}
      trackMuted={trackMuted}
      playerState={playerState}
    />
  );
}
