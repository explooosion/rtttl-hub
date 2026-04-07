export type CollectionSlug = "picaxe" | "community";

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
  category?: RtttlCategory;
  createdAt?: string;
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
  const noteChar = trimmed[pos].toLowerCase();
  pos++;

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

export function formatDuration(totalMs: number): string {
  const seconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function getTotalDuration(notes: RtttlNote[]): number {
  return notes.reduce((sum, note) => sum + note.durationMs, 0);
}
