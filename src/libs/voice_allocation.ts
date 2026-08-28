/**
 * Greedy voice allocation and RTTTL emission for polyphonic MIDI.
 *
 * Standalone MIDI-to-RTTTL algorithm for splitting a polyphonic MIDI
 * arrangement across N monophonic hardware "motor" lanes. This file has
 * **no DOM dependency** — it is plain data-in/data-out logic that can be
 * imported into any TS/JS project (browser or Node) that needs to turn
 * polyphonic MIDI note data into one or more monophonic RTTTL strings.
 *
 * Origin: extracted and cleaned up from the MIDI-to-RTTTL conversion logic
 * of https://beepmyquad.com/, kept here as a standalone, independently
 * testable reference implementation (see also the Python port at
 * `src/audio2rtttl/core/voice_allocation.py`).
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
 * @module voice_allocation
 */

/** Note names for pitch classes 0-11, RTTTL/lower-case spelling. */
export const NOTE_NAMES = [
  "c",
  "c#",
  "d",
  "d#",
  "e",
  "f",
  "f#",
  "g",
  "g#",
  "a",
  "a#",
  "b",
] as const;

/** Valid RTTTL duration values (denominators of a whole note). */
export const VALID_DURATIONS = [1, 2, 4, 8, 16, 32] as const;

/** A single note event to be scheduled onto a lane. */
export interface NoteEvent {
  /** Onset time in seconds. */
  time: number;
  /** Length in seconds. */
  duration: number;
  /** MIDI pitch number. */
  midi: number;
  /** Source track index, used for lane affinity. */
  track?: number;
  /** Identifier of the originating note. */
  sourceId?: number | string;
  /** Lane this note is pinned to, or null/undefined to auto-place. */
  preferredMotor?: number | null;
  /** Monotonic pin order; a higher value wins when two pinned notes overlap on the same lane. */
  pinSeq?: number;
}

/** Result of {@link allocateVoices}. */
export interface AllocationResult {
  /** One note list per lane, each sorted by onset time with no overlaps. */
  lanes: NoteEvent[][];
  /** `sourceId`s of pinned notes evicted by a later, overlapping pin. */
  displaced: (number | string)[];
}

const EPSILON = 1e-4;

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
 *
 * @param {NoteEvent[]} notes - Candidate notes, in any order. A sorted copy
 *   (by time ascending, pitch descending) is used internally.
 * @param {number} voiceCount - Number of monophonic lanes to allocate
 *   across.
 * @param {boolean} [trackAffinity=false] - Prefer reusing a lane that just
 *   played the same track over an arbitrary free lane.
 * @returns {AllocationResult} The populated lanes and displaced source ids.
 */
export function allocateVoices(
  notes: NoteEvent[],
  voiceCount: number,
  trackAffinity = false,
): AllocationResult {
  if (voiceCount < 1) {
    throw new Error("voiceCount must be at least 1");
  }

  const ordered = [...notes].sort((a, b) => a.time - b.time || b.midi - a.midi);
  const lanes: NoteEvent[][] = Array.from({ length: voiceCount }, () => []);
  const lastTrack: (number | null)[] = new Array(voiceCount).fill(null);
  const displaced: (number | string)[] = [];

  const overlaps = (laneIndex: number, time: number, duration: number) =>
    lanes[laneIndex].some(
      (n) => n.time + n.duration > time + EPSILON && n.time + EPSILON < time + duration,
    );

  const evictOverlapping = (laneIndex: number, time: number, duration: number) => {
    const kept: NoteEvent[] = [];
    const evicted: NoteEvent[] = [];
    for (const n of lanes[laneIndex]) {
      if (n.time + n.duration > time + EPSILON && n.time + EPSILON < time + duration) {
        evicted.push(n);
      } else {
        kept.push(n);
      }
    }
    lanes[laneIndex] = kept;
    return evicted;
  };

  const place = (laneIndex: number, note: NoteEvent) => {
    lanes[laneIndex].push(note);
    lastTrack[laneIndex] = note.track ?? 0;
  };

  const isPinned = (note: NoteEvent) =>
    note.preferredMotor != null && note.preferredMotor >= 0 && note.preferredMotor < voiceCount;

  // Phase 1: pinned notes always win their lane.
  const pinned = ordered.filter(isPinned).sort((a, b) => (a.pinSeq || 0) - (b.pinSeq || 0));
  for (const note of pinned) {
    for (const evicted of evictOverlapping(
      note.preferredMotor as number,
      note.time,
      note.duration,
    )) {
      if (evicted.sourceId != null) {
        displaced.push(evicted.sourceId);
      }
    }
    place(note.preferredMotor as number, note);
  }

  // Phase 2: greedy allocation with voice stealing.
  for (const note of ordered) {
    if (isPinned(note)) {
      continue;
    }

    const free: number[] = [];
    for (let i = 0; i < voiceCount; i++) {
      if (!overlaps(i, note.time, note.duration)) {
        free.push(i);
      }
    }

    let pick = -1;
    if (free.length) {
      if (trackAffinity) {
        const same = free.find((i) => lastTrack[i] === (note.track ?? 0));
        pick = same !== undefined ? same : free[0];
      } else {
        pick = free[0];
      }
    } else {
      let lowLane = -1;
      let lowPitch = Infinity;
      for (let i = 0; i < voiceCount; i++) {
        for (const existing of lanes[i]) {
          if (
            existing.time + existing.duration > note.time + EPSILON &&
            existing.time + EPSILON < note.time + note.duration
          ) {
            if (existing.midi < lowPitch) {
              lowPitch = existing.midi;
              lowLane = i;
            }
            break;
          }
        }
      }
      if (lowLane === -1 || lowPitch >= note.midi) {
        continue;
      }
      evictOverlapping(lowLane, note.time, note.duration);
      pick = lowLane;
    }

    place(pick, note);
  }

  for (const lane of lanes) {
    lane.sort((a, b) => a.time - b.time);
  }

  return { lanes, displaced };
}

