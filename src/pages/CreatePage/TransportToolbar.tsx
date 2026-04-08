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
  FaChevronDown,
  FaQuestionCircle,
  FaSignOutAlt,
  FaFileAlt,
  FaTag,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePlayerStore } from "@/stores/player-store";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { SyntaxColorPanel } from "@/components/RtttlEditor/SyntaxColorPanel";
import clsx from "clsx";

const SYNTAX_ITEMS = ["d=", "o=", "b=", ":", ",", "#", ".", "p", "1", "2", "4", "8", "16", "32"];

export interface MenuActions {
  onNew: () => void;
  onImport: () => void;
  onNavigateHome: () => void;
  onFocusName: () => void;
  onCreate: () => void;
  onDiscard: () => void;
  onAddTrack: () => void;
  onRemoveFocusedTrack: () => void;
  onToggleMuteFocusedTrack: () => void;
  canAddTrack: boolean;
  canRemoveTrack: boolean;
  focusedTrackIsMuted: boolean;
}

interface TransportToolbarProps extends MenuActions {
  hasPlayableContent: boolean;
  onPlayToggle: () => void;
  onToolbarInsert: (text: string) => void;
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

type MenuItemDef =
  | {
      type: "action";
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
      onClick: () => void;
    }
  | { type: "separator" };

function DropdownMenu({ label, items }: { label: string; items: MenuItemDef[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex h-7 items-center gap-0.5 rounded px-2 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700",
          open && "bg-gray-200 dark:bg-gray-700",
        )}
      >
        {label}
        <FaChevronDown size={8} className="mt-px opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-0.5 min-w-[188px] rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {items.map((item, i) => {
            if (item.type === "separator") {
              return <div key={i} className="my-1 h-px bg-gray-100 dark:bg-gray-800" />;
            }
            return (
              <button
                key={i}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs",
                  item.disabled
                    ? "cursor-default text-gray-300 dark:text-gray-600"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300",
                )}
              >
                {item.icon && (
                  <span className="w-3.5 shrink-0 text-center opacity-60">{item.icon}</span>
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Help dialog ─────────────────────────────────────────────────────────────

function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
            {t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" })}
          </DialogTitle>
          <div className="mt-3 space-y-2">
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
              {"name:d=4,o=5,b=120:notes"}
            </p>
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ["d=", "Default duration (1, 2, 4, 8, 16, 32)"],
                  ["o=", "Default octave (4–7)"],
                  ["b=", "Tempo in BPM"],
                  ["#", "Sharp modifier (e.g. c#5)"],
                  [".", "Dotted note — 1.5× duration"],
                  ["p", "Rest / pause"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="w-10 py-1 pr-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {k}
                    </td>
                    <td className="py-1 text-xs text-gray-600 dark:text-gray-400">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-400">
              {t("editor.toolbar.helpNote", {
                defaultValue:
                  "Notes: c d e f g a b (+ # sharp, + octave number, + duration prefix)",
              })}
            </p>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("confirm.ok", { defaultValue: "Got it" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── Main toolbar ─────────────────────────────────────────────────────────────

export function TransportToolbar({
  hasPlayableContent,
  onPlayToggle,
  onToolbarInsert,
  onNew,
  onImport,
  onNavigateHome,
  onFocusName,
  onCreate,
  onDiscard,
  onAddTrack,
  onRemoveFocusedTrack,
  onToggleMuteFocusedTrack,
  canAddTrack,
  canRemoveTrack,
  focusedTrackIsMuted,
}: TransportToolbarProps) {
  const { t } = useTranslation();

  const playerState = usePlayerStore((s) => s.playerState);
  const stop = usePlayerStore((s) => s.stop);

  const editorFeatures = useEditorSettingsStore((s) => s.features);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

  const isPreviewActive = playerState === "playing" || playerState === "paused";

  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  useEffect(
    function closePaletteOnClickOutside() {
      if (!colorPanelOpen) return;
      function handleMouseDown(e: MouseEvent) {
        if (
          colorPanelRef.current?.contains(e.target as Node) ||
          paletteButtonRef.current?.contains(e.target as Node)
        )
          return;
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
      icon: <FaFileAlt size={9} />,
      label: t("create.menuNew", { defaultValue: "New Project" }),
      onClick: onNew,
    },
    {
      type: "action",
      icon: <FaFileImport size={9} />,
      label: t("create.import", { defaultValue: "Import…" }),
      onClick: onImport,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaTag size={9} />,
      label: t("create.menuRename", { defaultValue: "Rename Project" }),
      onClick: onFocusName,
    },
    {
      type: "action",
      icon: <FaCheckCircle size={9} />,
      label: t("create.create", { defaultValue: "Create" }),
      onClick: onCreate,
    },
    { type: "separator" },
    {
      type: "action",
      icon: <FaTimes size={9} />,
      label: t("create.cancel", { defaultValue: "Discard & Exit" }),
      onClick: onDiscard,
    },
    {
      type: "action",
      icon: <FaSignOutAlt size={9} />,
      label: t("create.menuExit", { defaultValue: "Exit to Home" }),
      onClick: onNavigateHome,
    },
  ];

  const editItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaPlus size={9} />,
      label: t("editor.addTrack", { defaultValue: "Add Track" }),
      disabled: !canAddTrack,
      onClick: onAddTrack,
    },
    {
      type: "action",
      icon: <FaTrash size={9} />,
      label: t("editor.removeTrack", { defaultValue: "Remove Focused Track" }),
      disabled: !canRemoveTrack,
      onClick: onRemoveFocusedTrack,
    },
    { type: "separator" },
    {
      type: "action",
      icon: focusedTrackIsMuted ? <FaVolumeMute size={9} /> : <FaVolumeUp size={9} />,
      label: focusedTrackIsMuted
        ? t("editor.unmuteFocused", { defaultValue: "Unmute Focused Track" })
        : t("editor.muteFocused", { defaultValue: "Mute Focused Track" }),
      onClick: onToggleMuteFocusedTrack,
    },
  ];

  const helpItems: MenuItemDef[] = [
    {
      type: "action",
      icon: <FaQuestionCircle size={9} />,
      label: t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" }),
      onClick: () => setHelpDialogOpen(true),
    },
  ];

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 border-b border-gray-200 bg-gray-100/50 px-2 py-1 dark:border-gray-800 dark:bg-gray-900/50">
        {/* Group 0: App menus */}
        <DropdownMenu label={t("create.menuFile", { defaultValue: "File" })} items={fileItems} />
        <DropdownMenu label={t("create.menuEdit", { defaultValue: "Edit" })} items={editItems} />
        <DropdownMenu label={t("create.menuHelp", { defaultValue: "Help" })} items={helpItems} />

        <Separator />

        {/* Group 1: Transport */}
        <button
          type="button"
          onClick={stop}
          disabled={!isPreviewActive}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          title={t("player.stop")}
        >
          <FaStop size={12} />
        </button>
        <button
          type="button"
          onClick={onPlayToggle}
          disabled={!hasPlayableContent}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded text-white",
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
          {playerState === "playing" ? <FaPause size={11} /> : <FaPlay size={11} />}
        </button>

        <Separator />

        {/* Group 2: Syntax insert chips */}
        <div className="flex items-center gap-0.5">
          {SYNTAX_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              title={t("editor.insertToken", { defaultValue: `Insert "${item}"`, token: item })}
              className="flex h-6 min-w-6 items-center justify-center rounded px-1 font-mono text-xs text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
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
            "flex h-7 w-7 items-center justify-center rounded transition-colors",
            editorFeatures.syntaxHighlight
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
          )}
        >
          <FaCode size={12} />
        </button>
        <button
          type="button"
          onClick={() => toggleFeature("playbackTracking")}
          title={t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded transition-colors",
            editorFeatures.playbackTracking
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
          )}
        >
          <FaEye size={12} />
        </button>
        <div className="relative">
          <button
            ref={paletteButtonRef}
            type="button"
            onClick={() => setColorPanelOpen((v) => !v)}
            title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700",
              colorPanelOpen && "bg-gray-200 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
            )}
          >
            <FaPalette size={13} />
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
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700"
        >
          <FaFileImport size={12} />
        </button>

        <Separator />

        {/* Group 5: Help */}
        <button
          type="button"
          title={t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" })}
          onClick={() => setHelpDialogOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-600 dark:hover:text-gray-300"
        >
          <FaQuestionCircle size={14} />
        </button>
      </div>

      <HelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
    </>
  );
}

function Separator() {
  return <div className="mx-0.5 h-4 w-px shrink-0 bg-gray-300 dark:bg-gray-700" />;
}
