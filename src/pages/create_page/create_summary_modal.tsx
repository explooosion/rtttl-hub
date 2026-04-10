import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import type { RtttlCategory } from "../../utils/rtttl_parser";
import { parseRtttl, getTotalDuration } from "../../utils/rtttl_parser";
import { useEditorSettingsStore } from "../../stores/editor_settings_store";
import { CodeEditor } from "../../components/rtttl_editor/code_editor";

interface CreateSummaryModalProps {
  isOpen: boolean;
  name: string;
  categories: RtttlCategory[];
  tracks: string[];
  onConfirm: () => void;
  onCancel: () => void;
  onNameChange?: (value: string) => void;
  onRenameTrack?: (trackIndex: number, newName: string) => void;
}

interface TrackSummary {
  name: string;
  code: string;
  originalIndex: number;
  duration: number;
  bpm: number;
  notes: number;
  octave: number;
  codeLength: number;
}

export function CreateSummaryModal({
  isOpen,
  name,
  categories,
  tracks,
  onConfirm,
  onCancel,
  onNameChange,
  onRenameTrack,
}: CreateSummaryModalProps) {
  const { t } = useTranslation();
  const syntaxHighlight = useEditorSettingsStore((s) => s.features.syntaxHighlight);
  const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);

  const trackSummaries = useMemo<TrackSummary[]>(() => {
    return tracks
      .map((code, originalIndex) => ({ code, originalIndex }))
      .filter(({ code }) => code.trim().length > 0)
      .map(({ code, originalIndex }, i) => {
        const colonIdx = code.indexOf(":");
        const trackName =
          colonIdx > 0 ? code.slice(0, colonIdx).trim() || `Track ${i + 1}` : `Track ${i + 1}`;
        const parsed = parseRtttl(code.trim());
        if (!parsed) {
          return {
            name: trackName,
            code,
            originalIndex,
            duration: 0,
            bpm: 0,
            notes: 0,
            octave: 0,
            codeLength: code.length,
          };
        }
        return {
          name: trackName,
          code,
          originalIndex,
          duration: getTotalDuration(parsed.notes),
          bpm: parsed.defaults.bpm,
          notes: parsed.notes.length,
          octave: parsed.defaults.octave,
          codeLength: code.length,
        };
      });
  }, [tracks]);

  const totalDurationMs = useMemo(
    () => trackSummaries.reduce((sum, tk) => sum + tk.duration, 0),
    [trackSummaries],
  );

  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("create.summaryTitle", { defaultValue: "Review & Create" })}
            </DialogTitle>
            <button
              onClick={onCancel}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label={t("confirm.cancel")}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Project summary */}
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("create.project", { defaultValue: "Project" })}
              </h3>
              <dl className="grid grid-cols-3 gap-x-4 rounded-lg border border-gray-200 bg-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="col-span-2 flex flex-col gap-3">
                  <div className="flex flex-col">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">{t("create.name")}</dt>
                    <dd className="min-w-0">
                      {onNameChange ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => onNameChange(e.target.value)}
                          className="w-full rounded border-0 bg-transparent px-0 py-0.5 text-sm font-medium text-gray-900 outline-none hover:bg-black/5 focus:bg-black/5 dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                      )}
                    </dd>
                  </div>
                  {categories.length > 0 && (
                    <div className="flex flex-col">
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        {t("create.category")}
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {categories.map((c) => t(`categories.${c}`)).join(", ")}
                      </dd>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("create.summaryTotalTracks", { defaultValue: "Total Tracks" })}
                    </dt>
                    <dd className="font-mono font-medium text-gray-900 dark:text-white">
                      {trackSummaries.length}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("create.summaryTotalDuration", { defaultValue: "Total Duration" })}
                    </dt>
                    <dd className="font-mono font-medium text-gray-900 dark:text-white">
                      {(totalDurationMs / 1000).toFixed(3)}s
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            {/* Per-track details */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("create.multiTrack")}
              </h3>
              <div className="space-y-4">
                {trackSummaries.map((tk, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="border-b border-gray-200 bg-gray-200 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                      {onRenameTrack ? (
                        <input
                          type="text"
                          value={tk.name}
                          onChange={(e) => onRenameTrack(tk.originalIndex, e.target.value)}
                          className="w-full rounded border-0 bg-transparent px-2 py-0.5 text-sm font-semibold text-gray-800 outline-none hover:bg-black/5 focus:bg-black/5 dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10"
                        />
                      ) : (
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                          {tk.name}
                        </h4>
                      )}
                    </div>
                    <div className="px-4 pb-4 pt-2">
                      <dl className="mb-3 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                        <div className="flex flex-col">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            {t("create.trackDuration", { defaultValue: "Duration" })}
                          </dt>
                          <dd className="font-mono text-gray-900 dark:text-white">
                            {(tk.duration / 1000).toFixed(3)}s
                          </dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            {t("create.trackBpm", { defaultValue: "BPM" })}
                          </dt>
                          <dd className="font-mono text-gray-900 dark:text-white">{tk.bpm}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            {t("create.trackNotes", { defaultValue: "Notes" })}
                          </dt>
                          <dd className="font-mono text-gray-900 dark:text-white">{tk.notes}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            {t("create.trackOctave", { defaultValue: "Octave" })}
                          </dt>
                          <dd className="font-mono text-gray-900 dark:text-white">{tk.octave}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            {t("create.trackCodeLength", { defaultValue: "Code Length" })}
                          </dt>
                          <dd className="font-mono text-gray-900 dark:text-white">
                            {tk.codeLength}
                          </dd>
                        </div>
                      </dl>
                      <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                        <CodeEditor
                          value={tk.code}
                          syntaxHighlight={syntaxHighlight}
                          playbackTracking={false}
                          syntaxColors={syntaxColors}
                          currentNoteIndex={-1}
                          playerState="idle"
                          readOnly
                          maxHeight="120px"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("create.create")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
