import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { useCollectionStore } from "../../../stores/collection_store";
import { usePlayerStore } from "../../../stores/player_store";
import { useAuthStore } from "../../../stores/auth_store";
import { parseRtttl } from "../../../utils/rtttl_parser";
import { clearDraft } from "../draft";
import { MAX_TRACKS } from "../constants";
import { trimRtttl, deleteRegionRtttl } from "../utils/rtttl_cutter";
import { nextProjectName } from "../utils/toolbar_utils";
import type { CutMode } from "../cut_dialog";
import type { RtttlCategory } from "../../../utils/rtttl_parser";

interface UseCreatePageActionsParams {
  editId: string | null;
  name: string;
  tracks: string[];
  categories: RtttlCategory[];
  isPublic: boolean;
  loopInMs: number | null;
  loopOutMs: number | null;
  playheadMs: number;
  seekPositionMs: number;
  deactivatedTracks: Set<number>;
  trackMuted: boolean[];
  hasUnsavedData: boolean;
  userItemTitles: string[];
  lastPlayedTracksRef: React.MutableRefObject<{ tracks: string[]; deactivated: Set<number> }>;
  setName: (v: string) => void;
  setCategories: (v: RtttlCategory[]) => void;
  setErrors: (v: string[]) => void;
  setPlayheadMs: (v: number) => void;
  setSeekPositionMs: (v: number) => void;
  setLoopInMs: (v: number | null) => void;
  setLoopOutMs: (v: number | null) => void;
  setImportOpen: (v: boolean) => void;
  setPendingImport: (v: string[] | null) => void;
  setPendingAction: (v: "new" | "discard" | null) => void;
  setCutDialogMode: (v: CutMode | null) => void;
  setCreateSummaryOpen: (v: boolean) => void;
  setConfirmRemoveIndex: (v: number | null) => void;
  commitTracks: (v: string[]) => void;
  resetTracks: (v?: string[]) => void;
  resetMutedTracks: () => void;
  toggleMuteTrack: (i: number) => void;
  handleAddTrack: () => void;
  handleRemoveTrack: (i: number) => void;
  trackListRef: React.RefObject<HTMLDivElement | null>;
}

