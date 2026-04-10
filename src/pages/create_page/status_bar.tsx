import { useTranslation } from "react-i18next";
import { FaQuestionCircle, FaPlay, FaPause, FaStop } from "react-icons/fa";
import clsx from "clsx";

import { usePlayerStore } from "../../stores/player_store";

interface StatusBarProps {
  hasDraft: boolean;
  focusedTrackIndex: number;
  focusedTrackName: string;
  onHelpOpen: () => void;
}

export function StatusBar({
  hasDraft,
  focusedTrackIndex,
  focusedTrackName,
  onHelpOpen,
}: StatusBarProps) {
  const { t } = useTranslation();
  const playerState = usePlayerStore((s) => s.playerState);

  return (
    <div className="flex h-9 shrink-0 items-center gap-3 border-t border-gray-400 bg-gray-300/80 px-3 dark:border-gray-800 dark:bg-gray-900/80">
      {/* Studio Guide shortcut */}
      <button
        type="button"
        onClick={onHelpOpen}
        title={t("editor.toolbar.helpTitle", { defaultValue: "Studio Guide" })}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-400/30 hover:text-gray-700 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <FaQuestionCircle size={13} />
      </button>

      {/* Draft state */}
      <span
        title={t("create.draftSavedTooltip", {
          defaultValue: "Auto-saved on every change. Restored automatically on next visit.",
        })}
        className={clsx(
          "cursor-default text-xs text-gray-500 transition-opacity dark:text-gray-400",
          hasDraft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {t("create.draftSaved", { defaultValue: "Draft saved" })}
      </span>

      <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />

      {/* Focused track */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Track {focusedTrackIndex + 1} — {focusedTrackName}
      </span>

      {/* Playback state badge — always visible */}
      <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />
      <span
        className={clsx(
          "flex items-center gap-1 text-xs font-medium",
          playerState === "playing"
            ? "text-green-500 dark:text-green-400"
            : playerState === "paused"
              ? "text-amber-500 dark:text-amber-400"
              : "text-gray-400 dark:text-gray-600",
        )}
      >
        {playerState === "playing" ? (
          <FaPlay size={10} />
        ) : playerState === "paused" ? (
          <FaPause size={10} />
        ) : (
          <FaStop size={10} />
        )}
        {playerState === "playing" ? "PLAYING" : playerState === "paused" ? "PAUSED" : "STOPPED"}
      </span>
    </div>
  );
}
