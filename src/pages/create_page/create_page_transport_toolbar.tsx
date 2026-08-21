import { useNavigate } from "react-router-dom";

import { usePlayerStore } from "../../stores/player_store";
import { TransportToolbar } from "./transport_toolbar";
import { MAX_TRACKS } from "./constants";

interface CreatePageTransportToolbarProps {
  hasPlayableContent: boolean;
  isEditMode: boolean;
  tracks: string[];
  trackMuted: boolean[];
  focusedTrackIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  loopInMs: number | null;
  loopOutMs: number | null;
  hasEmptyTracks: boolean;
  allTracksMuted: boolean;
  anyTrackMuted: boolean;
  canCutRegion: boolean;
  maxTrackDurationMs: number;
  playheadMs: number;
  seekPositionMs: number;
  guideMs: number | null;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onPlayToggle: VoidFunction;
  onToolbarInsert: (text: string) => void;
  onNew: VoidFunction;
  onImport: VoidFunction;
  onImportFromFavorites: VoidFunction;
  onAudioExtract: VoidFunction;
  onLoadCreation: VoidFunction;
  onCreate: VoidFunction;
  onDiscard: VoidFunction;
  onStop: VoidFunction;
  onAddTrack: VoidFunction;
  onRemoveFocusedTrack: VoidFunction;
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
  onLoopInChange: (ms: number) => void;
  onLoopOutChange: (ms: number) => void;
  onTrimRegion: VoidFunction;
  onDeleteRegion: VoidFunction;
  onHelpOpen: VoidFunction;
}

export function CreatePageTransportToolbar({
  hasPlayableContent,
  isEditMode,
  tracks,
  trackMuted,
  focusedTrackIndex,
  canUndo,
  canRedo,
  loopInMs,
  loopOutMs,
  hasEmptyTracks,
  allTracksMuted,
  anyTrackMuted,
  canCutRegion,
  maxTrackDurationMs,
  playheadMs,
  seekPositionMs,
  guideMs,
  nameInputRef,
  onPlayToggle,
  onToolbarInsert,
  onNew,
  onImport,
  onImportFromFavorites,
  onAudioExtract,
  onLoadCreation,
  onDiscard,
  onStop,
  onAddTrack,
  onRemoveFocusedTrack,
  onUndo,
  onRedo,
  onMuteAll,
  onUnmuteAll,
  onRemoveEmptyTracks,
  onCollapseAll,
  onExpandAll,
  onSetLoopIn,
  onSetLoopOut,
  onClearLoop,
  onLoopInChange,
  onLoopOutChange,
  onTrimRegion,
  onDeleteRegion,
  onHelpOpen,
  onCreate,
}: CreatePageTransportToolbarProps) {
  const navigate = useNavigate();
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);

  function handleNavigateHome() {
    navigate("/");
  }

  function handleFocusName() {
    nameInputRef.current?.focus();
  }

  function handleToggleMuteFocusedTrack() {
    toggleMuteTrack(focusedTrackIndex);
  }

  return (
    <TransportToolbar
      hasPlayableContent={hasPlayableContent}
      isEditMode={isEditMode}
      canCreate={tracks.some((track) => track.trim().length > 0)}
      onPlayToggle={onPlayToggle}
      onToolbarInsert={onToolbarInsert}
      onNew={onNew}
      onImport={onImport}
      onImportFromFavorites={onImportFromFavorites}
      onAudioExtract={onAudioExtract}
      onLoadCreation={onLoadCreation}
      onNavigateHome={handleNavigateHome}
      onFocusName={handleFocusName}
      onCreate={onCreate}
      onDiscard={onDiscard}
      onStop={onStop}
      onAddTrack={onAddTrack}
      onRemoveFocusedTrack={onRemoveFocusedTrack}
      onToggleMuteFocusedTrack={handleToggleMuteFocusedTrack}
      onUndo={onUndo}
      onRedo={onRedo}
      onMuteAll={onMuteAll}
      onUnmuteAll={onUnmuteAll}
      onRemoveEmptyTracks={onRemoveEmptyTracks}
      onCollapseAll={onCollapseAll}
      onExpandAll={onExpandAll}
      onSetLoopIn={onSetLoopIn}
      onSetLoopOut={onSetLoopOut}
      onClearLoop={onClearLoop}
      onLoopInChange={onLoopInChange}
      onLoopOutChange={onLoopOutChange}
      onTrimRegion={onTrimRegion}
      onDeleteRegion={onDeleteRegion}
      canCutRegion={canCutRegion}
      canAddTrack={tracks.length < MAX_TRACKS}
      canRemoveTrack={tracks.length > 1}
      focusedTrackIsMuted={trackMuted[focusedTrackIndex] ?? false}
      canUndo={canUndo}
      canRedo={canRedo}
      loopInMs={loopInMs}
      loopOutMs={loopOutMs}
      hasEmptyTracks={hasEmptyTracks}
      allTracksMuted={allTracksMuted}
      anyTrackMuted={anyTrackMuted}
      onHelpOpen={onHelpOpen}
      maxTrackDurationMs={maxTrackDurationMs}
      playheadMs={playheadMs}
      seekPositionMs={seekPositionMs}
      guideMs={guideMs}
    />
  );
}
