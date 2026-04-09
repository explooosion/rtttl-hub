import type { RtttlNote } from "./rtttl-parser";

/**
 * Build a cumulative time table for a note array.
 * `result[i]` = sum of durationMs for notes[0..i-1] (i.e. the start time of note i).
 * `result[notes.length]` = total duration.
 */
export function buildCumulativeMs(notes: RtttlNote[]): number[] {
  const cum: number[] = [0];
  let acc = 0;
  for (const n of notes) {
    acc += n.durationMs;
    cum.push(acc);
  }
  return cum;
}

/**
 * Binary-search for the note index that contains `ms` in the cumulative table.
 * Returns the index of the note being played at time `ms`.
 */
export function findNoteIndexAtMs(cumulativeMs: number[], ms: number): number {
  if (cumulativeMs.length <= 1) {
    return 0;
  }
  let lo = 0;
  let hi = cumulativeMs.length - 2; // last valid note index
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if ((cumulativeMs[mid] ?? 0) <= ms) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

/**
 * Convert RTTTL note name to Tone.js pitch format.
 * RTTTL uses frequency; Tone.js prefers note names like "C4", "F#5".
 * Returns null for rests.
 */
export function rtttlNoteToTonePitch(frequency: number, isRest: boolean): string | null {
  if (isRest || frequency <= 0) {
    return null;
  }
  // Convert frequency to MIDI note number, then to Tone.js note name
  const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export interface ScheduledNote {
  /** Absolute start time in seconds from Transport position 0. */
  startSec: number;
  /** Duration in seconds. */
  durationSec: number;
  /** Tone.js pitch string, e.g. "C4". Null for rests. */
  pitch: string | null;
  /** Index within the original notes array. */
  noteIndex: number;
}

/**
 * Convert an array of parsed RTTTL notes into a schedule of
 * (startTime, duration, pitch) suitable for Tone.js Transport events.
 */
export function buildSchedule(notes: RtttlNote[]): ScheduledNote[] {
  const schedule: ScheduledNote[] = [];
  let cursor = 0;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const durationSec = note.durationMs / 1000;
    schedule.push({
      startSec: cursor,
      durationSec,
      pitch: rtttlNoteToTonePitch(note.frequency, note.isRest),
      noteIndex: i,
    });
    cursor += durationSec;
  }
  return schedule;
}
