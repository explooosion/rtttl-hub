/**
 * Minimal Standard MIDI File (SMF) reader.
 *
 * Parses the raw bytes of a `.mid`/`.midi` file into a flat list of note
 * events (in seconds) plus per-track metadata, ready to be fed into
 * {@link import("../libs/voice_allocation").convertMidiNotesToRtttl}.
 *
 * Supports SMF format 0 and 1 (format 2 tracks are parsed independently,
 * which is usually fine since they don't share a timeline). Only the
 * tick-based division format is supported; SMPTE-based files throw.
 */

import type { NoteEvent } from "../libs/voice_allocation";

/** Per-track metadata surfaced for track-selection UI. */
export interface MidiTrackInfo {
  /** Index of this track within the file (0-based). */
  index: number;
  /** Track name from a Track Name meta event, or a fallback like "Track 1". */
  name: string;
  /** MIDI channel used by this track's notes, or null if it has none. */
  channel: number | null;
  /** Number of notes found in this track. */
  noteCount: number;
}

/** Result of {@link parseMidiFile}. */
export interface ParsedMidi {
  /** Ticks per quarter note (division). */
  ticksPerBeat: number;
  /** Tempo in BPM taken from the first Set Tempo event, or 120 if none. */
  initialBpm: number;
  /** Total song length in seconds (end of the last note). */
  durationSec: number;
  /** Per-track metadata, in file order. */
  tracks: MidiTrackInfo[];
  /** All notes across all tracks, with absolute onset time in seconds. */
  notes: NoteEvent[];
}

class ByteReader {
  private pos = 0;
  private readonly view: DataView;

  constructor(view: DataView) {
    this.view = view;
  }

  get position() {
    return this.pos;
  }

  get length() {
    return this.view.byteLength;
  }

  hasMore(count = 1): boolean {
    return this.pos + count <= this.view.byteLength;
  }

  readUint8(): number {
    const v = this.view.getUint8(this.pos);
    this.pos += 1;
    return v;
  }

  readUint16(): number {
    const v = this.view.getUint16(this.pos);
    this.pos += 2;
    return v;
  }

  readUint32(): number {
    const v = this.view.getUint32(this.pos);
    this.pos += 4;
    return v;
  }

  readAscii(count: number): string {
    let s = "";
    for (let i = 0; i < count; i++) {
      s += String.fromCharCode(this.readUint8());
    }
    return s;
  }

  readBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, count);
    this.pos += count;
    return bytes;
  }

  skip(count: number): void {
    this.pos += count;
  }

  /** Reads a variable-length quantity (used for delta-times and meta/sysex lengths). */
  readVarLength(): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      const byte = this.readUint8();
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        break;
      }
    }
    return value >>> 0;
  }
}

interface RawNoteOnEvent {
  tick: number;
  channel: number;
  pitch: number;
  velocity: number;
}

interface RawTempoEvent {
  tick: number;
  microsecondsPerQuarter: number;
}

interface RawTrack {
  name: string;
  noteOns: RawNoteOnEvent[];
  noteOffs: { tick: number; channel: number; pitch: number }[];
  tempoEvents: RawTempoEvent[];
}

const META_EVENT = 0xff;
const META_TRACK_NAME = 0x03;
const META_INSTRUMENT_NAME = 0x04;
const META_SET_TEMPO = 0x51;
const META_END_OF_TRACK = 0x2f;
const SYSEX_START = 0xf0;
const SYSEX_ESCAPE = 0xf7;
const DEFAULT_MICROSECONDS_PER_QUARTER = 500000; // 120 BPM

function parseTrackChunk(reader: ByteReader, byteLength: number): RawTrack {
  const trackEnd = reader.position + byteLength;
  const noteOns: RawNoteOnEvent[] = [];
  const noteOffs: { tick: number; channel: number; pitch: number }[] = [];
  const tempoEvents: RawTempoEvent[] = [];
  let name = "";
  let tick = 0;
  let runningStatus = 0;

  while (reader.position < trackEnd) {
    tick += reader.readVarLength();
    let statusByte = reader.readUint8();

    if (statusByte < 0x80) {
      // Running status: this byte is actually the first data byte.
      reader.skip(-1);
      statusByte = runningStatus;
    } else {
      runningStatus = statusByte;
    }

    if (statusByte === META_EVENT) {
      const metaType = reader.readUint8();
      const length = reader.readVarLength();
      if (metaType === META_TRACK_NAME || metaType === META_INSTRUMENT_NAME) {
        const text = reader.readAscii(length);
        if (metaType === META_TRACK_NAME || !name) {
          name = text.trim();
        }
      } else if (metaType === META_SET_TEMPO && length === 3) {
        const b0 = reader.readUint8();
        const b1 = reader.readUint8();
        const b2 = reader.readUint8();
        tempoEvents.push({ tick, microsecondsPerQuarter: (b0 << 16) | (b1 << 8) | b2 });
      } else if (metaType === META_END_OF_TRACK) {
        // no-op
      } else {
        reader.skip(length);
      }
    } else if (statusByte === SYSEX_START || statusByte === SYSEX_ESCAPE) {
      const length = reader.readVarLength();
      reader.skip(length);
    } else {
      const type = statusByte & 0xf0;
      const channel = statusByte & 0x0f;
      switch (type) {
        case 0x80: {
          const pitch = reader.readUint8();
          reader.readUint8(); // velocity (unused for note off)
          noteOffs.push({ tick, channel, pitch });
          break;
        }
        case 0x90: {
          const pitch = reader.readUint8();
          const velocity = reader.readUint8();
          if (velocity === 0) {
            noteOffs.push({ tick, channel, pitch });
          } else {
            noteOns.push({ tick, channel, pitch, velocity });
          }
          break;
        }
        case 0xa0: // polyphonic aftertouch
        case 0xb0: // control change
        case 0xe0: // pitch bend
          reader.skip(2);
          break;
        case 0xc0: // program change
        case 0xd0: // channel aftertouch
          reader.skip(1);
          break;
        default:
          // Unknown status byte; bail out of this track to avoid an infinite loop.
          reader.skip(trackEnd - reader.position);
          break;
      }
    }
  }

  return { name, noteOns, noteOffs, tempoEvents };
}

