import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaTimes, FaSpinner, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";

import type { StemType, ExtractionResult, TrackResult } from "../../services/audio_extract_service";
import { extractMelody, ALL_STEMS } from "../../services/audio_extract_service";
import { useAuthStore } from "../../stores/auth_store";

// Temporarily restrict feature to this UID only
const ALLOWED_UID = "qWbxM5ugnXPaIxhtsXy5Jfk51uD2";

type ExtractorState = "idle" | "configure" | "processing" | "review";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];

interface AudioMeta {
  name: string;
  sizeBytes: number;
  durationSec: number;
}

export interface AudioStemExtractorHandle {
  trigger: VoidFunction;
}

interface AudioStemExtractorProps {
  onImport: (rtttlList: string[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    function cleanup() {
      URL.revokeObjectURL(url);
    }

    audio.addEventListener("loadedmetadata", () => {
      cleanup();
      if (Number.isFinite(audio.duration)) {
        resolve(audio.duration);
      } else {
        reject(new Error("Unable to read audio duration"));
      }
    });

    audio.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to load audio file"));
    });

    audio.src = url;
  });
}

const STEM_LABELS: Record<StemType, string> = {
  vocals: "Vocals",
  bass: "Bass",
  drums: "Drums",
  other: "Other",
};

export const AudioStemExtractor = forwardRef<AudioStemExtractorHandle, AudioStemExtractorProps>(
  function AudioStemExtractor({ onImport }, ref) {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [state, setState] = useState<ExtractorState>("idle");
    const [audioMeta, setAudioMeta] = useState<AudioMeta | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Configure options
    const [startTime, setStartTime] = useState("0");
    const [endTime, setEndTime] = useState("");
    const [selectedStems, setSelectedStems] = useState<StemType[]>(["vocals", "other"]);

    // Processing
    const [processingStatus, setProcessingStatus] = useState("");

    // Results
    const [result, setResult] = useState<ExtractionResult | null>(null);
    const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());

    const resetState = useCallback(function resetExtractorState() {
      setState("idle");
      setAudioMeta(null);
      setSelectedFile(null);
      setStartTime("0");
      setEndTime("");
      setSelectedStems(["vocals", "other"]);
      setProcessingStatus("");
      setResult(null);
      setSelectedTracks(new Set());
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, []);

    useImperativeHandle(ref, () => ({
      trigger() {
        if (user?.uid !== ALLOWED_UID) {
          toast.error(
            t("audioExtract.accessDenied", {
              defaultValue: "This feature is currently only available to authorized users.",
            }),
          );
          return;
        }
        fileInputRef.current?.click();
      },
    }));

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
        toast.error(
          t("audioExtract.invalidType", {
            defaultValue: "Please select a valid audio file (MP3, WAV, OGG, FLAC, AAC).",
          }),
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          t("audioExtract.fileTooLarge", {
            defaultValue: "File size exceeds {{max}} MB limit.",
            max: MAX_FILE_SIZE_MB,
          }),
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      try {
        const duration = await readAudioDuration(file);
        const rounded = Math.round(duration * 100) / 100;
        setAudioMeta({ name: file.name, sizeBytes: file.size, durationSec: rounded });
        setSelectedFile(file);
        setEndTime(String(rounded));
        setState("configure");
        setOpen(true);
      } catch {
        toast.error(
          t("audioExtract.readError", { defaultValue: "Failed to read audio file metadata." }),
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }

    function toggleStem(stem: StemType) {
      setSelectedStems((prev) => {
        if (prev.includes(stem)) {
          if (prev.length <= 1) {
            return prev;
          }
          return prev.filter((s) => s !== stem);
        }
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, stem];
      });
    }

    async function handleAnalyze() {
      if (!selectedFile || !audioMeta) {
        return;
      }

      const start = parseFloat(startTime) || 0;
      const end = parseFloat(endTime) || audioMeta.durationSec;

      if (start >= end || start < 0 || end > audioMeta.durationSec) {
        toast.error(
          t("audioExtract.invalidRange", {
            defaultValue: "Please enter a valid time range.",
          }),
        );
        return;
      }

      setState("processing");
      setProcessingStatus("starting");
      try {
        const extractionResult = await extractMelody(
          selectedFile,
          { startTime: start, endTime: end, stems: selectedStems },
          (status) => setProcessingStatus(status),
        );
        setResult(extractionResult);
        // Pre-select all tracks that have notes
        const withNotes = new Set<number>();
        extractionResult.tracks.forEach((track, i) => {
          if (track.noteCount > 0) {
            withNotes.add(i);
          }
        });
        setSelectedTracks(withNotes);
        setState("review");
      } catch (err) {
        toast.error(
          t("audioExtract.analyzeError", {
            defaultValue: "Analysis failed. Please try again.",
          }) + (err instanceof Error ? ` (${err.message})` : ""),
        );
        setState("configure");
      }
    }

    function toggleTrackSelection(index: number) {
      setSelectedTracks((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    }

    function handleImportSelected() {
      if (!result) {
        return;
      }
      const rtttlList = result.tracks
        .filter((_, i) => selectedTracks.has(i))
        .filter((track) => track.noteCount > 0)
        .map((track) => track.rtttl);

      if (rtttlList.length === 0) {
        toast.error(
          t("audioExtract.noTracksSelected", {
            defaultValue: "No tracks with notes selected.",
          }),
        );
        return;
      }

      onImport(rtttlList);
      setOpen(false);
      resetState();
      toast.success(
        t("audioExtract.importSuccess", {
          defaultValue: "{{count}} track(s) imported.",
          count: rtttlList.length,
        }),
      );
    }

    function handleDiscard() {
      setOpen(false);
      resetState();
    }

    function handleDialogClose() {
      if (state === "processing") {
        return;
      }
      setOpen(false);
      resetState();
    }

    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac"
          className="hidden"
          onChange={handleFileChange}
        />

        <Dialog open={open} onClose={handleDialogClose} className="relative z-50">
          <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="flex w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("audioExtract.title", { defaultValue: "AI Melody Extractor" })}
                </DialogTitle>
                {state !== "processing" && (
                  <button
                    type="button"
                    onClick={handleDialogClose}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <FaTimes size={16} />
                  </button>
                )}
              </div>

              {/* Configure State */}
              {state === "configure" && audioMeta && (
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  {/* Metadata */}
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-gray-500 dark:text-gray-400">
                        {t("audioExtract.filename", { defaultValue: "Filename" })}
                      </dt>
                      <dd className="truncate font-medium text-gray-900 dark:text-white">
                        {audioMeta.name}
                      </dd>
                      <dt className="text-gray-500 dark:text-gray-400">
                        {t("audioExtract.fileSize", { defaultValue: "File Size" })}
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {formatFileSize(audioMeta.sizeBytes)}
                      </dd>
                      <dt className="text-gray-500 dark:text-gray-400">
                        {t("audioExtract.duration", { defaultValue: "Duration" })}
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {audioMeta.durationSec}s
                      </dd>
                    </dl>
                  </div>

                  {/* Time Range */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t("audioExtract.timeRange", { defaultValue: "Time Range (seconds)" })}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={audioMeta.durationSec}
                        step="0.1"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder={t("audioExtract.startTime", { defaultValue: "Start" })}
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="number"
                        min="0"
                        max={audioMeta.durationSec}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder={t("audioExtract.endTime", { defaultValue: "End" })}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      {t("audioExtract.timeRangeHint", {
                        defaultValue:
                          "Trim audio before uploading. Only the selected range will be sent for analysis.",
                      })}
                    </p>
                  </div>

                  {/* Stem selector (multi-select) */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t("audioExtract.stemLabel", { defaultValue: "Stems to extract (max 4)" })}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_STEMS.map((stem) => (
                        <button
                          key={stem}
                          type="button"
                          onClick={() => toggleStem(stem)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedStems.includes(stem)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                          }`}
                        >
                          {t(`audioExtract.stem_${stem}`, { defaultValue: STEM_LABELS[stem] })}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      {t("audioExtract.stemHint", {
                        defaultValue:
                          "AI will separate audio into selected stems, detect melody from each, and convert to RTTTL.",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("confirm.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {t("audioExtract.analyze", { defaultValue: "Analyze" })}
                    </button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {state === "processing" && (
                <div className="flex flex-col items-center gap-4 px-5 py-10">
                  <FaSpinner size={32} className="animate-spin text-indigo-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t("audioExtract.processing", {
                      defaultValue:
                        "AI is analyzing audio and extracting melody (this may take 1-2 minutes)…",
                    })}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t("audioExtract.processingStatus", {
                      defaultValue: "Status: {{status}}",
                      status: processingStatus,
                    })}
                  </p>
                </div>
              )}

              {/* Review State */}
              {state === "review" && result && (
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                    {t("audioExtract.resultSummary", {
                      defaultValue:
                        "Found {{count}} track(s). Select tracks to import into the editor.",
                      count: result.tracks.length,
                    })}
                  </p>

                  {/* Track list */}
                  <div className="mb-4 space-y-2">
                    {result.tracks.map((track, i) => (
                      <TrackCard
                        key={track.stem}
                        track={track}
                        selected={selectedTracks.has(i)}
                        onToggle={() => toggleTrackSelection(i)}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("audioExtract.discard", { defaultValue: "Discard" })}
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={selectedTracks.size === 0}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("audioExtract.confirmImport", {
                        defaultValue: "Import {{count}} Track(s)",
                        count: selectedTracks.size,
                      })}
                    </button>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </Dialog>
      </>
    );
  },
);

// ---------------------------------------------------------------------------
// TrackCard sub-component
// ---------------------------------------------------------------------------

interface TrackCardProps {
  track: TrackResult;
  selected: boolean;
  onToggle: VoidFunction;
}

function TrackCard({ track, selected, onToggle }: TrackCardProps) {
  const { t } = useTranslation();
  const hasNotes = track.noteCount > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!hasNotes}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        selected && hasNotes
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
      } ${!hasNotes ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
              selected && hasNotes
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {selected && hasNotes && <FaCheck size={10} />}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {t(`audioExtract.stem_${track.stem}`, { defaultValue: STEM_LABELS[track.stem] })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t("audioExtract.noteCount", {
              defaultValue: "{{count}} notes",
              count: track.noteCount,
            })}
          </span>
          <span>BPM: {track.bpm}</span>
          <span>{track.durationSec}s</span>
        </div>
      </div>
      {hasNotes && (
        <div className="mt-2 truncate font-mono text-[10px] text-gray-400 dark:text-gray-500">
          {track.rtttl.length > 120 ? track.rtttl.slice(0, 120) + "…" : track.rtttl}
        </div>
      )}
      {track.error && <p className="mt-1 text-[10px] text-red-500">{track.error}</p>}
    </button>
  );
}
