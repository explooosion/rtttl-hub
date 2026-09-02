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
  seekPositionMs: number;
  deactivatedTracks: Set<number>;
  trackMuted: boolean[];
  hasUnsavedData: boolean;
  userItemTitles: string[];
  lastPlayedTracksRef: React.MutableRefObject<{ tracks: string[]; deactivated: Set<number> }>;
  setName: (v: string) => void;
  setCategories: (v: RtttlCategory[]) => void;
  setErrors: (v: string[]) => void;
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
  resetMutedTracks: VoidFunction;
  toggleMuteTrack: (i: number) => void;
  handleAddTrack: VoidFunction;
  handleRemoveTrack: (i: number) => void;
  trackListRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseCreatePageActionsResult {
  handleStop: VoidFunction;
  handleMuteAll: VoidFunction;
  handleUnmuteAll: VoidFunction;
  handleSetLoopIn: VoidFunction;
  handleSetLoopOut: VoidFunction;
  handleClearLoop: VoidFunction;
  handleTrimRegion: VoidFunction;
  handleDeleteRegion: VoidFunction;
  handleCutConfirm: (selectedIndices: number[], mode: CutMode | null) => void;
  handleCutCancel: VoidFunction;
  handlePlayToggle: VoidFunction;
  handleSubmit: VoidFunction;
  handleConfirmCreate: VoidFunction;
  handleNew: VoidFunction;
  handleDiscard: VoidFunction;
  handleImportClick: VoidFunction;
  handleImportConfirm: (parsed: string[], fileName?: string) => void;
  handleConfirmRemove: (index: number | null) => void;
  handlePendingActionConfirm: (action: "new" | "discard" | null) => void;
  _doNew: VoidFunction;
  _doDiscard: VoidFunction;
}
