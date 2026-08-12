import { useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useCollectionStore } from "../../../stores/collection_store";
import { loadDraft } from "../draft";
import type { CutMode } from "../cut_dialog";
import type { RtttlCategory } from "../../../utils/rtttl_parser";

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

export function useCreatePageUiState() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const userItems = useCollectionStore((s) => s.userItems);
  const editItem = useMemo(() => {
    if (!editId) {
      return null;
    }
    return userItems.find((item) => item.id === editId) ?? null;
  }, [editId, userItems]);

  const _draft = loadDraft();

  const [importOpen, setImportOpen] = useState(false);
  const [favImportOpen, setFavImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [createSummaryOpen, setCreateSummaryOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<string[] | null>(null);
  const [pendingAction, setPendingAction] = useState<"new" | "discard" | null>(null);
  const [cutDialogMode, setCutDialogMode] = useState<CutMode | null>(null);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [name, setName] = useState(() => {
    if (editItem) {
      return editItem.title;
    }
    return _draft?.name || nextProjectName(userItems.map((u) => u.title));
  });
  const [categories, setCategories] = useState<RtttlCategory[]>(() => {
    if (editItem?.categories) {
      return editItem.categories;
    }
    return _draft?.categories ?? [];
  });
  const [playheadMs, setPlayheadMs] = useState(0);
  const [loopInMs, setLoopInMs] = useState<number | null>(null);
  const [loopOutMs, setLoopOutMs] = useState<number | null>(null);

  const trackListRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const trackRowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastPlayedTracksRef = useRef<{ tracks: string[]; deactivated: Set<number> }>({
    tracks: [],
    deactivated: new Set(),
  });

  const draft = _draft;
  const userItemTitles = userItems.map((u) => u.title);

  return {
    editId,
    editItem,
    draft,
    userItemTitles,
    /* dialog toggles */
    importOpen,
    setImportOpen,
    favImportOpen,
    setFavImportOpen,
    helpOpen,
    setHelpOpen,
    createSummaryOpen,
    setCreateSummaryOpen,
    /* pending state */
    pendingImport,
    setPendingImport,
    pendingAction,
    setPendingAction,
    cutDialogMode,
    setCutDialogMode,
    confirmRemoveIndex,
    setConfirmRemoveIndex,
    /* form */
    errors,
    setErrors,
    name,
    setName,
    categories,
    setCategories,
    /* timeline */
    playheadMs,
    setPlayheadMs,
    loopInMs,
    setLoopInMs,
    loopOutMs,
    setLoopOutMs,
    /* refs */
    trackListRef,
    nameInputRef,
    trackRowsRef,
    lastPlayedTracksRef,
  };
}
