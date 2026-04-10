export type CollectionSlug =
  | "picaxe"
  | "community"
  | "esc-configurator"
  | "skully-rtttl"
  | "esphome";

export type RtttlCategory =
  | "pop"
  | "rock"
  | "classical"
  | "movie-tv"
  | "game"
  | "holiday"
  | "folk"
  | "nursery"
  | "alert"
  | "original";

export interface RtttlEntry {
  id: string;
  artist: string;
  title: string;
  firstLetter: string;
  code: string;
  collection: CollectionSlug;
  sourceCategory?: string;
  categories?: RtttlCategory[];
  createdAt?: string;
  /** Multi-track (polyphonic) RTTTL — one string per motor/voice. */
  tracks?: string[];
}

export interface RtttlDefaults {
  duration: number;
  octave: number;
  bpm: number;
}

export interface RtttlNote {
  frequency: number;
  durationMs: number;
  isRest: boolean;
}

export interface ParsedRtttl {
  name: string;
  defaults: RtttlDefaults;
  notes: RtttlNote[];
}

/** Character range of a single note token within the raw code string. */
export interface NoteOffset {
  from: number;
  to: number;
}

const NOTE_FREQUENCIES: Record<string, number> = {
  c: 261.63,
  "c#": 277.18,
  d: 293.66,
  "d#": 311.13,
  e: 329.63,
  f: 349.23,
  "f#": 369.99,
  g: 392.0,
  "g#": 415.3,
  a: 440.0,
  "a#": 466.16,
  b: 493.88,
};

function noteFrequency(noteName: string, octave: number): number {
  const baseFreq = NOTE_FREQUENCIES[noteName];
  if (!baseFreq) {
    return 0;
  }
  const octaveDiff = octave - 4;
  return baseFreq * Math.pow(2, octaveDiff);
}

function parseDefaults(defaultsStr: string): RtttlDefaults {
  const result: RtttlDefaults = { duration: 4, octave: 6, bpm: 63 };
  const parts = defaultsStr.split(",");
  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "d") {
      result.duration = parseInt(value, 10);
    } else if (key === "o") {
      result.octave = parseInt(value, 10);
    } else if (key === "b") {
      result.bpm = parseInt(value, 10);
    }
  }
  return result;
}

function parseNote(noteStr: string, defaults: RtttlDefaults): RtttlNote | null {
  const trimmed = noteStr.trim();
  if (!trimmed) {
    return null;
  }

  let pos = 0;

  // Parse optional duration
  let duration = defaults.duration;
  let numStr = "";
  while (pos < trimmed.length && /[0-9]/.test(trimmed[pos])) {
    numStr += trimmed[pos];
    pos++;
  }
  if (numStr) {
    duration = parseInt(numStr, 10);
  }

  // Parse note name
  if (pos >= trimmed.length) {
    return null;
  }
  let noteChar = trimmed[pos].toLowerCase();
  pos++;

  // European RTTTL dialect: 'h' = B natural
  if (noteChar === "h") {
    noteChar = "b";
  }

  const isRest = noteChar === "p";

  // Parse optional sharp (# or _)
  let noteName = noteChar;
  if (pos < trimmed.length && (trimmed[pos] === "#" || trimmed[pos] === "_")) {
    noteName += "#";
    pos++;
  }

  // Parse optional dotted note
  let dotted = false;
  if (pos < trimmed.length && trimmed[pos] === ".") {
    dotted = true;
    pos++;
  }

  // Parse optional octave
  let octave = defaults.octave;
  numStr = "";
  while (pos < trimmed.length && /[0-9]/.test(trimmed[pos])) {
    numStr += trimmed[pos];
    pos++;
  }
  if (numStr) {
    octave = parseInt(numStr, 10);
  }

  // Check for trailing dot
  if (pos < trimmed.length && trimmed[pos] === ".") {
    dotted = true;
  }

  // Calculate duration in ms
  const wholeNoteDurationMs = (60000 / defaults.bpm) * 4;
  let durationMs = wholeNoteDurationMs / duration;
  if (dotted) {
    durationMs *= 1.5;
  }

  const frequency = isRest ? 0 : noteFrequency(noteName, octave);

  return { frequency, durationMs, isRest };
}

export function parseRtttl(code: string): ParsedRtttl | null {
  const parts = code.split(":");
  if (parts.length < 3) {
    return null;
  }

  const name = parts[0].trim();
  const defaults = parseDefaults(parts[1]);
  const noteStrings = parts.slice(2).join(":").split(",");

  const notes: RtttlNote[] = [];
  for (const noteStr of noteStrings) {
    const note = parseNote(noteStr, defaults);
    if (note) {
      notes.push(note);
    }
  }

  return { name, defaults, notes };
}

export function getTotalDuration(notes: RtttlNote[]): number {
  return notes.reduce((sum, note) => sum + note.durationMs, 0);
}

/**
 * Returns the character offsets of each note token within the raw RTTTL code string.
 * Used by the playback tracking decoration extension.
 */
export function parseRtttlOffsets(code: string): NoteOffset[] {
  const firstColon = code.indexOf(":");
  if (firstColon === -1) {
    return [];
  }
  const secondColon = code.indexOf(":", firstColon + 1);
  if (secondColon === -1) {
    return [];
  }

  const offsets: NoteOffset[] = [];
  let pos = secondColon + 1;

  while (pos < code.length) {
    while (pos < code.length && code[pos] === " ") {
      pos++;
    }
    if (pos >= code.length) {
      break;
    }
    const tokenStart = pos;
    while (pos < code.length && code[pos] !== ",") {
      pos++;
    }
    let trimEnd = pos;
    while (trimEnd > tokenStart && code[trimEnd - 1] === " ") {
      trimEnd--;
    }
    if (trimEnd > tokenStart) {
      offsets.push({ from: tokenStart, to: trimEnd });
    }
    if (pos < code.length) {
      pos++;
    }
  }

  return offsets;
}

export interface TimedNote {
  startMs: number;
  durationMs: number;
  isRest: boolean;
  noteIndex: number;
}

/**
 * Returns each note with its absolute start time in milliseconds.
 * Used for rendering note blocks on a time-aligned timeline.
 */
export function parseRtttlTimed(code: string): TimedNote[] | null {
  const parsed = parseRtttl(code);
  if (!parsed) {
    return null;
  }
  const result: TimedNote[] = [];
  let t = 0;
  parsed.notes.forEach((note, i) => {
    result.push({ startMs: t, durationMs: note.durationMs, isRest: note.isRest, noteIndex: i });
    t += note.durationMs;
  });
  return result;
}
