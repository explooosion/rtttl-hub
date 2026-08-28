/**
 * Orchestration layer for local MIDI-to-RTTTL conversion.
 *
 * Unlike {@link ./audio_extract_service}, this never calls a cloud AI
 * model — it parses the MIDI file locally and runs it straight through
 * {@link convertMidiNotesToRtttl}, so it has no usage limit and requires
 * no sign-in.
 */

import type { MidiTrackInfo } from "../utils/midi_parser";
import { parseMidiFile } from "../utils/midi_parser";
import type { ConvertOptions, EmitResult, NoteEvent } from "../libs/voice_allocation";
import { convertMidiNotesToRtttl } from "../libs/voice_allocation";

/** Metadata surfaced right after a MIDI file is parsed, before conversion. */
export interface MidiFileInfo {
  fileName: string;
  ticksPerBeat: number;
  initialBpm: number;
  durationSec: number;
  tracks: MidiTrackInfo[];
  notes: NoteEvent[];
}

/** User-selected conversion parameters, mirroring the "Options" panel. */
export interface MidiConvertParams extends ConvertOptions {
  /** Only notes from these track indices are converted. */
  trackIndices: number[];
  /** Inclusive time window, in seconds. */
  startSec: number;
  endSec: number;
}

/** Result of {@link convertParsedMidi}. */
export interface MidiConvertResult {
  outputs: EmitResult[];
  displaced: (number | string)[];
}

/** Read and parse a `.mid`/`.midi` file into notes and track metadata. */
export async function loadMidiFile(file: File): Promise<MidiFileInfo> {
  const buffer = await file.arrayBuffer();
  const parsed = parseMidiFile(buffer);
  return { fileName: file.name, ...parsed };
}

/**
 * Filter parsed notes to the selected tracks and time window, then run
 * them through {@link convertMidiNotesToRtttl}.
 */
export function convertParsedMidi(
  notes: NoteEvent[],
  params: MidiConvertParams,
): MidiConvertResult {
  const { trackIndices, startSec, endSec, ...convertOptions } = params;
  const trackSet = new Set(trackIndices);
  const filtered = notes.filter(
    (n) => trackSet.has(n.track ?? -1) && n.time >= startSec && n.time <= endSec,
  );
  return convertMidiNotesToRtttl(filtered, convertOptions);
}
