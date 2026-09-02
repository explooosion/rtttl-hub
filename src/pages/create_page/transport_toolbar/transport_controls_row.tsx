import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaTimes,
  FaMapMarkerAlt,
  FaBan,
  FaCut,
  FaEraser,
} from "react-icons/fa";

import { Separator } from "./dropdown_menu";
import { usePlayheadStore } from "../../../stores/playhead_store";
import { formatMs } from "../utils/toolbar_utils";
import { formatTooltipWithShortcut } from "../utils/keyboard_utils";

interface TransportControlsRowProps {
  onStop: VoidFunction;
  isPreviewActive: boolean;
  onPlayToggle: VoidFunction;
  hasPlayableContent: boolean;
  playerState: "idle" | "playing" | "paused" | "stopped";
  maxTrackDurationMs: number;
  seekPositionMs: number;
  guideMs: number | null;
  loopInEditing: boolean;
  loopInMs: number | null;
  loopInInputVal: string;
  onSetLoopIn: VoidFunction;
  onLoopInInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopInInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onLoopInInputBlur: VoidFunction;
  onLoopInInputClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  onLoopInValueClick: (e: React.MouseEvent<HTMLSpanElement>) => void;
  loopOutEditing: boolean;
  loopOutMs: number | null;
  loopOutInputVal: string;
  onSetLoopOut: VoidFunction;
  onLoopOutInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopOutInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onLoopOutInputBlur: VoidFunction;
  onLoopOutInputClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  onLoopOutValueClick: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onClearLoop: VoidFunction;
  canCutRegion: boolean;
  onTrimRegion: VoidFunction;
  onDeleteRegion: VoidFunction;
  allTracksMuted: boolean;
  anyTrackMuted: boolean;
  onMuteAll: VoidFunction;
  onUnmuteAll: VoidFunction;
  hasEmptyTracks: boolean;
  onRemoveEmptyTracks: VoidFunction;
}

export function TransportControlsRow({
  onStop,
  isPreviewActive,
  onPlayToggle,
  hasPlayableContent,
  playerState,
  maxTrackDurationMs,
  seekPositionMs,
  guideMs,
  loopInEditing,
  loopInMs,
  loopInInputVal,
  onSetLoopIn,
  onLoopInInputChange,
  onLoopInInputKeyDown,
  onLoopInInputBlur,
  onLoopInInputClick,
  onLoopInValueClick,
  loopOutEditing,
  loopOutMs,
  loopOutInputVal,
  onSetLoopOut,
  onLoopOutInputChange,
  onLoopOutInputKeyDown,
  onLoopOutInputBlur,
  onLoopOutInputClick,
  onLoopOutValueClick,
  onClearLoop,
  canCutRegion,
  onTrimRegion,
  onDeleteRegion,
  allTracksMuted,
  anyTrackMuted,
  onMuteAll,
  onUnmuteAll,
  hasEmptyTracks,
  onRemoveEmptyTracks,
}: TransportControlsRowProps) {
  const { t } = useTranslation();

  const playheadMs = usePlayheadStore((s) => s.playheadMs);
  const displayPositionMs = isPreviewActive ? playheadMs : seekPositionMs;

  return (
    <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/30">
      <div className="flex items-center gap-1 px-3 py-1">
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
              ? formatTooltipWithShortcut(t("player.pause"), "space")
              : playerState === "paused"
                ? formatTooltipWithShortcut(t("player.resume"), "space")
                : formatTooltipWithShortcut(t("player.play"), "space")
          }
        >
          {playerState === "playing" ? <FaPause size={14} /> : <FaPlay size={14} />}
        </button>

        <div className="ml-1 flex items-stretch gap-0 overflow-hidden rounded border border-gray-300 bg-white/90 font-mono shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center px-2.5 py-0.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              pos
            </span>
            <span
              className={clsx(
                "text-sm font-bold tabular-nums leading-none",
                isPreviewActive
                  ? "text-emerald-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {maxTrackDurationMs > 0 ? formatMs(displayPositionMs) : "00:00.000"}
            </span>
          </div>
          <div className="w-px bg-gray-300 dark:bg-gray-700" />
          <div className="flex flex-col items-center justify-center px-2.5 py-0.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              cur
            </span>
            <span className="text-sm font-bold tabular-nums leading-none text-indigo-600 dark:text-indigo-400">
              {guideMs !== null ? formatMs(guideMs) : "--:--.---"}
            </span>
          </div>
        </div>

        <Separator />

        <button
          type="button"
          onClick={loopInEditing ? undefined : onSetLoopIn}
          title={formatTooltipWithShortcut(
            t("create.setLoopIn", { defaultValue: "Set Loop In (A)" }),
            "i",
          )}
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
                onChange={onLoopInInputChange}
                onKeyDown={onLoopInInputKeyDown}
                onBlur={onLoopInInputBlur}
                onClick={onLoopInInputClick}
                className="w-14 border-b border-indigo-400 bg-transparent text-xs font-mono text-indigo-600 outline-none dark:text-indigo-400"
              />
            ) : (
              <span
                className="cursor-text text-xs opacity-70 hover:opacity-100"
                onClick={onLoopInValueClick}
              >
                {(loopInMs / 1000).toFixed(3)}s
              </span>
            ))}
        </button>
        <button
          type="button"
          onClick={loopOutEditing ? undefined : onSetLoopOut}
          title={formatTooltipWithShortcut(
            t("create.setLoopOut", { defaultValue: "Set Loop Out (B)" }),
            "o",
          )}
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
                onChange={onLoopOutInputChange}
                onKeyDown={onLoopOutInputKeyDown}
                onBlur={onLoopOutInputBlur}
                onClick={onLoopOutInputClick}
                className="w-14 border-b border-purple-400 bg-transparent text-xs font-mono text-purple-600 outline-none dark:text-purple-400"
              />
            ) : (
              <span
                className="cursor-text text-xs opacity-70 hover:opacity-100"
                onClick={onLoopOutValueClick}
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
      </div>
    </div>
  );
}
