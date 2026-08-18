import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  FaFileImport,
  FaPalette,
  FaCode,
  FaCrosshairs,
  FaQuestionCircle,
  FaUndo,
  FaRedo,
} from "react-icons/fa";

import { Separator } from "./dropdown_menu";
import { SYNTAX_ITEMS } from "./transport_constants";
import { formatTooltipWithShortcut, platformShortcut } from "../utils/keyboard_utils";

interface EditorToolsRowProps {
  syntaxInsertHandlers: Array<() => void>;
  syntaxHighlightActive: boolean;
  playbackTrackingActive: boolean;
  colorPanelOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleSyntaxHighlight: VoidFunction;
  onTogglePlaybackTracking: VoidFunction;
  onToggleColorPanel: VoidFunction;
  onUndo: VoidFunction;
  onRedo: VoidFunction;
  onImport: VoidFunction;
  onHelpOpen: VoidFunction;
}

export function EditorToolsRow({
  syntaxInsertHandlers,
  syntaxHighlightActive,
  playbackTrackingActive,
  colorPanelOpen,
  canUndo,
  canRedo,
  onToggleSyntaxHighlight,
  onTogglePlaybackTracking,
  onToggleColorPanel,
  onUndo,
  onRedo,
  onImport,
  onHelpOpen,
}: EditorToolsRowProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 overflow-x-auto border-b border-gray-300 bg-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center gap-1 px-3 py-1">
        <div className="flex items-center gap-0.5">
          {SYNTAX_ITEMS.map((item, index) => (
            <button
              key={item}
              type="button"
              title={t("editor.insertToken", { defaultValue: `Insert "${item}"`, token: item })}
              className="flex h-7 min-w-7 items-center justify-center rounded px-1 font-mono text-sm text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
              onClick={syntaxInsertHandlers[index]}
            >
              {item}
            </button>
          ))}
        </div>

        <Separator />

        <button
          type="button"
          onClick={onToggleSyntaxHighlight}
          title={t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded transition-colors",
            syntaxHighlightActive
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              : "text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
          )}
        >
          <FaCode size={14} />
        </button>
        <button
          type="button"
          onClick={onTogglePlaybackTracking}
          title={t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded transition-colors",
            playbackTrackingActive
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              : "text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
          )}
        >
          <FaCrosshairs size={14} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleColorPanel}
            title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-700",
              colorPanelOpen && "bg-gray-300 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
            )}
          >
            <FaPalette size={15} />
          </button>
        </div>

        <Separator />

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={formatTooltipWithShortcut(
            t("create.undo", { defaultValue: "Undo" }),
            platformShortcut("z"),
          )}
          className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <FaUndo size={14} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={formatTooltipWithShortcut(
            t("create.redo", { defaultValue: "Redo" }),
            platformShortcut("shift+z"),
          )}
          className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-300 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <FaRedo size={14} />
        </button>

        <Separator />

        <button
          type="button"
          onClick={onImport}
          title={formatTooltipWithShortcut(
            t("create.import", { defaultValue: "Import RTTTL" }),
            platformShortcut("i"),
          )}
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
  );
}
