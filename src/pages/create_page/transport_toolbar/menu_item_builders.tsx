import {
  FaFileImport,
  FaSignOutAlt,
  FaFileAlt,
  FaTimes,
  FaUndo,
  FaRedo,
  FaCompressArrowsAlt,
  FaExpandArrowsAlt,
  FaBan,
  FaMapMarkerAlt,
  FaHeart,
  FaInfoCircle,
  FaCut,
  FaEraser,
  FaCode,
  FaCrosshairs,
  FaPlus,
  FaTrash,
  FaVolumeMute,
  FaVolumeUp,
  FaQuestionCircle,
} from "react-icons/fa";
import type { TFunction } from "i18next";

import type { MenuItemDef } from "./dropdown_menu";
import { platformShortcut } from "../utils/keyboard_utils";

interface BuildFileItemsParams {
  t: TFunction;
  onNew: VoidFunction;
  onImport: VoidFunction;
  onImportFromFavorites: VoidFunction;
  onDiscard: VoidFunction;
  onNavigateHome: VoidFunction;
}

export function buildFileItems({
  t,
  onNew,
  onImport,
  onImportFromFavorites,
  onDiscard,
  onNavigateHome,
}: BuildFileItemsParams) {
  const fileItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaFileAlt size={13} />,
      label: t("create.menuNew", { defaultValue: "New Project" }),
      shortcut: platformShortcut("alt+n"),
      onClick: onNew,
    },
    {
      type: "action",
      icon: <FaFileImport size={13} />,
      label: t("create.import", { defaultValue: "Import…" }),
      shortcut: platformShortcut("i"),
      onClick: onImport,
    },
    {
      type: "action",
      icon: <FaHeart size={13} />,
      label: t("create.menuImportFromFavorites", { defaultValue: "Import from Favorites…" }),
      onClick: onImportFromFavorites,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaTimes size={13} />,
      label: t("create.cancel", { defaultValue: "Discard & Exit" }),
      onClick: onDiscard,
    },
    {
      type: "action",
      icon: <FaSignOutAlt size={13} />,
      label: t("create.menuExit", { defaultValue: "Exit to Home" }),
      onClick: onNavigateHome,
    },
  ];

  return fileItems;
}

interface BuildEditItemsParams {
  t: TFunction;
  canUndo: boolean;
  onUndo: VoidFunction;
  canRedo: boolean;
  onRedo: VoidFunction;
  canAddTrack: boolean;
  onAddTrack: VoidFunction;
  canRemoveTrack: boolean;
  onRemoveFocusedTrack: VoidFunction;
  hasEmptyTracks: boolean;
  onRemoveEmptyTracks: VoidFunction;
  focusedTrackIsMuted: boolean;
  onToggleMuteFocusedTrack: VoidFunction;
  allTracksMuted: boolean;
  onMuteAll: VoidFunction;
  anyTrackMuted: boolean;
  onUnmuteAll: VoidFunction;
}

export function buildEditItems({
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
}: BuildEditItemsParams) {
  const editItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaUndo size={13} />,
      label: t("create.undo", { defaultValue: "Undo" }),
      shortcut: platformShortcut("z"),
      disabled: !canUndo,
      onClick: onUndo,
    },
    {
      type: "action",
      icon: <FaRedo size={13} />,
      label: t("create.redo", { defaultValue: "Redo" }),
      shortcut: platformShortcut("shift+z"),
      disabled: !canRedo,
      onClick: onRedo,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaPlus size={13} />,
      label: t("editor.addTrack", { defaultValue: "Add Track" }),
      shortcut: platformShortcut("="),
      disabled: !canAddTrack,
      onClick: onAddTrack,
    },
    {
      type: "action",
      icon: <FaTrash size={13} />,
      label: t("editor.removeTrack", { defaultValue: "Remove Focused Track" }),
      disabled: !canRemoveTrack,
      onClick: onRemoveFocusedTrack,
    },
    {
      type: "action",
      icon: <FaBan size={13} />,
      label: t("create.removeEmptyTracks", { defaultValue: "Remove Empty Tracks" }),
      disabled: !hasEmptyTracks,
      onClick: onRemoveEmptyTracks,
    },
    { type: "separator" },
    {
      type: "action",
      icon: focusedTrackIsMuted ? <FaVolumeMute size={13} /> : <FaVolumeUp size={13} />,
      label: focusedTrackIsMuted
        ? t("editor.unmuteFocused", { defaultValue: "Unmute Focused Track" })
        : t("editor.muteFocused", { defaultValue: "Mute Focused Track" }),
      onClick: onToggleMuteFocusedTrack,
    },
    {
      type: "action",
      icon: <FaVolumeMute size={13} />,
      label: t("create.muteAll", { defaultValue: "Mute All Tracks" }),
      disabled: allTracksMuted,
      onClick: onMuteAll,
    },
    {
      type: "action",
      icon: <FaVolumeUp size={13} />,
      label: t("create.unmuteAll", { defaultValue: "Unmute All Tracks" }),
      disabled: !anyTrackMuted,
      onClick: onUnmuteAll,
    },
  ];

  return editItems;
}

