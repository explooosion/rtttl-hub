import { useState, useRef, useEffect } from "react";
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
import { DropdownMenu, Separator } from "./dropdown_menu";
import type { MenuItemDef } from "./dropdown_menu";
import { HelpDialog } from "./help_dialog";
import { AboutDialog } from "./about_dialog";
import { SYNTAX_ITEMS } from "./transport_constants";

export type { MenuActions } from "./transport_constants";

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
  onTrimRegion,
  onDeleteRegion,
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
}: TransportToolbarProps) {
  const { t } = useTranslation();

  const playerState = usePlayerStore((s) => s.playerState);

  const editorFeatures = useEditorSettingsStore((s) => s.features);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

  const isPreviewActive = playerState === "playing" || playerState === "paused";

  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  useEffect(
    function closePaletteOnClickOutside() {
      if (!colorPanelOpen) {
        return;
      }
      function handleMouseDown(e: MouseEvent) {
        if (
          colorPanelRef.current?.contains(e.target as Node) ||
          paletteButtonRef.current?.contains(e.target as Node)
        ) {
          return;
        }
        setColorPanelOpen(false);
      }
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    },
    [colorPanelOpen],
  );

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
      label: t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" }),
      onClick: () => setHelpDialogOpen(true),
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
      <div className="shrink-0 overflow-x-auto border-b border-gray-300 bg-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center gap-1 px-3 py-1.5">
          {/* Group 0: App menus */}
          <DropdownMenu label={t("create.menuFile", { defaultValue: "File" })} items={fileItems} />
          <DropdownMenu label={t("create.menuEdit", { defaultValue: "Edit" })} items={editItems} />
          <DropdownMenu label={t("create.menuView", { defaultValue: "View" })} items={viewItems} />
          <DropdownMenu
            label={t("create.menuTransport", { defaultValue: "Transport" })}
            items={transportItems}
          />
          <DropdownMenu label={t("create.menuHelp", { defaultValue: "Help" })} items={helpItems} />

          <Separator />

          {/* Group 0.5: Undo / Redo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={t("create.undo", { defaultValue: "Undo" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaUndo size={14} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={t("create.redo", { defaultValue: "Redo" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaRedo size={14} />
          </button>

          <Separator />

          {/* Group 1: Transport */}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPreviewActive}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
            title={t("player.stop")}
          >
            <FaStop size={16} />
          </button>
          <button
            type="button"
            onClick={onPlayToggle}
            disabled={!hasPlayableContent}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded text-white",
              playerState === "playing"
                ? "bg-amber-600 hover:bg-amber-700"
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
            {playerState === "playing" ? <FaPause size={15} /> : <FaPlay size={15} />}
          </button>

          <Separator />

          {/* Group 2: Syntax insert chips */}
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

          {/* Group 3: Feature toggles + palette */}
          <button
            type="button"
            onClick={() => toggleFeature("syntaxHighlight")}
            title={t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              editorFeatures.syntaxHighlight
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
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
                : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            <FaEye size={14} />
          </button>
          <div className="relative">
            <button
              ref={paletteButtonRef}
              type="button"
              onClick={() => setColorPanelOpen((v) => !v)}
              title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700",
                colorPanelOpen &&
                  "bg-gray-200 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
              )}
            >
              <FaPalette size={15} />
            </button>
            {colorPanelOpen && (
              <div ref={colorPanelRef} className="absolute right-0 top-full z-50 mt-1">
                <SyntaxColorPanel onClose={() => setColorPanelOpen(false)} />
              </div>
            )}
          </div>

          <Separator />

          {/* Group 4: File ops */}
          <button
            type="button"
            onClick={onImport}
            title={t("create.import", { defaultValue: "Import RTTTL" })}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700"
          >
            <FaFileImport size={16} />
          </button>

          <Separator />

          {/* Group 5: Help */}
          <button
            type="button"
            title={t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" })}
            onClick={() => setHelpDialogOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          >
            <FaQuestionCircle size={17} />
          </button>
        </div>
      </div>

      {/* ── Second toolbar row ── */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="flex items-center gap-1 px-3 py-1">
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

          <Separator />

          {/* A-B Loop markers */}
          <button
            type="button"
            onClick={onSetLoopIn}
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
            {loopInMs !== null && (
              <span className="text-[10px] opacity-70">{(loopInMs / 1000).toFixed(1)}s</span>
            )}
          </button>
          <button
            type="button"
            onClick={onSetLoopOut}
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
            {loopOutMs !== null && (
              <span className="text-[10px] opacity-70">{(loopOutMs / 1000).toFixed(1)}s</span>
            )}
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

          <Separator />

          {/* Cut: Trim / Delete Region */}
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
        </div>
      </div>

      <HelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
      <AboutDialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} />
    </>
  );
}
