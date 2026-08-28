import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaDesktop } from "react-icons/fa";
import type { SensorDescriptor, SensorOptions, DragEndEvent } from "@dnd-kit/core";

import type { RtttlCategory } from "../../utils/rtttl_parser";
import type { CutMode } from "./cut_dialog";
import type { RtttlEditorInputHandle } from "../../components/rtttl_editor/rtttl_editor_input";
import type { AudioStemExtractorHandle } from "./audio_stem_extractor";
import type { MidiImporterHandle } from "./midi_importer";
import { DawHeader } from "./daw_header";
import { CreatePageTransportToolbar } from "./create_page_transport_toolbar";
import { CreatePageTrackArea } from "./create_page_track_area";
import { PropertiesPanel } from "./properties_panel";
import { StatusBar } from "./status_bar";
import { CreatePageDialogs } from "./create_page_dialogs";
import { LoadCreationDialog } from "./load_creation_dialog";
import { AudioStemExtractor } from "./audio_stem_extractor";
import { MidiImporter } from "./midi_importer";
import { RecognitionHistoryDialog } from "./recognition_history_dialog";

interface UiModel {
  editId: string | null;
  importOpen: boolean;
  setImportOpen: (v: boolean) => void;
  favImportOpen: boolean;
  setFavImportOpen: (v: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
  createSummaryOpen: boolean;
  setCreateSummaryOpen: (v: boolean) => void;
  pendingAction: "new" | "discard" | null;
  setPendingAction: (v: "new" | "discard" | null) => void;
  cutDialogMode: CutMode | null;
  confirmRemoveIndex: number | null;
  setConfirmRemoveIndex: (v: number | null) => void;
  errors: string[];
  name: string;
  setName: (v: string) => void;
  categories: RtttlCategory[];
  setCategories: (v: RtttlCategory[]) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  playheadMs: number;
  loopInMs: number | null;
  setLoopInMs: (v: number | null) => void;
  loopOutMs: number | null;
  setLoopOutMs: (v: number | null) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  trackListRef: React.RefObject<HTMLDivElement | null>;
  trackRowsRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

interface TrackModel {
  tracks: string[];
  focusedTrackIndex: number;
  setFocusedTrackIndex: (idx: number) => void;
  expandedTracks: Set<number>;
  deactivatedTracks: Set<number>;
  trackEditorRefs: React.MutableRefObject<(RtttlEditorInputHandle | null)[]>;
  canUndo: boolean;
  canRedo: boolean;
  undo: VoidFunction;
  redo: VoidFunction;
  handleTrackCodeChange: (idx: number, val: string) => void;
  handleAddTrack: VoidFunction;
  handleDuplicateTrack: (idx: number) => void;
  toggleDeactivateTrack: (idx: number) => void;
  handleRemoveEmptyTracks: VoidFunction;
  toggleTrackExpanded: (idx: number) => void;
  collapseAllTracks: VoidFunction;
  expandAllTracks: VoidFunction;
  handleRenameTrack: (idx: number, newName: string) => void;
  handleToolbarInsert: (text: string) => void;
  trackColors: string[];
  setTrackColor: (idx: number, color: string) => void;
}

interface DerivedModel {
  maxTrackDurationMs: number;
  trackIds: string[];
  dndSensors: SensorDescriptor<SensorOptions>[];
  handleDragEnd: (event: DragEndEvent) => void;
  hasDraft: boolean;
  hasPlayableContent: boolean;
  hasEmptyTracks: boolean;
  allTracksMuted: boolean;
  anyTrackMuted: boolean;
  canCutRegion: boolean;
  focusedTrackName: string;
}

interface TimelineModel {
  guideMs: number | null;
  setGuideMs: (v: number | null) => void;
  seekPositionMs: number;
  pxPerSec: number;
  timelineWidthPx: number;
  handleTrackAreaMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleTrackAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface ActionModel {
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
}

interface CreatePageViewProps {
  ui: UiModel;
  track: TrackModel;
  derived: DerivedModel;
  timeline: TimelineModel;
  actions: ActionModel;
  trackMuted: boolean[];
  playerState: "idle" | "playing" | "paused" | "stopped";
}

export function CreatePageView({
  ui,
  track,
  derived,
  timeline,
  actions,
  trackMuted,
  playerState,
}: CreatePageViewProps) {
  const { t } = useTranslation();

  const [loadCreationOpen, setLoadCreationOpen] = useState(false);
  const [recognitionHistoryOpen, setRecognitionHistoryOpen] = useState(false);
  const audioExtractRef = useRef<AudioStemExtractorHandle>(null);
  const midiImportRef = useRef<MidiImporterHandle>(null);

  function handleAudioExtract() {
    audioExtractRef.current?.trigger();
  }

  function handleOpenMidiImport() {
    midiImportRef.current?.trigger();
  }

  function handleOpenFavoriteImport() {
    ui.setFavImportOpen(true);
  }

  function handleOpenLoadCreation() {
    setLoadCreationOpen(true);
  }

  function handleLoadCreationClose() {
    setLoadCreationOpen(false);
  }

  function handleOpenRecognitionHistory() {
    setRecognitionHistoryOpen(true);
  }

  function handleRecognitionHistoryClose() {
    setRecognitionHistoryOpen(false);
  }

  function handleConfirmRemoveFocusedTrack() {
    ui.setConfirmRemoveIndex(track.focusedTrackIndex);
  }

  function handleOpenHelp() {
    ui.setHelpOpen(true);
  }

  function handleTrackAreaMouseLeave() {
    timeline.setGuideMs(null);
  }

  function handleRemoveTrack(index: number) {
    ui.setConfirmRemoveIndex(index);
  }

  function handleRenameFocusedTrack(newName: string) {
    track.handleRenameTrack(track.focusedTrackIndex, newName);
  }

  function handleFocusedTrackCodeChange(nextCode: string) {
    track.handleTrackCodeChange(track.focusedTrackIndex, nextCode);
  }

  function handleImportClose() {
    ui.setImportOpen(false);
  }

  function handleFavoriteImportClose() {
    ui.setFavImportOpen(false);
  }

  function handleHelpClose() {
    ui.setHelpOpen(false);
  }

  function handleCancelRemove() {
    ui.setConfirmRemoveIndex(null);
  }

  function handlePendingActionCancel() {
    ui.setPendingAction(null);
  }

  function handleCreateSummaryConfirm() {
    ui.setCreateSummaryOpen(false);
    actions.handleConfirmCreate();
  }

  function handleCreateSummaryCancel() {
    ui.setCreateSummaryOpen(false);
  }

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-8 text-center sm:hidden dark:bg-gray-950">
        <FaDesktop size={64} className="text-indigo-400 dark:text-indigo-500" />
        <div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            {t("create.mobileNotSupported")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("create.mobileNotSupportedDesc")}
          </p>
        </div>
        <Link
          to="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t("create.mobileNotSupportedBack")}
        </Link>
      </div>

      <div className="hidden h-screen flex-col overflow-hidden bg-gray-200 sm:flex dark:bg-gray-950">
        <DawHeader />

        <CreatePageTransportToolbar
          hasPlayableContent={derived.hasPlayableContent}
          isEditMode={!!ui.editId}
          tracks={track.tracks}
          trackMuted={trackMuted}
          focusedTrackIndex={track.focusedTrackIndex}
          nameInputRef={ui.nameInputRef}
          canUndo={track.canUndo}
          canRedo={track.canRedo}
          loopInMs={ui.loopInMs}
          loopOutMs={ui.loopOutMs}
          hasEmptyTracks={derived.hasEmptyTracks}
          allTracksMuted={derived.allTracksMuted}
          anyTrackMuted={derived.anyTrackMuted}
          canCutRegion={derived.canCutRegion}
          maxTrackDurationMs={derived.maxTrackDurationMs}
          playheadMs={ui.playheadMs}
          seekPositionMs={timeline.seekPositionMs}
          guideMs={timeline.guideMs}
          onPlayToggle={actions.handlePlayToggle}
          onToolbarInsert={track.handleToolbarInsert}
          onNew={actions.handleNew}
          onImport={actions.handleImportClick}
          onImportFromFavorites={handleOpenFavoriteImport}
          onAudioExtract={handleAudioExtract}
          onLoadRecognitionHistory={handleOpenRecognitionHistory}
          onLoadCreation={handleOpenLoadCreation}
          onOpenMidiImport={handleOpenMidiImport}
          onCreate={actions.handleSubmit}
          onDiscard={actions.handleDiscard}
          onStop={actions.handleStop}
          onAddTrack={track.handleAddTrack}
          onRemoveFocusedTrack={handleConfirmRemoveFocusedTrack}
          onUndo={track.undo}
          onRedo={track.redo}
          onMuteAll={actions.handleMuteAll}
          onUnmuteAll={actions.handleUnmuteAll}
          onRemoveEmptyTracks={track.handleRemoveEmptyTracks}
          onCollapseAll={track.collapseAllTracks}
          onExpandAll={track.expandAllTracks}
          onSetLoopIn={actions.handleSetLoopIn}
          onSetLoopOut={actions.handleSetLoopOut}
          onClearLoop={actions.handleClearLoop}
          onLoopInChange={ui.setLoopInMs}
          onLoopOutChange={ui.setLoopOutMs}
          onTrimRegion={actions.handleTrimRegion}
          onDeleteRegion={actions.handleDeleteRegion}
          onHelpOpen={handleOpenHelp}
        />

        <div className="flex flex-1 gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4">
          <CreatePageTrackArea
            trackListRef={ui.trackListRef}
            trackRowsRef={ui.trackRowsRef}
            tracks={track.tracks}
            trackIds={derived.trackIds}
            trackColors={track.trackColors}
            expandedTracks={track.expandedTracks}
            deactivatedTracks={track.deactivatedTracks}
            trackEditorRefs={track.trackEditorRefs}
            focusedTrackIndex={track.focusedTrackIndex}
            maxTrackDurationMs={derived.maxTrackDurationMs}
            timelineWidthPx={timeline.timelineWidthPx}
            pxPerSec={timeline.pxPerSec}
            playheadMs={ui.playheadMs}
            seekPositionMs={timeline.seekPositionMs}
            loopInMs={ui.loopInMs}
            loopOutMs={ui.loopOutMs}
            guideMs={timeline.guideMs}
            playerState={playerState}
            dndSensors={derived.dndSensors}
            onMouseMove={timeline.handleTrackAreaMouseMove}
            onMouseLeave={handleTrackAreaMouseLeave}
            onClick={timeline.handleTrackAreaClick}
            onDragEnd={derived.handleDragEnd}
            onFocusTrack={track.setFocusedTrackIndex}
            onToggleExpand={track.toggleTrackExpanded}
            onTrackCodeChange={track.handleTrackCodeChange}
            onRemoveTrack={handleRemoveTrack}
            onRenameTrack={track.handleRenameTrack}
            onDuplicateTrack={track.handleDuplicateTrack}
            onDeactivateTrack={track.toggleDeactivateTrack}
            onColorChange={track.setTrackColor}
            onAddTrack={track.handleAddTrack}
          />

          <PropertiesPanel
            name={ui.name}
            nameInputRef={ui.nameInputRef}
            tracks={track.tracks}
            focusedTrackIndex={track.focusedTrackIndex}
            onNameChange={ui.setName}
            onRenameTrack={handleRenameFocusedTrack}
            onTrackCodeChange={handleFocusedTrackCodeChange}
            categories={ui.categories}
            onCategoriesChange={ui.setCategories}
            errors={ui.errors}
          />
        </div>

        <StatusBar
          hasDraft={derived.hasDraft}
          focusedTrackIndex={track.focusedTrackIndex}
          focusedTrackName={derived.focusedTrackName}
          onHelpOpen={handleOpenHelp}
        />

        <CreatePageDialogs
          importOpen={ui.importOpen}
          favImportOpen={ui.favImportOpen}
          helpOpen={ui.helpOpen}
          cutDialogMode={ui.cutDialogMode}
          confirmRemoveIndex={ui.confirmRemoveIndex}
          pendingAction={ui.pendingAction}
          createSummaryOpen={ui.createSummaryOpen}
          tracks={track.tracks}
          trackColors={track.trackColors}
          loopInMs={ui.loopInMs}
          loopOutMs={ui.loopOutMs}
          name={ui.name}
          categories={ui.categories}
          isPublic={ui.isPublic}
          onImportClose={handleImportClose}
          onImportConfirm={actions.handleImportConfirm}
          onFavImportClose={handleFavoriteImportClose}
          onHelpClose={handleHelpClose}
          onCutConfirm={actions.handleCutConfirm}
          onCutCancel={actions.handleCutCancel}
          onConfirmRemove={actions.handleConfirmRemove}
          onCancelRemove={handleCancelRemove}
          onPendingActionConfirm={actions.handlePendingActionConfirm}
          onPendingActionCancel={handlePendingActionCancel}
          onCreateSummaryConfirm={handleCreateSummaryConfirm}
          onCreateSummaryCancel={handleCreateSummaryCancel}
          onNameChange={ui.setName}
          onRenameTrack={track.handleRenameTrack}
          onIsPublicChange={ui.setIsPublic}
        />

        <LoadCreationDialog
          open={loadCreationOpen}
          onClose={handleLoadCreationClose}
          onConfirm={actions.handleImportConfirm}
        />

        <AudioStemExtractor ref={audioExtractRef} onImport={actions.handleImportConfirm} />

        <MidiImporter ref={midiImportRef} onImport={actions.handleImportConfirm} />

        <RecognitionHistoryDialog
          open={recognitionHistoryOpen}
          onClose={handleRecognitionHistoryClose}
          onImport={actions.handleImportConfirm}
        />
      </div>
    </>
  );
}