interface BuildViewItemsParams {
  t: TFunction;
  onCollapseAll: VoidFunction;
  onExpandAll: VoidFunction;
  syntaxHighlightActive: boolean;
  playbackTrackingActive: boolean;
  onToggleSyntaxHighlight: VoidFunction;
  onTogglePlaybackTracking: VoidFunction;
}

export function buildViewItems({
  t,
  onCollapseAll,
  onExpandAll,
  syntaxHighlightActive,
  playbackTrackingActive,
  onToggleSyntaxHighlight,
  onTogglePlaybackTracking,
}: BuildViewItemsParams) {
  const viewItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaCompressArrowsAlt size={13} />,
      label: t("create.collapseAll", { defaultValue: "Collapse All Tracks" }),
      onClick: onCollapseAll,
    },
    {
      type: "action",
      icon: <FaExpandArrowsAlt size={13} />,
      label: t("create.expandAll", { defaultValue: "Expand All Tracks" }),
      onClick: onExpandAll,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaCode size={13} />,
      label: t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" }),
      active: syntaxHighlightActive,
      onClick: onToggleSyntaxHighlight,
    },
    {
      type: "action",
      icon: <FaCrosshairs size={13} />,
      label: t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" }),
      active: playbackTrackingActive,
      onClick: onTogglePlaybackTracking,
    },
  ];

  return viewItems;
}

interface BuildTransportItemsParams {
  t: TFunction;
  loopInMs: number | null;
  loopOutMs: number | null;
  onSetLoopIn: VoidFunction;
  onSetLoopOut: VoidFunction;
  onClearLoop: VoidFunction;
  canCutRegion: boolean;
  onTrimRegion: VoidFunction;
  onDeleteRegion: VoidFunction;
}

export function buildTransportItems({
  t,
  loopInMs,
  loopOutMs,
  onSetLoopIn,
  onSetLoopOut,
  onClearLoop,
  canCutRegion,
  onTrimRegion,
  onDeleteRegion,
}: BuildTransportItemsParams) {
  const transportItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaMapMarkerAlt size={13} />,
      label:
        loopInMs !== null
          ? t("create.setLoopIn", {
              defaultValue: `Set Loop In (A) — ${(loopInMs / 1000).toFixed(1)}s`,
            })
          : t("create.setLoopIn", { defaultValue: "Set Loop In (A)" }),
      shortcut: "i",
      active: loopInMs !== null,
      onClick: onSetLoopIn,
    },
    {
      type: "action",
      icon: <FaMapMarkerAlt size={13} />,
      label:
        loopOutMs !== null
          ? t("create.setLoopOut", {
              defaultValue: `Set Loop Out (B) — ${(loopOutMs / 1000).toFixed(1)}s`,
            })
          : t("create.setLoopOut", { defaultValue: "Set Loop Out (B)" }),
      shortcut: "o",
      active: loopOutMs !== null,
      onClick: onSetLoopOut,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaTimes size={13} />,
      label: t("create.clearLoop", { defaultValue: "Clear A-B Loop" }),
      disabled: loopInMs === null && loopOutMs === null,
      onClick: onClearLoop,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaCut size={13} />,
      label: t("create.trimRegion", { defaultValue: "Trim to Selection" }),
      disabled: !canCutRegion,
      onClick: onTrimRegion,
    },
    {
      type: "action",
      icon: <FaEraser size={13} />,
      label: t("create.deleteRegion", { defaultValue: "Delete Selection" }),
      shortcut: "delete",
      disabled: !canCutRegion,
      onClick: onDeleteRegion,
    },
  ];

  return transportItems;
}

interface BuildHelpItemsParams {
  t: TFunction;
  onHelpOpen: VoidFunction;
  onOpenAboutDialog: VoidFunction;
}

export function buildHelpItems({ t, onHelpOpen, onOpenAboutDialog }: BuildHelpItemsParams) {
  const helpItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaQuestionCircle size={13} />,
      label: t("editor.toolbar.helpTitle", { defaultValue: "Studio Guide" }),
      onClick: onHelpOpen,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaInfoCircle size={13} />,
      label: t("create.menuAbout", { defaultValue: "About" }),
      onClick: onOpenAboutDialog,
    },
  ];

  return helpItems;
}
