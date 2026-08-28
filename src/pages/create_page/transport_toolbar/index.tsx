import { useMemo, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../../stores/player_store";
import { useEditorSettingsStore } from "../../../stores/editor_settings_store";
import { useAuthStore } from "../../../stores/auth_store";
import { useAuthRedirect } from "../../../hooks/use_auth_redirect";
import { SyntaxColorPanel } from "../../../components/rtttl_editor/syntax_color_panel";
import { AboutDialog } from "./about_dialog";
import { EditorToolsRow } from "./editor_tools_row";
import { MenuBarRow } from "./menu_bar_row";
import {
  buildEditItems,
  buildFileItems,
  buildHelpItems,
  buildImportItems,
  buildTransportItems,
  buildViewItems,
} from "./menu_item_builders";
import { SYNTAX_ITEMS } from "./transport_constants";
import { TransportControlsRow } from "./transport_controls_row";

export type { MenuActions } from "./transport_constants";

interface TransportToolbarProps {
  hasPlayableContent: boolean;
  isEditMode: boolean;
  canCreate: boolean;
  onPlayToggle: VoidFunction;
  onToolbarInsert: (text: string) => void;
  onNew: VoidFunction;
  onImport: VoidFunction;
  onImportFromFavorites: VoidFunction;
  onAudioExtract: VoidFunction;
  onLoadRecognitionHistory: VoidFunction;
  onLoadCreation: VoidFunction;
  onOpenMidiImport: VoidFunction;
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
  onLoopInChange: (ms: number) => void;
  onLoopOutChange: (ms: number) => void;
  onTrimRegion: VoidFunction;
  onDeleteRegion: VoidFunction;
  onHelpOpen: VoidFunction;
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
  maxTrackDurationMs: number;
  playheadMs: number;
  seekPositionMs: number;
  guideMs: number | null;
}

export function TransportToolbar({
  hasPlayableContent,
  isEditMode,
  canCreate,
  onPlayToggle,
  onToolbarInsert,
  onNew,
  onImport,
  onImportFromFavorites,
  onAudioExtract,
  onLoadRecognitionHistory,
  onLoadCreation,
  onOpenMidiImport,
  onNavigateHome,
  onFocusName: _onFocusName,
  onCreate,
  onDiscard,
  onStop,
  onAddTrack,
  onRemoveFocusedTrack,
  onToggleMuteFocusedTrack,
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
  canAddTrack,
  canRemoveTrack,
  focusedTrackIsMuted,
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
}: TransportToolbarProps) {
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const { goToLogin } = useAuthRedirect();

  const playerState = usePlayerStore((s) => s.playerState);

  const editorFeatures = useEditorSettingsStore((s) => s.features);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

  const isPreviewActive = playerState === "playing" || playerState === "paused";

  const positionMs = isPreviewActive ? playheadMs : seekPositionMs;

  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [loopInEditing, setLoopInEditing] = useState(false);
  const [loopInInputVal, setLoopInInputVal] = useState("");
  const [loopOutEditing, setLoopOutEditing] = useState(false);
  const [loopOutInputVal, setLoopOutInputVal] = useState("");

  const syntaxInsertHandlers = useMemo(
    function buildSyntaxInsertHandlers() {
      return SYNTAX_ITEMS.map((item) => {
        return function handleSyntaxInsert() {
          onToolbarInsert(item);
        };
      });
    },
    [onToolbarInsert],
  );

  function handleToggleSyntaxHighlight() {
    toggleFeature("syntaxHighlight");
  }

  function handleTogglePlaybackTracking() {
    toggleFeature("playbackTracking");
  }

  function handleToggleMultiLineCode() {
    toggleFeature("multiLineCode");
  }

  function handleToggleColorPanel() {
    setColorPanelOpen((isOpen) => !isOpen);
  }

  function applyLoopInInputValue() {
    const seconds = parseFloat(loopInInputVal);
    if (isNaN(seconds)) {
      return;
    }
    onLoopInChange(Math.max(0, Math.min(maxTrackDurationMs, Math.round(seconds * 1000))));
  }

  function handleLoopInInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoopInInputVal(e.target.value.replace(/[^0-9.]/g, ""));
  }

  function handleLoopInInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      applyLoopInInputValue();
      setLoopInEditing(false);
    } else if (e.key === "Escape") {
      setLoopInEditing(false);
    }
    e.stopPropagation();
  }

  function handleLoopInInputBlur() {
    applyLoopInInputValue();
    setLoopInEditing(false);
  }

  function handleLoopInInputClick(e: React.MouseEvent<HTMLInputElement>) {
    e.stopPropagation();
  }

  function handleLoopInValueClick(e: React.MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    if (loopInMs === null) {
      return;
    }
    setLoopInInputVal((loopInMs / 1000).toFixed(3));
    setLoopInEditing(true);
  }

  function applyLoopOutInputValue() {
    const seconds = parseFloat(loopOutInputVal);
    if (isNaN(seconds)) {
      return;
    }
    onLoopOutChange(Math.max(0, Math.min(maxTrackDurationMs, Math.round(seconds * 1000))));
  }

  function handleLoopOutInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoopOutInputVal(e.target.value.replace(/[^0-9.]/g, ""));
  }

  function handleLoopOutInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      applyLoopOutInputValue();
      setLoopOutEditing(false);
    } else if (e.key === "Escape") {
      setLoopOutEditing(false);
    }
    e.stopPropagation();
  }

  function handleLoopOutInputBlur() {
    applyLoopOutInputValue();
    setLoopOutEditing(false);
  }

  function handleLoopOutInputClick(e: React.MouseEvent<HTMLInputElement>) {
    e.stopPropagation();
  }

  function handleLoopOutValueClick(e: React.MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    if (loopOutMs === null) {
      return;
    }
    setLoopOutInputVal((loopOutMs / 1000).toFixed(3));
    setLoopOutEditing(true);
  }

  function handleCloseColorPanel() {
    setColorPanelOpen(false);
  }

  function handleCloseAboutDialog() {
    setAboutDialogOpen(false);
  }

  function handleOpenAboutDialog() {
    setAboutDialogOpen(true);
  }

  function handleLoadCreationClick() {
    if (user) {
      onLoadCreation();
    } else {
      goToLogin();
    }
  }

  const fileItems = buildFileItems({
    t,
    onNew,
    onDiscard,
    onNavigateHome,
  });
  const importItems = buildImportItems({
    t,
    onImport,
    onImportFromFavorites,
    onAudioExtract,
    onLoadRecognitionHistory,
    onLoadCreation: handleLoadCreationClick,
    onOpenMidiImport,
  });
  const editItems = buildEditItems({
    t,
    canUndo,
    onUndo,
    canRedo,
    onRedo,
    canAddTrack,
    onAddTrack,
    canRemoveTrack,
    onRemoveFocusedTrack,
    hasEmptyTracks,
    onRemoveEmptyTracks,
    focusedTrackIsMuted,
    onToggleMuteFocusedTrack,
    allTracksMuted,
    onMuteAll,
    anyTrackMuted,
    onUnmuteAll,
  });
  const viewItems = buildViewItems({
    t,
    onCollapseAll,
    onExpandAll,
    syntaxHighlightActive: editorFeatures.syntaxHighlight,
    playbackTrackingActive: editorFeatures.playbackTracking,
    multiLineCodeActive: editorFeatures.multiLineCode,
    onToggleSyntaxHighlight: handleToggleSyntaxHighlight,
    onTogglePlaybackTracking: handleTogglePlaybackTracking,
    onToggleMultiLineCode: handleToggleMultiLineCode,
  });
  const transportItems = buildTransportItems({
    t,
    loopInMs,
    loopOutMs,
    onSetLoopIn,
    onSetLoopOut,
    onClearLoop,
    canCutRegion,
    onTrimRegion,
    onDeleteRegion,
  });
  const helpItems = buildHelpItems({
    t,
    onHelpOpen,
    onOpenAboutDialog: handleOpenAboutDialog,
  });

  return (
    <>
      <MenuBarRow
        fileItems={fileItems}
        editItems={editItems}
        viewItems={viewItems}
        transportItems={transportItems}
        importItems={importItems}
        helpItems={helpItems}
        canCreate={canCreate}
        isEditMode={isEditMode}
        onCreate={onCreate}
        onDiscard={onDiscard}
        onImport={onImport}
        onAudioExtract={onAudioExtract}
        onOpenMidiImport={onOpenMidiImport}
      />

      <EditorToolsRow
        syntaxInsertHandlers={syntaxInsertHandlers}
        syntaxHighlightActive={editorFeatures.syntaxHighlight}
        playbackTrackingActive={editorFeatures.playbackTracking}
        colorPanelOpen={colorPanelOpen}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleSyntaxHighlight={handleToggleSyntaxHighlight}
        onTogglePlaybackTracking={handleTogglePlaybackTracking}
        onToggleColorPanel={handleToggleColorPanel}
        onUndo={onUndo}
        onRedo={onRedo}
        onImport={onImport}
        onHelpOpen={onHelpOpen}
      />

      <TransportControlsRow
        onStop={onStop}
        isPreviewActive={isPreviewActive}
        onPlayToggle={onPlayToggle}
        hasPlayableContent={hasPlayableContent}
        playerState={playerState}
        maxTrackDurationMs={maxTrackDurationMs}
        positionMs={positionMs}
        guideMs={guideMs}
        loopInEditing={loopInEditing}
        loopInMs={loopInMs}
        loopInInputVal={loopInInputVal}
        onSetLoopIn={onSetLoopIn}
        onLoopInInputChange={handleLoopInInputChange}
        onLoopInInputKeyDown={handleLoopInInputKeyDown}
        onLoopInInputBlur={handleLoopInInputBlur}
        onLoopInInputClick={handleLoopInInputClick}
        onLoopInValueClick={handleLoopInValueClick}
        loopOutEditing={loopOutEditing}
        loopOutMs={loopOutMs}
        loopOutInputVal={loopOutInputVal}
        onSetLoopOut={onSetLoopOut}
        onLoopOutInputChange={handleLoopOutInputChange}
        onLoopOutInputKeyDown={handleLoopOutInputKeyDown}
        onLoopOutInputBlur={handleLoopOutInputBlur}
        onLoopOutInputClick={handleLoopOutInputClick}
        onLoopOutValueClick={handleLoopOutValueClick}
        onClearLoop={onClearLoop}
        canCutRegion={canCutRegion}
        onTrimRegion={onTrimRegion}
        onDeleteRegion={onDeleteRegion}
        allTracksMuted={allTracksMuted}
        anyTrackMuted={anyTrackMuted}
        onMuteAll={onMuteAll}
        onUnmuteAll={onUnmuteAll}
        hasEmptyTracks={hasEmptyTracks}
        onRemoveEmptyTracks={onRemoveEmptyTracks}
      />

      {/* Syntax Color Panel Dialog */}
      <Dialog open={colorPanelOpen} onClose={handleCloseColorPanel} className="relative z-50">
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel>
            <SyntaxColorPanel onClose={handleCloseColorPanel} />
          </DialogPanel>
        </div>
      </Dialog>

      <AboutDialog open={aboutDialogOpen} onClose={handleCloseAboutDialog} />
    </>
  );
}
