import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaTimes, FaCheck, FaFileAudio, FaChevronDown, FaChevronUp } from "react-icons/fa";
import toast from "react-hot-toast";

import type { MidiTrackInfo } from "../../utils/midi_parser";
import type { EmitResult, NoteEvent } from "../../libs/voice_allocation";
import { isMidiFile } from "../../utils/is_midi_file";
import { loadMidiFile, convertParsedMidi } from "../../services/midi_import_service";

type ImporterState = "idle" | "configure" | "review";

const DURATION_OPTIONS = [1, 2, 4, 8, 16, 32] as const;
const OCTAVE_OPTIONS = [4, 5, 6, 7] as const;
// Effectively "no limit" by default — a real per-lane note cap would silently
// truncate long songs. Users can still lower this for constrained hardware.
const DEFAULT_MAX_NOTES = 100000;

interface MidiMeta {
  fileName: string;
  ticksPerBeat: number;
  durationSec: number;
  tracks: MidiTrackInfo[];
}

export interface MidiImporterHandle {
  trigger: VoidFunction;
}

interface MidiImporterProps {
  onImport: (rtttlList: string[], fileName: string) => void;
}

export const MidiImporter = forwardRef<MidiImporterHandle, MidiImporterProps>(function MidiImporter(
  { onImport },
  ref,
) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ImporterState>("idle");
  const [meta, setMeta] = useState<MidiMeta | null>(null);
  const [notes, setNotes] = useState<NoteEvent[]>([]);

  // Track selection
  const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());

  // Time window
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // Options
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [outputs, setOutputs] = useState(4);
  const [bpm, setBpm] = useState(120);
  const [defaultDuration, setDefaultDuration] = useState<number>(4);
  const [defaultOctave, setDefaultOctave] = useState<number>(5);
  const [octaveShift, setOctaveShift] = useState(0);
  const [maxNotes, setMaxNotes] = useState(DEFAULT_MAX_NOTES);
  const [maxNotesLocked, setMaxNotesLocked] = useState(false);
  const [namePrefix, setNamePrefix] = useState("midi");
  const [allowDotted, setAllowDotted] = useState(true);
  const [mergeRests, setMergeRests] = useState(true);
  const [trackAffinity, setTrackAffinity] = useState(true);

  // Review results
  const [outputResults, setOutputResults] = useState<EmitResult[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<Set<number>>(new Set());

  const resetState = useCallback(function resetImporterState() {
    setState("idle");
    setMeta(null);
    setNotes([]);
    setSelectedTracks(new Set());
    setStartTime(0);
    setEndTime(0);
    setAdvancedOpen(true);
    setOutputs(4);
    setBpm(120);
    setDefaultDuration(4);
    setDefaultOctave(5);
    setOctaveShift(0);
    setMaxNotes(DEFAULT_MAX_NOTES);
    setMaxNotesLocked(false);
    setNamePrefix("midi");
    setAllowDotted(true);
    setMergeRests(true);
    setTrackAffinity(true);
    setOutputResults([]);
    setSelectedOutputs(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useImperativeHandle(ref, () => ({
    trigger() {
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

    if (!isMidiFile(file)) {
      toast.error(
        t("midiImport.invalidType", {
          defaultValue: "Please select a valid MIDI file (.mid, .midi).",
        }),
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const parsed = await loadMidiFile(file);
      const withNotes = parsed.tracks.filter((tr) => tr.noteCount > 0);
      setMeta({
        fileName: parsed.fileName,
        ticksPerBeat: parsed.ticksPerBeat,
        durationSec: parsed.durationSec,
        tracks: parsed.tracks,
      });
      setNotes(parsed.notes);
      setSelectedTracks(new Set(withNotes.map((tr) => tr.index)));
      setStartTime(0);
      setEndTime(Math.round(parsed.durationSec * 100) / 100);
      setBpm(parsed.initialBpm);
      setState("configure");
    } catch {
      toast.error(t("midiImport.readError", { defaultValue: "Failed to read MIDI file." }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function toggleTrack(index: number) {
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

  function handleSelectAllTracks() {
    if (!meta) {
      return;
    }
    setSelectedTracks(new Set(meta.tracks.filter((tr) => tr.noteCount > 0).map((tr) => tr.index)));
  }

  function handleSelectNoTracks() {
    setSelectedTracks(new Set());
  }

  function handleUseFullSong() {
    if (!meta) {
      return;
    }
    setStartTime(0);
    setEndTime(Math.round(meta.durationSec * 100) / 100);
  }

  function handleConvert() {
    if (!meta) {
      return;
    }
    if (selectedTracks.size === 0) {
      toast.error(t("midiImport.noTracksSelected", { defaultValue: "No tracks selected." }));
      return;
    }

    const { outputs: results } = convertParsedMidi(notes, {
      trackIndices: [...selectedTracks],
      startSec: startTime,
      endSec: endTime,
      voiceCount: outputs,
      trackAffinity,
      bpm,
      defDur: defaultDuration,
      defOct: defaultOctave,
      octShift: octaveShift,
      maxNotes: maxNotesLocked ? 62 : maxNotes,
      allowDotted,
      mergeRests,
      namePrefix,
    });

    if (results.every((r) => r.tokens === 0)) {
      toast.error(
        t("midiImport.noNotesFound", {
          defaultValue: "No notes found in the selected tracks and time range.",
        }),
      );
      return;
    }

    const totalDropped = results.reduce((sum, r) => sum + r.dropped, 0);
    if (totalDropped > 0) {
      toast.error(
        t("midiImport.notesDropped", {
          defaultValue:
            '{{count}} note(s) were dropped because the max notes limit was reached. Increase "Max notes / output" to include them.',
          count: totalDropped,
        }),
      );
    }

    setOutputResults(results);
    setSelectedOutputs(new Set(results.map((_, i) => i).filter((i) => results[i].tokens > 0)));
    setState("review");
  }

  function toggleOutputSelection(index: number) {
    setSelectedOutputs((prev) => {
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
    const rtttlList = outputResults
      .filter((_, i) => selectedOutputs.has(i))
      .filter((out) => out.tokens > 0)
      .map((out) => out.rtttl);

    if (rtttlList.length === 0) {
      toast.error(t("midiImport.noTracksSelected", { defaultValue: "No tracks selected." }));
      return;
    }

    onImport(rtttlList, meta?.fileName ?? "");
    setOpen(false);
    resetState();
    toast.success(
      t("midiImport.importSuccess", {
        defaultValue: "{{count}} track(s) imported.",
        count: rtttlList.length,
      }),
    );
  }

  function handleClose() {
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

  function handleToggleMaxNotesLock(locked: boolean) {
    setMaxNotesLocked(locked);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mid,.midi,audio/midi,audio/mid,audio/x-midi"
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
                {t("midiImport.title", { defaultValue: "Import MIDI" })}
              </DialogTitle>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Idle State — no file selected */}
            {state === "idle" && (
              <div className="px-5 py-6">
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("midiImport.description", {
                    defaultValue: "Select a MIDI file to import as RTTTL tracks.",
                  })}
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {t("midiImport.algorithmCredit", {
                    defaultValue: "Conversion algorithm reference:",
                  })}{" "}
                  <a
                    href="https://beepmyquad.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    beepmyquad.com
                  </a>
                </p>

                <button
                  type="button"
                  onClick={handleSelectFileClick}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-8 text-sm font-medium text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                >
                  <FaFileAudio size={20} />
                  {t("midiImport.selectFile", { defaultValue: "Select MIDI File" })} (.mid, .midi)
                </button>
              </div>
            )}

            {/* Configure State */}
            {state === "configure" && meta && (
              <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                {/* Metadata */}
                <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {meta.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectFileClick}
                    className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {t("midiImport.changeFile", { defaultValue: "Change File" })}
                  </button>
                </div>

                {/* Tracks */}
                <div className="mb-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("midiImport.tracksTitle", { defaultValue: "Tracks" })}
                    </label>
                    <div className="flex gap-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      <button type="button" onClick={handleSelectAllTracks}>
                        {t("midiImport.selectAll", { defaultValue: "Select all" })}
                      </button>
                      <button type="button" onClick={handleSelectNoTracks}>
                        {t("midiImport.selectNone", { defaultValue: "Select none" })}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    {meta.tracks.map((track) => {
                      const hasNotes = track.noteCount > 0;
                      const selected = selectedTracks.has(track.index);
                      return (
                        <button
                          key={track.index}
                          type="button"
                          onClick={() => toggleTrack(track.index)}
                          disabled={!hasNotes}
                          className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                            selected && hasNotes
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-300"
                          } ${!hasNotes ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                                selected && hasNotes
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {selected && hasNotes && <FaCheck size={8} />}
                            </span>
                            <span className="truncate">{track.name}</span>
                          </span>
                          <span className="shrink-0 text-sm text-gray-400 dark:text-gray-500">
                            {t("midiImport.noteCount", {
                              defaultValue: "{{count}} notes",
                              count: track.noteCount,
                            })}
                            {track.channel != null ? ` · ch${track.channel}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Window */}
                <div className="mb-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("midiImport.timeWindowTitle", { defaultValue: "Time Window (seconds)" })}
                    </label>
                    <button
                      type="button"
                      onClick={handleUseFullSong}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {t("midiImport.useFullSong", { defaultValue: "Use full song" })}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={meta.durationSec}
                      step="0.1"
                      value={startTime}
                      onChange={(e) => handleStartTimeInputChange(e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      min="0"
                      max={meta.durationSec}
                      step="0.1"
                      value={endTime}
                      onChange={(e) => handleEndTimeInputChange(e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {t("midiImport.songLength", {
                        defaultValue: "Song length: {{length}}s",
                        length: Math.round(meta.durationSec * 100) / 100,
                      })}
                    </span>
                  </div>
                </div>

                {/* Options (collapsible) */}
                <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    <span>{t("midiImport.optionsTitle", { defaultValue: "Options" })}</span>
                    <span className="flex items-center gap-1">
                      {advancedOpen
                        ? t("midiImport.hideAdvanced", { defaultValue: "Hide advanced options" })
                        : t("midiImport.showAdvanced", { defaultValue: "Show advanced options" })}
                      {advancedOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                    </span>
                  </button>

                  {advancedOpen && (
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-200 p-3 dark:border-gray-700">
                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.outputs", { defaultValue: "Outputs (motors)" })}
                        </span>
                        <select
                          value={outputs}
                          onChange={(e) => setOutputs(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.tempo", { defaultValue: "Tempo (BPM)" })}
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={bpm}
                          onChange={(e) => setBpm(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>

                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.defaultDuration", { defaultValue: "Default duration" })}
                        </span>
                        <select
                          value={defaultDuration}
                          onChange={(e) => setDefaultDuration(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.defaultOctave", { defaultValue: "Default octave" })}
                        </span>
                        <select
                          value={defaultOctave}
                          onChange={(e) => setDefaultOctave(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          {OCTAVE_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.octaveShift", { defaultValue: "Octave shift" })}
                        </span>
                        <input
                          type="number"
                          min="-3"
                          max="3"
                          value={octaveShift}
                          onChange={(e) => setOctaveShift(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>

                      <label className="text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.maxNotes", { defaultValue: "Max notes / output" })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={maxNotesLocked ? 62 : maxNotes}
                            disabled={maxNotesLocked}
                            onChange={(e) => setMaxNotes(Number(e.target.value))}
                            className="w-full min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900 dark:disabled:text-gray-500"
                          />
                          <label className="flex shrink-0 items-center gap-1 text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={maxNotesLocked}
                              onChange={(e) => handleToggleMaxNotesLock(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600"
                            />
                            {t("midiImport.maxNotesEscLimit", { defaultValue: "ESC limit (62)" })}
                          </label>
                        </div>
                      </label>

                      <label className="col-span-2 text-sm">
                        <span className="mb-1 block text-gray-500 dark:text-gray-400">
                          {t("midiImport.namePrefix", { defaultValue: "Name prefix" })}
                        </span>
                        <input
                          type="text"
                          value={namePrefix}
                          onChange={(e) => setNamePrefix(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>

                      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={allowDotted}
                          onChange={(e) => setAllowDotted(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        {t("midiImport.allowDotted", { defaultValue: "Allow dotted notes" })}
                      </label>

                      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={mergeRests}
                          onChange={(e) => setMergeRests(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        {t("midiImport.mergeRests", { defaultValue: "Skip very short rests" })}
                      </label>

                      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={trackAffinity}
                          onChange={(e) => setTrackAffinity(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        {t("midiImport.trackAffinity", {
                          defaultValue: "Prefer track-to-motor affinity",
                        })}
                      </label>
                    </div>
                  )}
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
                    onClick={handleConvert}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {t("midiImport.convert", { defaultValue: "Convert" })}
                  </button>
                </div>
              </div>
            )}

            {/* Review State */}
            {state === "review" && (
              <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                  {t("midiImport.resultSummary", {
                    defaultValue: "Generated {{count}} RTTTL output(s). Select which to import.",
                    count: outputResults.length,
                  })}
                </p>

                <div className="mb-4 space-y-2">
                  {outputResults.map((result, i) => (
                    <OutputCard
                      key={result.name}
                      result={result}
                      selected={selectedOutputs.has(i)}
                      onToggle={() => toggleOutputSelection(i)}
                    />
                  ))}
                </div>

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
                    disabled={selectedOutputs.size === 0}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("midiImport.confirmImport", {
                      defaultValue: "Import {{count}} Track(s)",
                      count: selectedOutputs.size,
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
});

// ---------------------------------------------------------------------------
// OutputCard sub-component
// ---------------------------------------------------------------------------

interface OutputCardProps {
  result: EmitResult;
  selected: boolean;
  onToggle: VoidFunction;
}

function OutputCard({ result, selected, onToggle }: OutputCardProps) {
  const { t } = useTranslation();
  const hasNotes = result.tokens > 0;

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
          <span className="text-sm font-medium text-gray-900 dark:text-white">{result.name}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t("midiImport.noteCount", { defaultValue: "{{count}} notes", count: result.tokens })}
        </span>
      </div>
      <div className="mt-2 truncate font-mono text-sm text-gray-400 dark:text-gray-500">
        {result.rtttl.length > 120 ? result.rtttl.slice(0, 120) + "…" : result.rtttl}
      </div>
      {result.dropped > 0 && (
        <div className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          {t("midiImport.notesDropped", {
            defaultValue:
              '{{count}} note(s) were dropped because the max notes limit was reached. Increase "Max notes / output" to include them.',
            count: result.dropped,
          })}
        </div>
      )}
    </button>
  );
}
