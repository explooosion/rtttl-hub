import { FaRegCopy, FaCheck, FaChevronDown } from "react-icons/fa";
import clsx from "clsx";
import type { TFunction } from "i18next";

import type { TrackDefaults, TrackStats } from "./shared";

interface TrackSectionProps {
  t: TFunction;
  trackOpen: boolean;
  onToggleTrackSection: () => void;
  focusedTrackName: string;
  onTrackNameInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editableDefaults: TrackDefaults | null;
  focusedTrackIndex: number;
  focusedCode: string;
  onDurationDefaultInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOctaveDefaultInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBpmDefaultInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  trackStats: TrackStats | null;
  copiedTrack: boolean;
  onCopyTrack: () => void;
  sharedBtnClass: string;
}

export function TrackSection({
  t,
  trackOpen,
  onToggleTrackSection,
  focusedTrackName,
  onTrackNameInputChange,
  editableDefaults,
  focusedTrackIndex,
  focusedCode,
  onDurationDefaultInputChange,
  onOctaveDefaultInputChange,
  onBpmDefaultInputChange,
  trackStats,
  copiedTrack,
  onCopyTrack,
  sharedBtnClass,
}: TrackSectionProps) {
  return (
    <div className="border-t border-gray-400 pb-2 dark:border-gray-700">
      <button
        type="button"
        onClick={onToggleTrackSection}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-300/50 dark:hover:bg-gray-800/50"
      >
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.currentTrack", { defaultValue: "Current Track" })}
        </h4>
        <FaChevronDown
          size={10}
          className={clsx(
            "shrink-0 text-gray-400 transition-transform duration-200",
            !trackOpen && "-rotate-90",
          )}
        />
      </button>

      {trackOpen && (
        <div className="space-y-3 px-3 pb-3">
          <div>
            <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("create.trackName", { defaultValue: "Track Name" })}
            </label>
            <input
              type="text"
              value={focusedTrackName}
              onChange={onTrackNameInputChange}
              className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {editableDefaults && (
            <div className="space-y-2">
              <div>
                <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("create.trackDefaultDuration", {
                    defaultValue: "預設時值(d)",
                  })}
                </label>
                <input
                  key={`d-${focusedTrackIndex}-${focusedCode}`}
                  type="number"
                  min={1}
                  max={64}
                  value={editableDefaults.duration}
                  onChange={onDurationDefaultInputChange}
                  className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm font-mono text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("create.trackDefaultOctave", {
                    defaultValue: "預設八度(o)",
                  })}
                </label>
                <input
                  key={`o-${focusedTrackIndex}-${focusedCode}`}
                  type="number"
                  min={1}
                  max={8}
                  value={editableDefaults.octave}
                  onChange={onOctaveDefaultInputChange}
                  className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm font-mono text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("create.trackDefaultBpm", {
                    defaultValue: "BPM速度(b)",
                  })}
                </label>
                <input
                  key={`b-${focusedTrackIndex}-${focusedCode}`}
                  type="number"
                  min={20}
                  max={900}
                  value={editableDefaults.bpm}
                  onChange={onBpmDefaultInputChange}
                  className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm font-mono text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
          )}

          {trackStats ? (
            <dl className="mt-3 space-y-1 border-t border-gray-300 pt-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
              <div className="flex justify-between">
                <dt>{t("create.trackDuration", { defaultValue: "Duration" })}</dt>
                <dd className="font-mono text-gray-800 dark:text-gray-200">
                  {(trackStats.duration / 1000).toFixed(3)}s
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("create.trackNotes", { defaultValue: "Notes" })}</dt>
                <dd className="font-mono text-gray-800 dark:text-gray-200">{trackStats.notes}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("create.trackCodeLength", { defaultValue: "Code length" })}</dt>
                <dd className="font-mono text-gray-800 dark:text-gray-200">
                  {trackStats.codeLength}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 border-t border-gray-300 pt-3 text-sm text-gray-400 dark:border-gray-700">
              —
            </p>
          )}

          <button
            type="button"
            onClick={onCopyTrack}
            disabled={!focusedCode.trim()}
            className={sharedBtnClass}
          >
            {copiedTrack ? (
              <FaCheck size={11} className="text-green-500" />
            ) : (
              <FaRegCopy size={11} />
            )}
            {copiedTrack
              ? t("create.copied", { defaultValue: "Copied!" })
              : t("create.copyCurrentTrack", { defaultValue: "Copy Track" })}
          </button>
        </div>
      )}
    </div>
  );
}