/** Builds a tick -> seconds converter from a sorted, deduplicated tempo map. */
function buildTickToSeconds(tempoMap: RawTempoEvent[], ticksPerBeat: number) {
  const sorted = [...tempoMap].sort((a, b) => a.tick - b.tick);
  if (sorted.length === 0 || sorted[0].tick !== 0) {
    sorted.unshift({ tick: 0, microsecondsPerQuarter: DEFAULT_MICROSECONDS_PER_QUARTER });
  }

  // Precompute the elapsed seconds at the start of each tempo segment.
  const segmentStartSec: number[] = [0];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const deltaTicks = sorted[i].tick - prev.tick;
    const secPerTick = prev.microsecondsPerQuarter / 1_000_000 / ticksPerBeat;
    segmentStartSec.push(segmentStartSec[i - 1] + deltaTicks * secPerTick);
  }

  return function tickToSeconds(tick: number): number {
    let segment = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (tick >= sorted[i].tick) {
        segment = i;
        break;
      }
    }
    const secPerTick = sorted[segment].microsecondsPerQuarter / 1_000_000 / ticksPerBeat;
    return segmentStartSec[segment] + (tick - sorted[segment].tick) * secPerTick;
  };
}

/**
 * Parse a `.mid`/`.midi` file's raw bytes into note events and track metadata.
 *
 * @throws {Error} If the file is not a valid SMF, or uses SMPTE-based timing.
 */
export function parseMidiFile(buffer: ArrayBuffer): ParsedMidi {
  const view = new DataView(buffer);
  const reader = new ByteReader(view);

  if (reader.readAscii(4) !== "MThd") {
    throw new Error("Not a valid MIDI file (missing MThd header).");
  }
  const headerLength = reader.readUint32();
  const headerEnd = reader.position + headerLength;
  reader.readUint16(); // format (0, 1, or 2) — not needed for parsing
  const trackCount = reader.readUint16();
  const division = reader.readUint16();
  reader.skip(headerEnd - reader.position);

  if ((division & 0x8000) !== 0) {
    throw new Error("SMPTE-based MIDI timing is not supported.");
  }
  const ticksPerBeat = division;

  const rawTracks: RawTrack[] = [];
  for (let i = 0; i < trackCount && reader.hasMore(8); i++) {
    const chunkType = reader.readAscii(4);
    const chunkLength = reader.readUint32();
    if (chunkType !== "MTrk") {
      reader.skip(chunkLength);
      continue;
    }
    rawTracks.push(parseTrackChunk(reader, chunkLength));
  }

  const allTempoEvents = rawTracks.flatMap((t) => t.tempoEvents);
  const tickToSeconds = buildTickToSeconds(allTempoEvents, ticksPerBeat);

  const initialBpm =
    allTempoEvents.length > 0
      ? Math.round(
          60_000_000 / allTempoEvents.sort((a, b) => a.tick - b.tick)[0].microsecondsPerQuarter,
        )
      : 120;

  const notes: NoteEvent[] = [];
  const tracks: MidiTrackInfo[] = [];
  let sourceId = 0;
  let durationSec = 0;

  rawTracks.forEach((track, trackIndex) => {
    // Match each note-on with the next note-off of the same channel+pitch (FIFO),
    // by walking note-on/note-off events merged in chronological order.
    let noteCount = 0;
    let firstChannel: number | null = null;

    const events = [
      ...track.noteOns.map((e) => ({ ...e, isOn: true as const })),
      ...track.noteOffs.map((e) => ({ ...e, isOn: false as const, velocity: 0 })),
    ].sort((a, b) => a.tick - b.tick);

    const openNotes = new Map<string, RawNoteOnEvent[]>();
    for (const ev of events) {
      const key = `${ev.channel}:${ev.pitch}`;
      if (ev.isOn) {
        const queue = openNotes.get(key) ?? [];
        queue.push(ev);
        openNotes.set(key, queue);
      } else {
        const queue = openNotes.get(key);
        const on = queue?.shift();
        if (on) {
          const startSec = tickToSeconds(on.tick);
          const endSec = tickToSeconds(ev.tick);
          const duration = Math.max(endSec - startSec, 0.01);
          notes.push({
            time: startSec,
            duration,
            midi: on.pitch,
            track: trackIndex,
            sourceId: sourceId++,
          });
          durationSec = Math.max(durationSec, startSec + duration);
          noteCount += 1;
          if (firstChannel === null) {
            firstChannel = on.channel;
          }
        }
      }
    }

    tracks.push({
      index: trackIndex,
      name: track.name || `Track ${trackIndex + 1}`,
      channel: firstChannel,
      noteCount,
    });
  });

  return { ticksPerBeat, initialBpm, durationSec, tracks, notes };
}
