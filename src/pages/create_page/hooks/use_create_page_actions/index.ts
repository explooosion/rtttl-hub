import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../../../stores/auth_store";
import { useCollectionStore } from "../../../../stores/collection_store";
import { usePlayerStore } from "../../../../stores/player_store";
import { useEditingActions } from "./editing_actions";
import { usePlaybackActions } from "./playback_actions";
import { useProjectActions } from "./project_actions";
import type { UseCreatePageActionsParams, UseCreatePageActionsResult } from "./types";

export function useCreatePageActions({
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
  userItemTitles,
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
  handleRemoveTrack,
  trackListRef,
}: UseCreatePageActionsParams): UseCreatePageActionsResult {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const updateUserItem = useCollectionStore((s) => s.updateUserItem);

  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playCode = usePlayerStore((s) => s.playCode);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const playerState = usePlayerStore((s) => s.playerState);

  const { handleStop, handlePlayToggle } = usePlaybackActions({
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
  });

  const {
    handleMuteAll,
    handleUnmuteAll,
    handleSetLoopIn,
    handleSetLoopOut,
    handleClearLoop,
    handleTrimRegion,
    handleDeleteRegion,
    handleCutConfirm,
    handleCutCancel,
  } = useEditingActions({
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
  });

  const {
    handleSubmit,
    handleConfirmCreate,
    handleNew,
    handleDiscard,
    handleImportClick,
    handleImportConfirm,
    handleConfirmRemove,
    handlePendingActionConfirm,
    _doNew,
    _doDiscard,
  } = useProjectActions({
    editId,
    name,
    tracks,
    categories,
    isPublic,
    hasUnsavedData,
    userItemTitles,
    user,
    addUserItem,
    updateUserItem,
    setCurrentItem,
    setName,
    setCategories,
    setErrors,
    setSeekPositionMs,
    setLoopInMs,
    setLoopOutMs,
    setImportOpen,
    setPendingImport,
    setPendingAction,
    setCreateSummaryOpen,
    setConfirmRemoveIndex,
    resetTracks,
    resetMutedTracks,
    handleRemoveTrack,
    stop,
    navigate,
    t,
  });

  return {
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
    _doNew,
    _doDiscard,
  };
}
