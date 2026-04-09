import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player_store";
import clsx from "clsx";

/** Format milliseconds as mm:ss.mmm or h:mm:ss.mmm */
function formatMs(ms: number): string {
  const totalSec = ms / 1000;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const sStr = s.toFixed(3).padStart(6, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${sStr}`;
  return `${String(m).padStart(2, "0")}:${sStr}`;
}

interface StatusBarProps {
  hasDraft: boolean;
  focusedTrackIndex: number;
  focusedTrackName: string;
  maxTrackDurationMs: number;
  playheadMs: number;
  seekPositionMs: number;
  guideMs: number | null;
}

export function StatusBar({
  hasDraft,
  focusedTrackIndex,
  focusedTrackName,
  maxTrackDurationMs,
  playheadMs,
  seekPositionMs,
  guideMs,
}: StatusBarProps) {
  const { t } = useTranslation();
  const playerState = usePlayerStore((s) => s.playerState);
  const isActive = playerState === "playing" || playerState === "paused";

  const cursorMs = guideMs;
  const positionMs = isActive ? playheadMs : seekPositionMs;

  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t border-gray-400 bg-gray-300/80 px-3 dark:border-gray-800 dark:bg-gray-900/80">
      {/* Draft state */}
      <span
        className={clsx(
          "flex items-center gap-1.5 text-xs text-amber-500 transition-opacity dark:text-amber-400",
          hasDraft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {t("create.draftSaved", { defaultValue: "Draft saved" })}
      </span>

      <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />

      {/* Focused track */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        <span className="text-gray-400 dark:text-gray-600">Track </span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {focusedTrackIndex + 1} — {focusedTrackName}
        </span>
      </span>

      {/* Total duration */}
      {maxTrackDurationMs > 0 && (
        <>
          <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-600">duration </span>
            {formatMs(maxTrackDurationMs)}
          </span>
        </>
      )}

      {/* Cursor position */}
      {cursorMs !== null && maxTrackDurationMs > 0 && (
        <>
          <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />
          <span className="text-xs tabular-nums text-indigo-500 dark:text-indigo-400">
            <span className="opacity-70">cursor </span>
            {(cursorMs / 1000).toFixed(3)}s
          </span>
        </>
      )}

      {/* Playback / seek position */}
      {(isActive || positionMs > 0) && maxTrackDurationMs > 0 && (
        <>
          <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-600">position </span>
            {(positionMs / 1000).toFixed(3)}s
          </span>
        </>
      )}

      {/* Playback state badge */}
      {isActive && (
        <>
          <span className="h-3 w-px bg-gray-400 dark:bg-gray-700" />
          <span
            className={clsx(
              "text-xs font-medium tabular-nums",
              playerState === "playing"
                ? "text-green-500 dark:text-green-400"
                : "text-amber-500 dark:text-amber-400",
            )}
          >
            {playerState === "playing" ? "▶ PLAYING" : "⏸ PAUSED"}
          </span>
        </>
      )}
    </div>
  );
}