/** Result of {@link pickDuration}. */
export interface PickedDuration {
  dur: number;
  dotted: boolean;
}

/**
 * Snap a note length in beats to the closest RTTTL duration.
 *
 * Every valid RTTTL duration value maps to `4 / value` beats; the value
 * (and, if `allowDotted`, its dotted form at 1.5x length) whose relative
 * error against `beats` is smallest wins.
 *
 * @param beats - Note length expressed in quarter-note beats.
 * @param allowDotted - Whether a dotted duration may be selected.
 */
export function pickDuration(beats: number, allowDotted: boolean): PickedDuration {
  if (beats <= 0) {
    return { dur: 32, dotted: false };
  }
  let best = { dur: 4, dotted: false, err: Infinity };
  for (const d of VALID_DURATIONS) {
    const plain = 4 / d;
    const ePlain = Math.abs(plain - beats) / beats;
    if (ePlain < best.err) {
      best = { dur: d, dotted: false, err: ePlain };
    }
    if (allowDotted) {
      const dot = plain * 1.5;
      const eDot = Math.abs(dot - beats) / beats;
      if (eDot < best.err) {
        best = { dur: d, dotted: true, err: eDot };
      }
    }
  }
  return { dur: best.dur, dotted: best.dotted };
}

/** Result of {@link midiToRtttl}. */
export interface RtttlPitch {
  name: string;
  oct: number;
}

/**
 * Convert a MIDI note number to an RTTTL note name and octave.
 *
 * @param midiNote - MIDI pitch number.
 */
export function midiToRtttl(midiNote: number): RtttlPitch {
  const pc = ((midiNote % 12) + 12) % 12;
  const midiOct = Math.floor(midiNote / 12) - 1;
  return { name: NOTE_NAMES[pc], oct: midiOct + 1 };
}

/**
 * Assemble a single RTTTL token, omitting values that match the header
 * defaults.
 *
 * Token order is `[duration][note][octave][.]` (dot last), matching the
 * Python port (`core/voice_allocation.py`) and the project's main RTTTL
 * renderer (`core/rtttl.py`'s `_render`), so both extractions produce
 * byte-identical output for the same input.
 *
 * @param dur - RTTTL duration value.
 * @param note - Note name ("p" for a rest).
 * @param oct - Octave, or null for a rest.
 * @param dotted - Whether the duration is dotted.
 * @param defDur - Header default duration.
 * @param defOct - Header default octave.
 */
export function fmtToken(
  dur: number,
  note: string,
  oct: number | null,
  dotted: boolean,
  defDur: number,
  defOct: number,
): string {
  let s = "";
  if (dur !== defDur) {
    s += dur;
  }
  s += note;
  if (oct != null && oct !== defOct) {
    s += oct;
  }
  if (dotted) {
    s += ".";
  }
  return s;
}

/** Options for {@link emitOutput}. */
export interface EmitOptions {
  /** Tempo in beats (quarter notes) per minute. */
  bpm: number;
  /** Header default duration. */
  defDur: number;
  /** Header default octave. */
  defOct: number;
  /** Whole octaves to transpose every note by before clamping (positive raises pitch). */
  octShift?: number;
  /** Maximum number of tokens to emit; extra events are counted in `dropped` instead of appended. */
  maxNotes?: number;
  /** Whether dotted durations may be emitted. */
  allowDotted?: boolean;
  /** Suppress rests shorter than a 64th note at the given tempo. */
  mergeRests?: boolean;
}

/** Result of {@link emitOutput}. */
export interface EmitResult {
  /** Track name used in the RTTTL header. */
  name: string;
  /** The complete RTTTL string. */
  rtttl: string;
  /** Number of tokens (notes and rests) emitted. */
  tokens: number;
  /** Number of source notes the lane contained. */
  srcNotes: number;
  /** Notes/rests dropped because `maxNotes` was reached. */
  dropped: number;
  /** Notes whose octave was clamped into the playable [4, 7] range. */
  clamped: number;
}

