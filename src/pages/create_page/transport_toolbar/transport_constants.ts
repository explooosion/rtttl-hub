export const SYNTAX_ITEMS = [
  "d=",
  "o=",
  "b=",
  ":",
  ",",
  "#",
  ".",
  "p",
  "1",
  "2",
  "4",
  "8",
  "16",
  "32",
];

export interface MenuActions {
  onNew: () => void;
  onImport: () => void;
  onImportFromFavorites: () => void;
  onNavigateHome: () => void;
  onFocusName: () => void;
  onCreate: () => void;
  onDiscard: () => void;
  onStop: () => void;
  onAddTrack: () => void;
  onRemoveFocusedTrack: () => void;
  onToggleMuteFocusedTrack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onMuteAll: () => void;
  onUnmuteAll: () => void;
  onRemoveEmptyTracks: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onSetLoopIn: () => void;
  onSetLoopOut: () => void;
  onClearLoop: () => void;
  onTrimRegion: () => void;
  onDeleteRegion: () => void;
  canAddTrack: boolean;
  canRemoveTrack: boolean;
  focusedTrackIsMuted: boolean;
  canUndo: boolean;
  canRedo: boolean;
  loopInMs: number | null;
  loopOutMs: number | null;
  hasEmptyTracks: boolean;
  allTracksMuted: boolean;
  anyTrackMuted: boolean;
  canCutRegion: boolean;
}
