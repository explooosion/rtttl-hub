import { useTranslation } from "react-i18next";
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaVolumeMute,
  FaVolumeUp,
  FaClone,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import clsx from "clsx";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

interface TrackHeaderPanelProps {
  listeners: DraggableSyntheticListeners | undefined;
  trackColor: string;
  colorInputRef: React.RefObject<HTMLInputElement | null>;
  onTrackColorInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTrackColorButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStopPropagation: (e: React.MouseEvent) => void;
  isEditingName: boolean;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  draftName: string;
  nameError: string | null;
  onNameInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameInputBlur: () => void;
  onNameInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onNameClick: (e: React.MouseEvent) => void;
  trackName: string;
  isExpanded: boolean;
  onExpandButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isMuted: boolean;
  onMuteButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  canDuplicate: boolean;
  duplicateTooltip: string;
  onDuplicateButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDeactivated: boolean;
  onDeactivateButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  canRemove: boolean;
  removeTooltip: string;
  onRemoveButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  canSoloPlay: boolean;
  isSoloPlaying: boolean;
  onSoloPlayToggleClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function TrackHeaderPanel({
  listeners,
  trackColor,
  colorInputRef,
  onTrackColorInputChange,
  onTrackColorButtonClick,
  onStopPropagation,
  isEditingName,
  nameInputRef,
  draftName,
  nameError,
  onNameInputChange,
  onNameInputBlur,
  onNameInputKeyDown,
  onNameClick,
  trackName,
  isExpanded,
  onExpandButtonClick,
  isMuted,
  onMuteButtonClick,
  canDuplicate,
  duplicateTooltip,
  onDuplicateButtonClick,
  isDeactivated,
  onDeactivateButtonClick,
  canRemove,
  removeTooltip,
  onRemoveButtonClick,
  canSoloPlay,
  isSoloPlaying,
  onSoloPlayToggleClick,
}: TrackHeaderPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky left-0 z-10 flex w-48 shrink-0 flex-col justify-between border-r border-gray-400 bg-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...listeners}
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-700 dark:hover:text-gray-400"
          onClick={onStopPropagation}
          title="Drag to reorder"
        >
          <FaGripVertical size={11} />
        </button>

        <button
          type="button"
          title={t("create.changeTrackColor", { defaultValue: "Change track color" })}
          onClick={onTrackColorButtonClick}
          className="relative inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-offset-1 hover:ring-2 hover:ring-white/60 focus:outline-none"
          style={{ backgroundColor: trackColor }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={trackColor}
            onChange={onTrackColorInputChange}
            onClick={onStopPropagation}
            className="invisible absolute h-0 w-0"
            tabIndex={-1}
          />
        </button>

        {isEditingName ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <input
              ref={nameInputRef}
              value={draftName}
              onChange={onNameInputChange}
              onBlur={onNameInputBlur}
              onKeyDown={onNameInputKeyDown}
              onClick={onStopPropagation}
              className={clsx(
                "min-w-0 rounded bg-transparent px-0.5 text-xs font-semibold tracking-wide outline-none ring-1 ring-inset",
                nameError
                  ? "text-red-600 ring-red-400 dark:text-red-400 dark:ring-red-500"
                  : "text-gray-700 ring-indigo-400 dark:text-gray-300",
              )}
              maxLength={30}
            />
            {nameError && (
              <span className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">
                {t(`editor.${nameError}`)}
              </span>
            )}
          </div>
        ) : (
          <span
            className="min-w-0 flex-1 cursor-text truncate text-xs font-semibold tracking-wide text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
            onClick={onNameClick}
            title={t("editor.clickToRename", { defaultValue: "Click to rename" })}
          >
            {trackName}
          </span>
        )}

        <button
          type="button"
          onClick={onExpandButtonClick}
          title={isExpanded ? "Collapse" : "Expand"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {isExpanded ? <FaChevronDown size={9} /> : <FaChevronRight size={9} />}
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1 border-t border-gray-300 pt-1.5 dark:border-gray-700">
        <button
          type="button"
          onClick={onMuteButtonClick}
          title={isMuted ? "Unmute" : "Mute"}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded border text-[10px] font-bold transition-colors",
            isMuted
              ? "border-amber-400 bg-amber-400/20 text-amber-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-amber-500 dark:text-amber-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
              : "border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400",
          )}
        >
          {isMuted ? <FaVolumeMute size={11} /> : <FaVolumeUp size={11} />}
        </button>

        <span title={duplicateTooltip} className="inline-flex">
          <button
            type="button"
            onClick={onDuplicateButtonClick}
            disabled={!canDuplicate}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <FaClone size={11} />
          </button>
        </span>

        <button
          type="button"
          onClick={onDeactivateButtonClick}
          title={
            isDeactivated
              ? t("create.activateTrack", { defaultValue: "Activate Track" })
              : t("create.deactivateTrack", { defaultValue: "Deactivate Track" })
          }
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded border transition-colors",
            isDeactivated
              ? "border-gray-500 bg-gray-300/40 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-500 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
              : "border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400",
          )}
        >
          {isDeactivated ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
        </button>

        <span title={removeTooltip} className="inline-flex">
          <button
            type="button"
            onClick={onRemoveButtonClick}
            disabled={!canRemove}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <FaTrash size={11} />
          </button>
        </span>

        <span
          title={
            canSoloPlay
              ? isSoloPlaying
                ? t("player.stop", { defaultValue: "Stop" })
                : t("player.play", { defaultValue: "Play" })
              : t("editor.placeholder", { defaultValue: "Enter RTTTL code…" })
          }
          className="inline-flex"
        >
          <button
            type="button"
            onClick={onSoloPlayToggleClick}
            disabled={!canSoloPlay}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded border transition-colors",
              isSoloPlaying
                ? "border-red-400 text-red-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-red-700 dark:text-red-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                : "border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400",
              !canSoloPlay &&
                "cursor-not-allowed border-gray-300 text-gray-300 opacity-40 dark:border-gray-700 dark:text-gray-600",
            )}
          >
            {isSoloPlaying ? <FaStop size={10} /> : <FaPlay size={10} />}
          </button>
        </span>
      </div>
    </div>
  );
}
