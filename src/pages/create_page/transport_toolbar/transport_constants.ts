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
  onNew: VoidFunction;
  onImport: VoidFunction;
  onImportFromFavorites: VoidFunction;
  onNavigateHome: VoidFunction;
  onFocusName: VoidFunction;
  onCreate: VoidFunction;
  onDiscard: VoidFunction;
  onStop: VoidFunction;
  onAddTrack: VoidFunction;
  onRemoveFocusedTrack: VoidFunction;
  onToggleMuteFocusedTrack: VoidFunction;
  onUndo: VoidFunction;
  onRedo: VoidFunction;
  onMuteAll: VoidFunction;
  onUnmuteAll: VoidFunction;
  onRemoveEmptyTracks: VoidFunction;
  onCollapseAll: VoidFunction;
  onExpandAll: VoidFunction;
  onSetLoopIn: VoidFunction;
  onSetLoopOut: VoidFunction;
  onClearLoop: VoidFunction;
  onTrimRegion: VoidFunction;
  onDeleteRegion: VoidFunction;
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
