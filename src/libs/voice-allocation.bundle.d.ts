/**
 * Greedy voice allocation and RTTTL emission for polyphonic MIDI.
 *
 * Standalone MIDI-to-RTTTL algorithm for splitting a polyphonic MIDI
 * arrangement across N monophonic hardware "motor" lanes. This file has
 * **no DOM dependency** — it is plain data-in/data-out logic that can be
 * imported into any JS/TS project (browser or Node) that needs to turn
 * polyphonic MIDI note data into one or more monophonic RTTTL strings.
 *
 * Origin: extracted and cleaned up from the MIDI-to-RTTTL conversion logic
 * of https://beepmyquad.com/, kept here as a standalone, independently
 * testable reference implementation. The project currently enforces the
 * output naming convention `TrackN` in sequential order, so the reference
 * bundle follows the same contract when emitting lane names.
 *
 * Pipeline:
 *   1. {@link allocateVoices} — two-phase greedy interval scheduler that
 *      distributes notes across `N` lanes, with pinned-note support and
 *      lowest-pitch voice-stealing when every lane is busy.
 *   2. {@link pickDuration} — snaps a note length in beats to the closest
 *      valid RTTTL duration by relative error, optionally allowing dotted
 *      notes.
 *   3. {@link emitOutput} — walks one lane in time order and renders it
 *      into a complete RTTTL string.
 *   4. {@link convertMidiNotesToRtttl} — convenience wrapper that runs the
 *      full pipeline (sort → allocate → emit) for all lanes at once.
 *
 * @module voice-allocation
 */
export interface NoteEvent {
  time: number;
  duration: number;
  midi: number;
  track?: number;
  sourceId?: number | string;
  preferredMotor?: number | null;
  pinSeq?: number;
}
export interface AllocationResult {
  lanes: NoteEvent[][];
  displaced: Array<number | string>;
}
export interface PickDurationResult {
  dur: number;
  dotted: boolean;
}
export interface MidiNoteName {
  name: string;
  oct: number;
}
export interface EmitOptions {
  bpm?: number;
  defDur?: number;
  defOct?: number;
  octShift?: number;
  maxNotes?: number;
  allowDotted?: boolean;
  mergeRests?: boolean;
}
export interface EmitResult {
  name: string;
  rtttl: string;
  tokens: number;
  srcNotes: number;
  dropped: number;
  clamped: number;
}
export interface ConvertOptions extends EmitOptions {
  voiceCount?: number;
  trackAffinity?: boolean;
  namePrefix?: string;
}
/** Note names for pitch classes 0-11, RTTTL/lower-case spelling. */
export declare const NOTE_NAMES: string[];
/** Valid RTTTL duration values (denominators of a whole note). */
export declare const VALID_DURATIONS: number[];
/**
 * Distribute polyphonic notes across `voiceCount` monophonic lanes.
 *
 * Notes are placed in two phases:
 *
 * 1. **Pinned notes** — a note with `preferredMotor` set always occupies
 *    that lane. Pins are applied in ascending `pinSeq` order, so the most
 *    recently pinned note evicts any earlier pinned note it overlaps; the
 *    evicted note's `sourceId` is recorded in the result's `displaced`
 *    list.
 * 2. **Greedy allocation** — every other note is placed on any lane free
 *    at its onset. When `trackAffinity` is true, a lane whose last note
 *    came from the same source track is preferred over an arbitrary free
 *    lane. When no lane is free, the note steals the lane holding the
 *    lowest-pitched overlapping note, but only if its own pitch is
 *    strictly higher; otherwise it is dropped silently (it never appears
 *    in any lane).
 */
export declare function allocateVoices(
  notes: NoteEvent[],
  voiceCount: number,
  trackAffinity?: boolean,
): AllocationResult;
/**
 * Snap a note length in beats to the closest RTTTL duration.
 */
export declare function pickDuration(beats: number, allowDotted: boolean): PickDurationResult;
/**
 * Convert a MIDI note number to an RTTTL note name and octave.
 */
export declare function midiToRtttl(midiNote: number): MidiNoteName;
/**
 * Assemble a single RTTTL token, omitting values that match the header defaults.
 */
export declare function fmtToken(
  dur: number,
  note: string,
  oct: number | null,
  dotted: boolean,
  defDur: number,
  defOct: number,
): string;
export declare function emitOutput(lane: NoteEvent[], name: string, opts?: EmitOptions): EmitResult;
/**
 * Run the full pipeline (allocate lanes, then emit each one) in one call.
 */
export declare function convertMidiNotesToRtttl(
  notes: NoteEvent[],
  options?: ConvertOptions,
): {
  outputs: EmitResult[];
  displaced: Array<number | string>;
};
