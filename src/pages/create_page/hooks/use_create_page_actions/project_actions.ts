import { useCallback } from "react";
import toast from "react-hot-toast";

import { clearDraft } from "../../draft";
import { MAX_TRACKS } from "../../constants";
import { nextProjectName } from "../../utils/toolbar_utils";
import { parseRtttl } from "../../../../utils/rtttl_parser";
import { useCollectionStore } from "../../../../stores/collection_store";
import type { NavigateFunction } from "react-router-dom";
import type { TFunction } from "i18next";
import type { RtttlCategory, RtttlEntry } from "../../../../utils/rtttl_parser";

interface UseProjectActionsParams {
  editId: string | null;
  name: string;
  tracks: string[];
  categories: RtttlCategory[];
  isPublic: boolean;
  hasUnsavedData: boolean;
  userItemTitles: string[];
  user: { uid: string } | null;
  addUserItem: (item: RtttlEntry, userId?: string) => void;
  updateUserItem: (id: string, item: RtttlEntry, userId?: string) => void;
  setCurrentItem: (item: RtttlEntry) => void;
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
  setCreateSummaryOpen: (v: boolean) => void;
  setConfirmRemoveIndex: (v: number | null) => void;
  resetTracks: (v?: string[]) => void;
  resetMutedTracks: VoidFunction;
  handleRemoveTrack: (i: number) => void;
  stop: VoidFunction;
  navigate: NavigateFunction;
  t: TFunction;
}

export function useProjectActions({
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
  setPlayheadMs,
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
}: UseProjectActionsParams) {
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

    const userItems = useCollectionStore.getState().userItems;
    const existingItem = editId ? userItems.find((item) => item.id === editId) : null;

    const newItem = {
      id: editId || `user-${crypto.randomUUID()}`,
      artist: "",
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

  const handleImportClick = useCallback(() => {
    setImportOpen(true);
  }, [setImportOpen]);

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
