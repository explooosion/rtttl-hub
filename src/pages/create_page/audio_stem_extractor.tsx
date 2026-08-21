import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaTimes, FaSpinner, FaCheck, FaFileAudio } from "react-icons/fa";
import toast from "react-hot-toast";

import type { StemType, ExtractionResult, TrackResult } from "../../services/audio_extract_service";
import { extractMelody, ALL_STEMS } from "../../services/audio_extract_service";
import { useAuthStore } from "../../stores/auth_store";
import {
  saveAudioRecognition,
  getUserDailyRecognitionCount,
} from "../../services/audio_recognition_service";
import { navigateToLogin } from "../../utils/auth_redirect";
import { AudioWaveformPreview } from "./audio_waveform_preview";

/**
 * Maximum analysis duration in seconds.
 * TODO: This will be configurable per subscription plan.
 * Free users: 30s. Paid plans TBD.
 */
export const MAX_ANALYSIS_DURATION_SEC = 30;

/**
 * Maximum daily free usage count.
 * TODO: This will be configurable per subscription plan.
 */
export const FREE_DAILY_LIMIT = 10;

type ExtractorState = "idle" | "configure" | "processing" | "review";

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
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [state, setState] = useState<ExtractorState>("idle");
    const [audioMeta, setAudioMeta] = useState<AudioMeta | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Configure options
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [selectedStems, setSelectedStems] = useState<StemType[]>(["vocals", "other"]);

    // Processing
    const [processingStatus, setProcessingStatus] = useState("");

    // Results
    const [result, setResult] = useState<ExtractionResult | null>(null);
    const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());

    // Daily usage
    const [dailyUsed, setDailyUsed] = useState<number | null>(null);

    // Load daily usage count when dialog opens
    useEffect(
      function loadDailyUsageOnOpen() {
        if (!open || !user) {
          return;
        }
        void getUserDailyRecognitionCount(user.uid).then(setDailyUsed);
      },
      [open, user],
    );

    const resetState = useCallback(function resetExtractorState() {
      setState("idle");
      setAudioMeta(null);
      setSelectedFile(null);
      setStartTime(0);
      setEndTime(0);
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
        if (!user) {
          navigateToLogin(navigate, location.pathname + location.search);
          return;
        }
        resetState();
        setOpen(true);
      },
    }));

    function handleSelectFileClick() {
      fileInputRef.current?.click();
    }

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

      try {
        const duration = await readAudioDuration(file);
        const rounded = Math.round(duration * 100) / 100;
        setAudioMeta({ name: file.name, sizeBytes: file.size, durationSec: rounded });
        setSelectedFile(file);
        setStartTime(0);
        setEndTime(Math.min(rounded, MAX_ANALYSIS_DURATION_SEC));
        setState("configure");
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
      if (!selectedFile || !audioMeta || !user) {
        return;
      }

      // Check daily limit
      if (dailyUsed !== null && dailyUsed >= FREE_DAILY_LIMIT) {
        toast.error(
          t("audioExtract.dailyLimitReached", {
            defaultValue: "Daily free usage limit reached ({{max}} times/day).",
            max: FREE_DAILY_LIMIT,
          }),
        );
        return;
      }

      const duration = endTime - startTime;
      if (duration > MAX_ANALYSIS_DURATION_SEC) {
        toast.error(
          t("audioExtract.durationExceeded", {
            defaultValue: "The selected time range exceeds the {{max}} second limit.",
            max: MAX_ANALYSIS_DURATION_SEC,
          }),
        );
        return;
      }

      if (startTime >= endTime || startTime < 0 || endTime > audioMeta.durationSec) {
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
          { startTime, endTime, stems: selectedStems },
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

        // Save to Firestore (regardless of import decision)
        try {
          await saveAudioRecognition({
            userId: user.uid,
            fileName: audioMeta.name,
            fileSizeBytes: audioMeta.sizeBytes,
            durationSec: audioMeta.durationSec,
            startTime,
            endTime,
            stems: selectedStems,
            tracks: extractionResult.tracks.map((tr) => ({
              stem: tr.stem,
              rtttl: tr.rtttl,
              noteCount: tr.noteCount,
              bpm: tr.bpm,
              durationSec: tr.durationSec,
              error: tr.error,
            })),
            replicateLogs: extractionResult.logs ?? "",
          });
          setDailyUsed((prev) => (prev !== null ? prev + 1 : 1));
          toast.success(
            t("audioExtract.resultSaved", { defaultValue: "Recognition result saved." }),
          );
        } catch {
          // Silent fail for save — result is still shown
        }
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

    function handleClose() {
      if (state === "processing") {
        return;
      }
      setOpen(false);
      resetState();
    }

    function handleStartTimeInputChange(val: string) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setStartTime(num);
      }
    }

    function handleEndTimeInputChange(val: string) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setEndTime(num);
      }
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

        <Dialog open={open} onClose={handleClose} className="relative z-50">
          <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="flex w-full max-w-3xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("audioExtract.title", { defaultValue: "AI Audio Recognition" })}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  {dailyUsed !== null && (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {t("audioExtract.usageCount", {
                        defaultValue: "{{used}}/{{limit}} uses today",
                        used: dailyUsed,
                        limit: FREE_DAILY_LIMIT,
                      })}
                    </span>
                  )}
                  {state !== "processing" && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <FaTimes size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Idle State — no file selected */}
              {state === "idle" && (
                <div className="px-5 py-6">
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("audioExtract.description", {
                      defaultValue:
                        "Select an audio file to analyze. AI will separate stems, detect melodies, and convert to RTTTL format.",
                    })}
                  </p>

                  {/* File selector */}
                  <button
                    type="button"
                    onClick={handleSelectFileClick}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-8 text-sm font-medium text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                  >
                    <FaFileAudio size={20} />
                    {t("audioExtract.selectAudio", { defaultValue: "Select Audio File" })}
                  </button>

                  <p className="mt-3 text-center text-sm text-gray-400 dark:text-gray-500">
                    MP3, WAV, OGG, FLAC, AAC ·{" "}
                    {t("audioExtract.maxDuration", {
                      defaultValue: "Max analysis duration: {{seconds}}s",
                      seconds: MAX_ANALYSIS_DURATION_SEC,
                    })}
                  </p>
                </div>
              )}

              {/* Configure State */}
              {state === "configure" && audioMeta && selectedFile && (
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

                  {/* Change file button */}
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSelectFileClick}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {t("audioExtract.changeAudio", { defaultValue: "Change Audio" })}
                    </button>
                  </div>

                  {/* Waveform Preview */}
                  <AudioWaveformPreview
                    file={selectedFile}
                    startTime={startTime}
                    endTime={endTime}
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                    durationSec={audioMeta.durationSec}
                  />

                  {/* Time Range Inputs */}
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
                        onChange={(e) => handleStartTimeInputChange(e.target.value)}
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
                        onChange={(e) => handleEndTimeInputChange(e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder={t("audioExtract.endTime", { defaultValue: "End" })}
                      />
                    </div>
                    {endTime - startTime > MAX_ANALYSIS_DURATION_SEC && (
                      <p className="mt-1.5 text-sm text-red-500">
                        {t("audioExtract.durationExceeded", {
                          defaultValue: "The selected time range exceeds the {{max}} second limit.",
                          max: MAX_ANALYSIS_DURATION_SEC,
                        })}
                      </p>
                    )}
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
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("confirm.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={endTime - startTime > MAX_ANALYSIS_DURATION_SEC}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <p className="text-sm text-gray-400 dark:text-gray-500">
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
                  <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
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
                      onClick={handleClose}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("audioExtract.discard", { defaultValue: "Close" })}
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={selectedTracks.size === 0}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("audioExtract.confirmImport", {
                        defaultValue: "Import {{count}} Track(s)",
                        count: selectedTracks.size,
                      })}
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud warning footer */}
              <div className="border-t border-gray-200 px-5 py-2.5 dark:border-gray-700">
                <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
                  {t("audioExtract.cloudWarning", {
                    defaultValue:
                      "This service uses AI cloud computing. Please do not close the window and wait patiently for the result.",
                  })}
                </p>
              </div>
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