export function useCreatePageActions({
  editId,
  name,
  tracks,
  categories,
  isPublic,
  loopInMs,
  loopOutMs,
  playheadMs,
  seekPositionMs,
  deactivatedTracks,
  trackMuted,
  hasUnsavedData,
  userItemTitles,
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
  handleRemoveTrack,
  trackListRef,
}: UseCreatePageActionsParams) {
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

  /* ── Stop ── */
  const handleStop = useCallback(() => {
    stop();
    setSeekPositionMs(0);
    setPlayheadMs(0);
    if (trackListRef.current) {
      trackListRef.current.scrollLeft = 0;
    }
  }, [stop, setSeekPositionMs, setPlayheadMs, trackListRef]);

  /* ── Mute ── */
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

  /* ── A-B markers ── */
  const handleSetLoopIn = useCallback(() => {
    setLoopInMs(playerState !== "idle" ? playheadMs : seekPositionMs);
  }, [playerState, playheadMs, seekPositionMs, setLoopInMs]);

  const handleSetLoopOut = useCallback(() => {
    setLoopOutMs(playerState !== "idle" ? playheadMs : seekPositionMs);
  }, [playerState, playheadMs, seekPositionMs, setLoopOutMs]);

  const handleClearLoop = useCallback(() => {
    setLoopInMs(null);
    setLoopOutMs(null);
  }, [setLoopInMs, setLoopOutMs]);

  /* ── Cut ── */
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

  const handleCutCancel = useCallback(() => setCutDialogMode(null), [setCutDialogMode]);

  /* ── Playback ── */
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
      playerState === "paused" ? playheadMs : seekPositionMs > 0 ? seekPositionMs : undefined;
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
    playheadMs,
    seekPositionMs,
    pause,
    resume,
    playTracks,
    playCode,
    lastPlayedTracksRef,
    setSeekPositionMs,
  ]);

  /* ── Submit / Confirm create ── */
  const handleSubmit = useCallback(() => {
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
  }, [name, tracks, t, setErrors, setCreateSummaryOpen]);

  const handleConfirmCreate = useCallback(() => {
    const primaryCode = tracks[0] ?? "";
    const firstLetter = name.charAt(0).toUpperCase();
    const nonEmptyTracks = tracks.filter((tk) => tk.trim().length > 0);

    // Get existing item's createdAt when editing
    const userItems = useCollectionStore.getState().userItems;
    const existingItem = editId ? userItems.find((item) => item.id === editId) : null;

    const newItem = {
      id: editId || `user-${crypto.randomUUID()}`,
      artist: "", // Empty for user creations - display name fetched via userId
      title: name.trim(),
      firstLetter: /[A-Z]/.test(firstLetter)
        ? firstLetter
        : /[0-9]/.test(firstLetter)
          ? "0-9"
          : "#",
      code: primaryCode.trim(),
      collection: "my-creations" as const,
      categories: categories.length > 0 ? categories : undefined,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: user ? isPublic : false,
      userId: user?.uid,
      ...(nonEmptyTracks.length > 1 ? { tracks: nonEmptyTracks } : {}),
    };

    if (editId) {
      updateUserItem(editId, newItem, user?.uid);
      toast.success(t("create.updated", { name: name.trim() }));
    } else {
      addUserItem(newItem, user?.uid);
      toast.success(t("create.created", { name: name.trim() }));
    }

    setCurrentItem(newItem);
    clearDraft();
    stop();
    navigate("/collections/my-creations");
  }, [
    editId,
    name,
    tracks,
    categories,
    isPublic,
    user,
    addUserItem,
    updateUserItem,
    setCurrentItem,
    stop,
    navigate,
    t,
  ]);

  /* ── New project ── */
  const _doNew = useCallback(() => {
    stop();
    clearDraft();
    setName(nextProjectName(userItemTitles));
    setCategories([]);
    setErrors([]);
    setSeekPositionMs(0);
    setPlayheadMs(0);
    setLoopInMs(null);
    setLoopOutMs(null);
    resetMutedTracks();
    resetTracks();
  }, [
    stop,
    resetMutedTracks,
    resetTracks,
    userItemTitles,
    setName,
    setCategories,
    setErrors,
    setSeekPositionMs,
    setPlayheadMs,
    setLoopInMs,
    setLoopOutMs,
  ]);

  const handleNew = useCallback(() => {
    if (hasUnsavedData) {
      setPendingAction("new");
    } else {
      _doNew();
    }
  }, [hasUnsavedData, _doNew, setPendingAction]);

  /* ── Discard ── */
  const _doDiscard = useCallback(() => {
    stop();
    clearDraft();
    navigate(-1);
  }, [stop, navigate]);

  const handleDiscard = useCallback(() => {
    if (hasUnsavedData) {
      setPendingAction("discard");
    } else {
      _doDiscard();
    }
  }, [hasUnsavedData, _doDiscard, setPendingAction]);

  /* ── Import ── */
  const handleImportClick = useCallback(() => setImportOpen(true), [setImportOpen]);

  const handleImportConfirm = useCallback(
    (parsed: string[]) => {
      const firstName = parsed[0]?.split(":")[0]?.trim();
      if (firstName) {
        setName(firstName);
      }
      setPendingImport(parsed.slice(0, MAX_TRACKS));
      setImportOpen(false);
    },
    [setName, setPendingImport, setImportOpen],
  );

  /* ── Remove track confirm ── */
  const handleConfirmRemove = useCallback(
    (index: number | null) => {
      if (index !== null) {
        handleRemoveTrack(index);
      }
      setConfirmRemoveIndex(null);
    },
    [handleRemoveTrack, setConfirmRemoveIndex],
  );

  const handlePendingActionConfirm = useCallback(
    (action: "new" | "discard" | null) => {
      setPendingAction(null);
      if (action === "new") {
        _doNew();
      } else {
        _doDiscard();
      }
    },
    [_doNew, _doDiscard, setPendingAction],
  );

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
