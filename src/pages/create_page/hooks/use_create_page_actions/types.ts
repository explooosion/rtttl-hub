import type { CutMode } from "../../cut_dialog";
import type { RtttlCategory } from "../../../../utils/rtttl_parser";

export interface UseCreatePageActionsParams {
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

export interface UseCreatePageActionsResult {
  handleStop: () => void;
  handleMuteAll: () => void;
  handleUnmuteAll: () => void;
  handleSetLoopIn: () => void;
  handleSetLoopOut: () => void;
  handleClearLoop: () => void;
  handleTrimRegion: () => void;
  handleDeleteRegion: () => void;
  handleCutConfirm: (selectedIndices: number[], mode: CutMode | null) => void;
  handleCutCancel: () => void;
  handlePlayToggle: () => void;
  handleSubmit: () => void;
  handleConfirmCreate: () => void;
  handleNew: () => void;
  handleDiscard: () => void;
  handleImportClick: () => void;
  handleImportConfirm: (parsed: string[]) => void;
  handleConfirmRemove: (index: number | null) => void;
  handlePendingActionConfirm: (action: "new" | "discard" | null) => void;
  _doNew: () => void;
  _doDiscard: () => void;
}
