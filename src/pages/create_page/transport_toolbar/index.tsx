import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaFileImport,
  FaPalette,
  FaCode,
  FaEye,
  FaPlus,
  FaTrash,
  FaVolumeUp,
  FaVolumeMute,
  FaQuestionCircle,
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
} from "react-icons/fa";
import clsx from "clsx";

import { usePlayerStore } from "../../../stores/player_store";
import { useEditorSettingsStore } from "../../../stores/editor_settings_store";
import { SyntaxColorPanel } from "../../../components/rtttl_editor/syntax_color_panel";
import { DropdownMenu, MenuBar, Separator } from "./dropdown_menu";
import type { MenuItemDef } from "./dropdown_menu";
import { AboutDialog } from "./about_dialog";
import { SYNTAX_ITEMS } from "./transport_constants";

export type { MenuActions } from "./transport_constants";

/** Format milliseconds as mm:ss.xxx (ms precision) */
function formatMs(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

interface TransportToolbarProps {
  hasPlayableContent: boolean;
  onPlayToggle: () => void;
  onToolbarInsert: (text: string) => void;
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
  onLoopInChange: (ms: number) => void;
  onLoopOutChange: (ms: number) => void;
  onTrimRegion: () => void;
  onDeleteRegion: () => void;
  onHelpOpen: () => void;
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
  onPlayToggle,
  onToolbarInsert,
  onNew,
  onImport,
  onImportFromFavorites,
  onNavigateHome,
  onFocusName: _onFocusName,
  onCreate: _onCreate,
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

  const fileItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaFileAlt size={13} />,
      label: t("create.menuNew", { defaultValue: "New Project" }),
      onClick: onNew,
    },
    {
      type: "action",
      icon: <FaFileImport size={13} />,
      label: t("create.import", { defaultValue: "Import…" }),
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

  const editItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaUndo size={13} />,
      label: t("create.undo", { defaultValue: "Undo" }),
      disabled: !canUndo,
      onClick: onUndo,
    },
    {
      type: "action",
      icon: <FaRedo size={13} />,
      label: t("create.redo", { defaultValue: "Redo" }),
      disabled: !canRedo,
      onClick: onRedo,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaPlus size={13} />,
      label: t("editor.addTrack", { defaultValue: "Add Track" }),
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
      active: editorFeatures.syntaxHighlight,
      onClick: () => toggleFeature("syntaxHighlight"),
    },
    {
      type: "action",
      icon: <FaEye size={13} />,
      label: t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" }),
      active: editorFeatures.playbackTracking,
      onClick: () => toggleFeature("playbackTracking"),
    },
  ];

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
      disabled: !canCutRegion,
      onClick: onDeleteRegion,
    },
  ];

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
      onClick: () => setAboutDialogOpen(true),
    },
  ];

  return (
    <>
      {/* ── Row 1: Menu bar ── */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-300 bg-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center gap-1 px-3 py-1">
          <MenuBar>
            <DropdownMenu
              label={t("create.menuFile", { defaultValue: "File" })}
              items={fileItems}
            />
            <DropdownMenu
              label={t("create.menuEdit", { defaultValue: "Edit" })}
              items={editItems}
            />
            <DropdownMenu
              label={t("create.menuView", { defaultValue: "View" })}
              items={viewItems}
            />
            <DropdownMenu
              label={t("create.menuTransport", { defaultValue: "Transport" })}
              items={transportItems}
            />
            <DropdownMenu
              label={t("create.menuHelp", { defaultValue: "Help" })}
              items={helpItems}
            />
          </MenuBar>
        </div>
      </div>

      {/* ── Row 2: Editor tools ── */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-300 bg-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center gap-1 px-3 py-1">
          {/* Syntax insert chips */}
          <div className="flex items-center gap-0.5">
            {SYNTAX_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                title={t("editor.insertToken", { defaultValue: `Insert "${item}"`, token: item })}
                className="flex h-7 min-w-7 items-center justify-center rounded px-1 font-mono text-sm text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
                onClick={() => onToolbarInsert(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <Separator />

          {/* Feature toggles */}
          <button
            type="button"
            onClick={() => toggleFeature("syntaxHighlight")}
            title={t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              editorFeatures.syntaxHighlight
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
            )}
          >
            <FaCode size={14} />
          </button>
          <button
            type="button"
            onClick={() => toggleFeature("playbackTracking")}
            title={t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              editorFeatures.playbackTracking
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
            )}
          >
            <FaEye size={14} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColorPanelOpen((v) => !v)}
              title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-700",
                colorPanelOpen &&
                  "bg-gray-300 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
              )}
            >
              <FaPalette size={15} />
            </button>
          </div>

          <Separator />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={t("create.undo", { defaultValue: "Undo" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaUndo size={14} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={t("create.redo", { defaultValue: "Redo" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaRedo size={14} />
          </button>

          <Separator />

          {/* Import + Help */}
          <button
            type="button"
            onClick={onImport}
            title={t("create.import", { defaultValue: "Import RTTTL" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaFileImport size={16} />
          </button>
          <button
            type="button"
            title={t("editor.toolbar.helpTitle", { defaultValue: "Studio Guide" })}
            onClick={onHelpOpen}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaQuestionCircle size={17} />
          </button>
        </div>
      </div>

      {/* ── Row 3: Transport controls + time display + track tools ── */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="flex items-center gap-1 px-3 py-1">
          {/* Stop + Play/Pause */}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPreviewActive}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
            title={t("player.stop")}
          >
            <FaStop size={15} />
          </button>
          <button
            type="button"
            onClick={onPlayToggle}
            disabled={!hasPlayableContent}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded text-white",
              playerState === "playing"
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-indigo-500 hover:bg-indigo-600",
              !hasPlayableContent && "cursor-not-allowed opacity-50",
            )}
            title={
              playerState === "playing"
                ? t("player.pause")
                : playerState === "paused"
                  ? t("player.resume")
                  : t("player.play")
            }
          >
            {playerState === "playing" ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>

          {/* Time display — pos + cur always visible, ms precision */}
          <div className="ml-1 flex items-stretch gap-0 overflow-hidden rounded border border-gray-400 bg-gray-900 font-mono dark:border-gray-700">
            {/* Position */}
            <div className="flex flex-col items-center justify-center px-2.5 py-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-widest text-gray-500">
                pos
              </span>
              <span
                className={clsx(
                  "text-sm font-bold tabular-nums leading-none",
                  isPreviewActive ? "text-green-400" : "text-gray-400",
                )}
              >
                {maxTrackDurationMs > 0 ? formatMs(positionMs) : "00:00.000"}
              </span>
            </div>
            <div className="w-px bg-gray-700" />
            {/* Cursor — always shown */}
            <div className="flex flex-col items-center justify-center px-2.5 py-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-widest text-gray-500">
                cur
              </span>
              <span className="text-sm font-bold tabular-nums leading-none text-indigo-400">
                {guideMs !== null ? formatMs(guideMs) : "--:--.---"}
              </span>
            </div>
          </div>

          <Separator />

          {/* A-B Loop markers */}
          <button
            type="button"
            onClick={loopInEditing ? undefined : onSetLoopIn}
            title={t("create.setLoopIn", { defaultValue: "Set Loop In (A)" })}
            className={clsx(
              "flex h-7 items-center gap-1 rounded px-2 text-sm transition-colors",
              loopInMs !== null
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            <FaMapMarkerAlt size={13} />
            <span>A</span>
            {loopInMs !== null &&
              (loopInEditing ? (
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={loopInInputVal}
                  onChange={(e) => setLoopInInputVal(e.target.value.replace(/[^0-9.]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const sec = parseFloat(loopInInputVal);
                      if (!isNaN(sec)) {
                        onLoopInChange(
                          Math.max(0, Math.min(maxTrackDurationMs, Math.round(sec * 1000))),
                        );
                      }
                      setLoopInEditing(false);
                    } else if (e.key === "Escape") {
                      setLoopInEditing(false);
                    }
                    e.stopPropagation();
                  }}
                  onBlur={() => {
                    const sec = parseFloat(loopInInputVal);
                    if (!isNaN(sec)) {
                      onLoopInChange(
                        Math.max(0, Math.min(maxTrackDurationMs, Math.round(sec * 1000))),
                      );
                    }
                    setLoopInEditing(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 border-b border-indigo-400 bg-transparent text-[10px] font-mono text-indigo-600 outline-none dark:text-indigo-400"
                />
              ) : (
                <span
                  className="cursor-text text-[10px] opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoopInInputVal((loopInMs / 1000).toFixed(3));
                    setLoopInEditing(true);
                  }}
                >
                  {(loopInMs / 1000).toFixed(3)}s
                </span>
              ))}
          </button>
          <button
            type="button"
            onClick={loopOutEditing ? undefined : onSetLoopOut}
            title={t("create.setLoopOut", { defaultValue: "Set Loop Out (B)" })}
            className={clsx(
              "flex h-7 items-center gap-1 rounded px-2 text-sm transition-colors",
              loopOutMs !== null
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                : "text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            <FaMapMarkerAlt size={13} />
            <span>B</span>
            {loopOutMs !== null &&
              (loopOutEditing ? (
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={loopOutInputVal}
                  onChange={(e) => setLoopOutInputVal(e.target.value.replace(/[^0-9.]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const sec = parseFloat(loopOutInputVal);
                      if (!isNaN(sec)) {
                        onLoopOutChange(
                          Math.max(0, Math.min(maxTrackDurationMs, Math.round(sec * 1000))),
                        );
                      }
                      setLoopOutEditing(false);
                    } else if (e.key === "Escape") {
                      setLoopOutEditing(false);
                    }
                    e.stopPropagation();
                  }}
                  onBlur={() => {
                    const sec = parseFloat(loopOutInputVal);
                    if (!isNaN(sec)) {
                      onLoopOutChange(
                        Math.max(0, Math.min(maxTrackDurationMs, Math.round(sec * 1000))),
                      );
                    }
                    setLoopOutEditing(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 border-b border-purple-400 bg-transparent text-[10px] font-mono text-purple-600 outline-none dark:text-purple-400"
                />
              ) : (
                <span
                  className="cursor-text text-[10px] opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoopOutInputVal((loopOutMs / 1000).toFixed(3));
                    setLoopOutEditing(true);
                  }}
                >
                  {(loopOutMs / 1000).toFixed(3)}s
                </span>
              ))}
          </button>
          {(loopInMs !== null || loopOutMs !== null) && (
            <button
              type="button"
              onClick={onClearLoop}
              title={t("create.clearLoop", { defaultValue: "Clear A-B Loop" })}
              className="flex h-7 items-center gap-1 rounded px-2 text-sm text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <FaTimes size={12} />
              <span>{t("create.clearLoop", { defaultValue: "Clear Loop" })}</span>
            </button>
          )}

          {/* Trim / Delete Region */}
          <button
            type="button"
            onClick={onTrimRegion}
            disabled={!canCutRegion}
            title={t("create.trimRegion", { defaultValue: "Trim to Selection" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
          >
            <FaCut size={13} />
            <span>{t("create.trimRegion", { defaultValue: "Trim" })}</span>
          </button>
          <button
            type="button"
            onClick={onDeleteRegion}
            disabled={!canCutRegion}
            title={t("create.deleteRegion", { defaultValue: "Delete Selection" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
          >
            <FaEraser size={13} />
            <span>{t("create.deleteRegion", { defaultValue: "Delete" })}</span>
          </button>

          <Separator />

          {/* Mute All / Unmute All */}
          <button
            type="button"
            onClick={onMuteAll}
            disabled={allTracksMuted}
            title={t("create.muteAll", { defaultValue: "Mute All Tracks" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaVolumeMute size={13} />
            <span>{t("create.muteAll", { defaultValue: "Mute All" })}</span>
          </button>
          <button
            type="button"
            onClick={onUnmuteAll}
            disabled={!anyTrackMuted}
            title={t("create.unmuteAll", { defaultValue: "Unmute All Tracks" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaVolumeUp size={13} />
            <span>{t("create.unmuteAll", { defaultValue: "Unmute All" })}</span>
          </button>

          <Separator />

          {/* Remove Empty Tracks */}
          <button
            type="button"
            onClick={onRemoveEmptyTracks}
            disabled={!hasEmptyTracks}
            title={t("create.removeEmptyTracks", { defaultValue: "Remove Empty Tracks" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaBan size={13} />
            <span>{t("create.removeEmptyTracks", { defaultValue: "Remove Empty" })}</span>
          </button>

          <Separator />

          {/* Collapse All / Expand All */}
          <button
            type="button"
            onClick={onCollapseAll}
            title={t("create.collapseAll", { defaultValue: "Collapse All Tracks" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaCompressArrowsAlt size={13} />
            <span>{t("create.collapseAll", { defaultValue: "Collapse All" })}</span>
          </button>
          <button
            type="button"
            onClick={onExpandAll}
            title={t("create.expandAll", { defaultValue: "Expand All Tracks" })}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaExpandArrowsAlt size={13} />
            <span>{t("create.expandAll", { defaultValue: "Expand All" })}</span>
          </button>
        </div>
      </div>

      {/* Syntax Color Panel Dialog */}
      <Dialog
        open={colorPanelOpen}
        onClose={() => setColorPanelOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel>
            <SyntaxColorPanel onClose={() => setColorPanelOpen(false)} />
          </DialogPanel>
        </div>
      </Dialog>

      <AboutDialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} />
    </>
  );
}
