import { useEffect } from "react";

import { usePlayerStore } from "../../stores/player_store";
import { usePlayheadStore } from "../../stores/playhead_store";
import { saveDraft } from "./draft";
import { CreatePageView } from "./create_page_view";
import { useCreatePageActions } from "./hooks/use_create_page_actions";
import { useCreatePageDerived } from "./hooks/use_create_page_derived";
import { useCreatePageHotkeys } from "./hooks/use_create_page_hotkeys";
import { useCreatePageUiState } from "./hooks/use_create_page_ui_state";
import { usePlaybackLoop } from "./hooks/use_playback_loop";
import { useTimelineInteraction } from "./hooks/use_timeline_interaction";
import { useTrackManager } from "./hooks/use_track_manager";

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
    importTrack,
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
    isPublic,
    setIsPublic,
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
    initialTracks:
      importTrack?.tracks ??
      (importTrack?.code ? [importTrack.code] : (editItem?.tracks ?? draft?.tracks ?? [])),
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
  } = useTimelineInteraction({ trackListRef, maxTrackDurationMs });

  usePlaybackLoop({
    trackListRef,
    maxTrackDurationMs,
    timelineWidthPx,
    pxPerSec,
    seekPositionMs,
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
    isPublic,
    loopInMs,
    loopOutMs,
    seekPositionMs,
    deactivatedTracks,
    trackMuted,
    hasUnsavedData,
    userItemTitles: userItemTitles,
    lastPlayedTracksRef,
    setName,
    setCategories,
    setErrors,
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

  useCreatePageHotkeys({
    undo,
    redo,
    handlePlayToggle,
    handleSetLoopIn,
    handleSetLoopOut,
    handleNew,
    handleImportClick,
    handleSubmit,
    handleAddTrack,
    handleDeleteRegion,
    canCutRegion,
  });

  useEffect(
    function scrollIntoViewWhenFocusedTrackChange() {
      const el = trackRowsRef.current[focusedTrackIndex];
      if (el && trackListRef.current) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
    [focusedTrackIndex, trackListRef, trackRowsRef],
  );

  useEffect(
    function saveDraftWhenCreatePageChange() {
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
      usePlayheadStore.getState().setPlayheadMs(0);
      setLoopInMs(null);
      setLoopOutMs(null);
      resetMutedTracks();
      resetTracks(pendingImport);
      setPendingImport(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingImport],
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
    isPublic,
    setIsPublic,
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
