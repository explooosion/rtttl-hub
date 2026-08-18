import {
  FaPlay,
  FaStop,
  FaUndo,
  FaRedo,
  FaPlus,
  FaTrash,
  FaVolumeMute,
  FaFileImport,
  FaCode,
  FaCrosshairs,
  FaEyeSlash,
  FaPalette,
  FaGripVertical,
  FaChevronDown,
  FaClone,
  FaEraser,
  FaRegCopy,
} from "react-icons/fa";

import { platformShortcut } from "../../utils/keyboard_utils";

import type { ReactNode } from "react";
import type { TFunction } from "i18next";

interface GuideRow {
  icon: ReactNode;
  label: string;
  desc: string;
}

interface ShortcutRow {
  keys: string;
  label: string;
}

export function buildToolbarRows(t: TFunction): GuideRow[] {
  return [
    {
      icon: <FaPlay size={11} />,
      label: t("editor.guide.playPause", { defaultValue: "Play / Pause" }),
      desc: t("editor.guide.playPauseDesc", { defaultValue: "Toggle playback preview" }),
    },
    {
      icon: <FaStop size={11} />,
      label: t("editor.guide.stop", { defaultValue: "Stop" }),
      desc: t("editor.guide.stopDesc", { defaultValue: "Halt playback, return to start" }),
    },
    {
      icon: <FaUndo size={11} />,
      label: t("editor.guide.undo", { defaultValue: "Undo / Redo" }),
      desc: t("editor.guide.undoDesc", { defaultValue: "Step through edit history" }),
    },
    {
      icon: <FaRedo size={11} />,
      label: t("editor.guide.redo", { defaultValue: "Redo" }),
      desc: t("editor.guide.redoDesc", { defaultValue: "Restore reverted edit" }),
    },
    {
      icon: <FaPlus size={11} />,
      label: t("editor.guide.addTrack", { defaultValue: "Add Track" }),
      desc: t("editor.guide.addTrackDesc", { defaultValue: "Insert a new RTTTL track" }),
    },
    {
      icon: <FaTrash size={11} />,
      label: t("editor.guide.removeTrack", { defaultValue: "Remove Track" }),
      desc: t("editor.guide.removeTrackDesc", { defaultValue: "Delete the focused track" }),
    },
    {
      icon: <FaVolumeMute size={11} />,
      label: t("editor.guide.muteTrack", { defaultValue: "Mute Track" }),
      desc: t("editor.guide.muteTrackDesc", { defaultValue: "Toggle mute on the focused track" }),
    },
    {
      icon: <FaFileImport size={11} />,
      label: t("editor.guide.import", { defaultValue: "Import" }),
      desc: t("editor.guide.importDesc", { defaultValue: "Paste one or more RTTTL lines" }),
    },
    {
      icon: <FaCode size={11} />,
      label: t("editor.guide.syntax", { defaultValue: "Syntax Highlight" }),
      desc: t("editor.guide.syntaxDesc", { defaultValue: "Toggle code coloring" }),
    },
    {
      icon: <FaCrosshairs size={11} />,
      label: t("editor.guide.follow", { defaultValue: "Follow Playback" }),
      desc: t("editor.guide.followDesc", {
        defaultValue: "Auto-scroll editor to current note",
      }),
    },
    {
      icon: <FaPalette size={11} />,
      label: t("editor.guide.colors", { defaultValue: "Syntax Colors" }),
      desc: t("editor.guide.colorsDesc", { defaultValue: "Customize syntax token colors" }),
    },
  ];
}

export function buildTrackLaneRows(t: TFunction): GuideRow[] {
  return [
    {
      icon: <FaGripVertical size={11} />,
      label: t("editor.guide.dragHandle", { defaultValue: "Drag Handle" }),
      desc: t("editor.guide.dragHandleDesc", { defaultValue: "Drag up or down to reorder tracks" }),
    },
    {
      icon: <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-1 ring-white/60" />,
      label: t("editor.guide.colorDot", { defaultValue: "Color Dot" }),
      desc: t("editor.guide.colorDotDesc", { defaultValue: "Click to change the track color" }),
    },
    {
      icon: <FaChevronDown size={11} />,
      label: t("editor.guide.expand", { defaultValue: "Expand / Collapse" }),
      desc: t("editor.guide.expandDesc", { defaultValue: "Show or hide the inline RTTTL editor" }),
    },
    {
      icon: <FaVolumeMute size={11} />,
      label: t("editor.guide.trackMute", { defaultValue: "Mute" }),
      desc: t("editor.guide.trackMuteDesc", { defaultValue: "Silence this track only" }),
    },
    {
      icon: <FaClone size={11} />,
      label: t("editor.guide.duplicate", { defaultValue: "Duplicate" }),
      desc: t("editor.guide.duplicateDesc", { defaultValue: "Copy this track to a new slot" }),
    },
    {
      icon: <FaEyeSlash size={11} />,
      label: t("editor.guide.deactivate", { defaultValue: "Deactivate" }),
      desc: t("editor.guide.deactivateDesc", {
        defaultValue: "Grey out and exclude from playback",
      }),
    },
    {
      icon: <FaTrash size={11} />,
      label: t("editor.guide.trackRemove", { defaultValue: "Remove" }),
      desc: t("editor.guide.trackRemoveDesc", { defaultValue: "Delete this track permanently" }),
    },
    {
      icon: <FaEraser size={11} />,
      label: t("editor.guide.clear", { defaultValue: "Clear" }),
      desc: t("editor.guide.clearDesc", { defaultValue: "Reset RTTTL code to empty" }),
    },
    {
      icon: <FaRegCopy size={11} />,
      label: t("editor.guide.copy", { defaultValue: "Copy" }),
      desc: t("editor.guide.copyDesc", { defaultValue: "Copy RTTTL code to clipboard" }),
    },
  ];
}

export function buildShortcutRows(t: TFunction): ShortcutRow[] {
  return [
    { keys: "space", label: t("editor.guide.shortcutPlay", { defaultValue: "Play / Pause" }) },
    { keys: "i", label: t("editor.guide.shortcutLoopIn", { defaultValue: "Set Loop In (A)" }) },
    { keys: "o", label: t("editor.guide.shortcutLoopOut", { defaultValue: "Set Loop Out (B)" }) },
    {
      keys: platformShortcut("z"),
      label: t("editor.guide.shortcutUndo", { defaultValue: "Undo" }),
    },
    {
      keys: platformShortcut("shift+z"),
      label: t("editor.guide.shortcutRedo", { defaultValue: "Redo" }),
    },
    {
      keys: platformShortcut("="),
      label: t("editor.guide.shortcutAddTrack", { defaultValue: "Add Track" }),
    },
    {
      keys: "delete",
      label: t("editor.guide.shortcutDelete", { defaultValue: "Delete Selection" }),
    },
    {
      keys: platformShortcut("alt+n"),
      label: t("editor.guide.shortcutNew", { defaultValue: "New Project" }),
    },
    {
      keys: platformShortcut("i"),
      label: t("editor.guide.shortcutImport", { defaultValue: "Import" }),
    },
    {
      keys: platformShortcut("s"),
      label: t("editor.guide.shortcutSave", { defaultValue: "Create / Save" }),
    },
  ];
}
