import { useTranslation } from "react-i18next";
import { FaPlay, FaPause, FaStop, FaRegCopy, FaCheck } from "react-icons/fa";
import clsx from "clsx";

interface PlaybackControlsProps {
  displayedCode: string;
  playerState: "idle" | "playing" | "paused" | "stopped";
  copyState: "idle" | "copied" | "failed";
  onPlayPauseToggle: () => void;
  onStop: () => void;
  onCopy: () => void;
}

export function PlaybackControls({
  displayedCode,
  playerState,
  copyState,
  onPlayPauseToggle,
  onStop,
  onCopy,
}: PlaybackControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={onPlayPauseToggle}
        disabled={!displayedCode.trim() && playerState === "idle"}
        className={clsx(
          "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white",
          playerState === "playing"
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-emerald-600 hover:bg-emerald-700",
          !displayedCode.trim() && playerState === "idle" && "cursor-not-allowed opacity-50",
        )}
      >
        {playerState === "playing" ? (
          <>
            <FaPause size={16} />
            {t("player.pause")}
          </>
        ) : playerState === "paused" ? (
          <>
            <FaPlay size={16} />
            {t("player.resume")}
          </>
        ) : (
          <>
            <FaPlay size={16} />
            {t("player.play")}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onStop}
        disabled={playerState !== "playing" && playerState !== "paused"}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <FaStop size={16} />
        {t("player.stop")}
      </button>

      <button
        type="button"
        onClick={onCopy}
        disabled={!displayedCode.trim()}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {copyState === "copied" ? (
          <>
            <FaCheck size={14} className="text-green-500" />
            {t("editor.copied", { defaultValue: "Copied!" })}
          </>
        ) : (
          <>
            <FaRegCopy size={14} />
            {t("editor.copyCode", { defaultValue: "Copy" })}
          </>
        )}
      </button>
    </div>
  );
}