interface EmitEvent {
  rest: boolean;
  sec: number;
  midi?: number;
}

/**
 * Render one allocated lane into a complete, self-contained RTTTL string.
 *
 * The lane is walked in time order; any gap longer than 0.01s becomes a
 * rest token unless `mergeRests` suppresses gaps shorter than a 64th note.
 * Every event's length is quantized with {@link pickDuration}, and each
 * note's octave is clamped into `[4, 7]` before rendering.
 *
 * @param lane - Notes for a single voice, in onset order.
 * @param name - Track name for the RTTTL header.
 * @param opts
 */
export function emitOutput(lane: NoteEvent[], name: string, opts: EmitOptions): EmitResult {
  const {
    bpm,
    defDur,
    defOct,
    octShift = 0,
    maxNotes = Infinity,
    allowDotted = false,
    mergeRests = true,
  } = opts;
  const secPerBeat = 60 / bpm;

  const events: EmitEvent[] = [];
  let cursor = 0;
  for (const n of lane) {
    const rest = n.time - cursor;
    if (rest > 0.01 && !(mergeRests && rest < secPerBeat / 16)) {
      events.push({ rest: true, sec: rest });
    }
    events.push({ rest: false, sec: n.duration, midi: n.midi });
    cursor = n.time + n.duration;
  }

  const tokens: string[] = [];
  let dropped = 0;
  let clamped = 0;
  for (const ev of events) {
    if (tokens.length >= maxNotes) {
      dropped++;
      continue;
    }
    const { dur, dotted } = pickDuration(ev.sec / secPerBeat, allowDotted);
    if (ev.rest) {
      tokens.push(fmtToken(dur, "p", null, dotted, defDur, defOct));
    } else {
      const pitch = midiToRtttl((ev.midi as number) + octShift * 12);
      let oct = pitch.oct;
      if (oct < 4) {
        oct = 4;
        clamped++;
      }
      if (oct > 7) {
        oct = 7;
        clamped++;
      }
      tokens.push(fmtToken(dur, pitch.name, oct, dotted, defDur, defOct));
    }
  }
  while (tokens.length && /p/.test(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  const rtttl = `${name}:d=${defDur},o=${defOct},b=${bpm}:${tokens.join(",")}`;
  return {
    name,
    rtttl,
    tokens: tokens.length,
    srcNotes: lane.length,
    dropped,
    clamped,
  };
}

/** Options for {@link convertMidiNotesToRtttl}. */
export interface ConvertOptions extends Omit<EmitOptions, "defDur" | "defOct"> {
  /** Number of monophonic lanes. */
  voiceCount?: number;
  /** See {@link allocateVoices}. */
  trackAffinity?: boolean;
  defDur?: number;
  defOct?: number;
  /** Base name; lane index is appended when `voiceCount > 1` (e.g. "midi1", "midi2", ...). */
  namePrefix?: string;
}

/** Result of {@link convertMidiNotesToRtttl}. */
export interface ConvertResult {
  outputs: EmitResult[];
  displaced: (number | string)[];
}

/**
 * Run the full pipeline (allocate lanes, then emit each one) in one call.
 *
 * Convenience wrapper around {@link allocateVoices} + {@link emitOutput}
 * for callers that just want RTTTL strings out of a flat note list.
 */
export function convertMidiNotesToRtttl(
  notes: NoteEvent[],
  options: ConvertOptions,
): ConvertResult {
  const {
    voiceCount = 1,
    trackAffinity = false,
    namePrefix = "midi",
    defDur = 4,
    defOct = 5,
    ...emitOpts
  } = options;

  const { lanes, displaced } = allocateVoices(notes, voiceCount, trackAffinity);
  const outputs = lanes.map((lane, i) => {
    const name = voiceCount === 1 ? namePrefix : `${namePrefix}${i + 1}`;
    return emitOutput(lane, name, { ...emitOpts, defDur, defOct });
  });

  return { outputs, displaced };
}

// ---------------------------------------------------------------------------
// Example usage (not executed):
//
//   import { convertMidiNotesToRtttl } from "./voice_allocation";
//
//   const notes: NoteEvent[] = [
//     { time: 0.0, duration: 0.5, midi: 60, track: 0, sourceId: 1 },
//     { time: 0.0, duration: 0.5, midi: 67, track: 0, sourceId: 2 },
//   ];
//   const { outputs } = convertMidiNotesToRtttl(notes, {
//     voiceCount: 2,
//     bpm: 120,
//     defDur: 4,
//     defOct: 5,
//   });
//   for (const out of outputs) console.log(out.rtttl);
// ---------------------------------------------------------------------------
