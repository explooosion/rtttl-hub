import { parseRtttl } from "./rtttl_parser";
import type { RtttlNote } from "./rtttl_parser";

export type MultiPlayerState = "idle" | "playing" | "paused";

interface TrackState {
  notes: RtttlNote[];
  currentNoteIndex: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  muted: boolean;
  finished: boolean;
}

export type MultiPlayerCallback = (state: {
  state: MultiPlayerState;
  globalNoteIndex: number;
  globalTotalNotes: number;
  tracks: { currentNoteIndex: number; totalNotes: number; muted: boolean }[];
}) => void;

export class MultiTrackPlayer {
  private audioContext: AudioContext | null = null;
  private tracks: TrackState[] = [];
  private state: MultiPlayerState = "idle";
  private callback: MultiPlayerCallback | null = null;

  /** Index of the longest-duration track, used as clock source. */
  private primaryTrackIdx = 0;
  /** cumulativeMs[i] = sum of note durations 0..i-1 for the primary track. */
  private primaryCumulativeMs: number[] = [0];
  /** Wall-clock time when the current primary-track note's setTimeout actually fired. */
  private noteAnchorWallMs = 0;
  /** primaryCumulativeMs value at the current primary-track note index. */
  private noteAnchorMs = 0;
  /** Frozen elapsed ms while paused/stopped; null while playing. */
  private frozenElapsedMs: number | null = null;

  setCallback(cb: MultiPlayerCallback) {
    this.callback = cb;
  }

  private notify() {
    if (!this.callback) {
      return;
    }
    const primary = this.getPrimaryTrack();
    this.callback({
      state: this.state,
      globalNoteIndex: primary ? primary.currentNoteIndex : 0,
      globalTotalNotes: primary ? primary.notes.length : 0,
      tracks: this.tracks.map((t) => ({
        currentNoteIndex: t.currentNoteIndex,
        totalNotes: t.notes.length,
        muted: t.muted,
      })),
    });
  }

  /** Primary track = the one with the longest total DURATION (used as clock source). */
  private getPrimaryTrack(): TrackState | null {
    if (this.tracks.length === 0) {
      return null;
    }
    return this.tracks[this.primaryTrackIdx] ?? this.tracks[0];
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  play(codes: string[], initialMuted?: boolean[]) {
    this.stop();
    const trackCount = codes.length;
    if (trackCount === 0) {
      return;
    }

    const volume = 0.12 / Math.max(1, trackCount);

    this.tracks = codes.map((code, i) => {
      const parsed = parseRtttl(code);
      return {
        notes: parsed ? parsed.notes : [],
        currentNoteIndex: 0,
        timeoutId: null,
        oscillator: null,
        gainNode: null,
        muted: initialMuted?.[i] ?? false,
        finished: false,
      };
    });

    this.state = "playing";
    this.notify();

    // Determine the longest-duration track as the timing source.
    this.primaryTrackIdx = 0;
    let maxDur = 0;
    for (let i = 0; i < this.tracks.length; i++) {
      const dur = this.tracks[i].notes.reduce((s, n) => s + n.durationMs, 0);
      if (dur > maxDur) {
        maxDur = dur;
        this.primaryTrackIdx = i;
      }
    }
    // Precompute cumulative note start times for the primary track.
    const primaryNotes = this.tracks[this.primaryTrackIdx]?.notes ?? [];
    const cum: number[] = [0];
    let cumAcc = 0;
    for (const n of primaryNotes) {
      cumAcc += n.durationMs;
      cum.push(cumAcc);
    }
    this.primaryCumulativeMs = cum;
    this.noteAnchorMs = 0;
    this.noteAnchorWallMs = Date.now();
    this.frozenElapsedMs = null;

    for (let i = 0; i < this.tracks.length; i++) {
      this.playTrackNote(i, volume);
    }
  }

  private playTrackNote(trackIdx: number, volume: number) {
    const track = this.tracks[trackIdx];
    if (!track || this.state !== "playing") {
      return;
    }

    // Anchor timing to this note's nominal start time whenever the primary track advances.
    if (trackIdx === this.primaryTrackIdx) {
      this.noteAnchorMs = this.primaryCumulativeMs[track.currentNoteIndex] ?? 0;
      this.noteAnchorWallMs = Date.now();
    }

    if (track.currentNoteIndex >= track.notes.length) {
      track.finished = true;
      this.checkAllFinished();
      return;
    }

    const note = track.notes[track.currentNoteIndex];
    const ctx = this.ensureContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    this.cleanupTrackOscillator(track);

    if (!note.isRest && note.frequency > 0 && !track.muted) {
      track.gainNode = ctx.createGain();
      track.gainNode.connect(ctx.destination);

      const attackTime = Math.min(0.01, note.durationMs / 1000 / 4);
      const releaseTime = Math.min(0.02, note.durationMs / 1000 / 4);
      const sustainTime = note.durationMs / 1000 - attackTime - releaseTime;

      track.gainNode.gain.setValueAtTime(0, ctx.currentTime);
      track.gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
      if (sustainTime > 0) {
        track.gainNode.gain.setValueAtTime(volume, ctx.currentTime + attackTime + sustainTime);
      }
      track.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + note.durationMs / 1000);

      track.oscillator = ctx.createOscillator();
      track.oscillator.type = "square";
      track.oscillator.frequency.setValueAtTime(note.frequency, ctx.currentTime);
      track.oscillator.connect(track.gainNode);
      track.oscillator.start();
      track.oscillator.stop(ctx.currentTime + note.durationMs / 1000);
    }

    this.notify();

    track.timeoutId = setTimeout(() => {
      track.currentNoteIndex++;
      this.playTrackNote(trackIdx, volume);
    }, note.durationMs);
  }

  private cleanupTrackOscillator(track: TrackState) {
    if (track.oscillator) {
      try {
        track.oscillator.disconnect();
      } catch {
        /* already disconnected */
      }
      track.oscillator = null;
    }
    if (track.gainNode) {
      try {
        track.gainNode.disconnect();
      } catch {
        /* already disconnected */
      }
      track.gainNode = null;
    }
  }

  private checkAllFinished() {
    if (this.tracks.every((t) => t.finished)) {
      this.state = "idle";
      this.notify();
    }
  }

  pause() {
    if (this.state !== "playing") {
      return;
    }
    this.frozenElapsedMs = this.getElapsedMs();
    this.state = "paused";
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);
    }
    this.notify();
  }

  resume() {
    if (this.state !== "paused") {
      return;
    }
    // Restore the anchor so getElapsedMs() continues from the frozen position.
    this.noteAnchorMs = this.frozenElapsedMs ?? this.noteAnchorMs;
    this.noteAnchorWallMs = Date.now();
    this.frozenElapsedMs = null;
    this.state = "playing";
    const volume = 0.12 / Math.max(1, this.tracks.length);
    this.notify();
    for (let i = 0; i < this.tracks.length; i++) {
      if (!this.tracks[i].finished) {
        this.playTrackNote(i, volume);
      }
    }
  }

  stop() {
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);
    }
    this.tracks = [];
    this.primaryCumulativeMs = [0];
    this.noteAnchorMs = 0;
    this.noteAnchorWallMs = 0;
    this.frozenElapsedMs = 0;
    this.state = "idle";
    this.notify();
  }

  seekTo(noteIndex: number) {
    if (this.tracks.length === 0) {
      return;
    }
    const wasPlaying = this.state === "playing";
    const primary = this.getPrimaryTrack();
    if (!primary) {
      return;
    }

    // Calculate the time offset of the target note in the primary track
    const targetIdx = Math.max(0, Math.min(noteIndex, primary.notes.length - 1));
    let targetTimeMs = 0;
    for (let i = 0; i < targetIdx; i++) {
      targetTimeMs += primary.notes[i].durationMs;
    }

    // For each track, find the note that corresponds to the same time offset
    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);

      let elapsed = 0;
      let idx = 0;
      while (idx < track.notes.length && elapsed < targetTimeMs) {
        elapsed += track.notes[idx].durationMs;
        idx++;
      }
      track.currentNoteIndex = Math.min(idx, track.notes.length);
      track.finished = track.currentNoteIndex >= track.notes.length;
    }

    const primaryTrack = this.getPrimaryTrack();
    const anchorIdx = primaryTrack?.currentNoteIndex ?? 0;
    const seekAnchorMs =
      this.primaryCumulativeMs[Math.min(anchorIdx, this.primaryCumulativeMs.length - 1)] ?? 0;
    this.noteAnchorMs = seekAnchorMs;
    this.noteAnchorWallMs = Date.now();

    if (wasPlaying) {
      this.frozenElapsedMs = null;
      this.state = "playing";
      const volume = 0.12 / Math.max(1, this.tracks.length);
      this.notify();
      for (let i = 0; i < this.tracks.length; i++) {
        if (!this.tracks[i].finished) {
          this.playTrackNote(i, volume);
        }
      }
    } else {
      this.frozenElapsedMs = seekAnchorMs;
      this.state = "paused";
      this.notify();
    }
  }

  /** Seek all tracks to the given time offset in milliseconds. */
  seekToMs(targetMs: number) {
    if (this.tracks.length === 0) return;
    const wasPlaying = this.state === "playing";

    for (const track of this.tracks) {
      if (track.timeoutId) {
        clearTimeout(track.timeoutId);
        track.timeoutId = null;
      }
      this.cleanupTrackOscillator(track);

      let elapsed = 0;
      let idx = 0;
      while (idx < track.notes.length && elapsed + track.notes[idx].durationMs <= targetMs) {
        elapsed += track.notes[idx].durationMs;
        idx++;
      }
      track.currentNoteIndex = Math.min(idx, track.notes.length);
      track.finished = track.currentNoteIndex >= track.notes.length;
    }

    if (wasPlaying) {
      this.state = "playing";
      const volume = 0.12 / Math.max(1, this.tracks.length);
      this.notify();
      for (let i = 0; i < this.tracks.length; i++) {
        if (!this.tracks[i].finished) {
          this.playTrackNote(i, volume);
        }
      }
    } else {
      // Freeze at seek target so getElapsedMs() returns correct position.
      const primaryTrack = this.getPrimaryTrack();
      const primaryIdx = primaryTrack?.currentNoteIndex ?? 0;
      const seekAnchor =
        this.primaryCumulativeMs[Math.min(primaryIdx, this.primaryCumulativeMs.length - 1)] ??
        targetMs;
      this.noteAnchorMs = seekAnchor;
      this.frozenElapsedMs = seekAnchor;
      this.notify();
    }
  }

  /**
   * Returns playback position in ms anchored to audio note boundaries.
   * Between note advances the value interpolates with the wall clock so the
   * visual is smooth. Any accumulated setTimeout drift is corrected at each
   * note boundary, keeping audio and visual permanently in sync.
   */
  getElapsedMs(): number {
    if (this.frozenElapsedMs !== null) {
      return this.frozenElapsedMs;
    }
    return this.noteAnchorMs + (Date.now() - this.noteAnchorWallMs);
  }

  toggleMuteTrack(trackIdx: number) {
    const track = this.tracks[trackIdx];
    if (!track) {
      return;
    }
    track.muted = !track.muted;
    if (track.muted) {
      this.cleanupTrackOscillator(track);
    }
    this.notify();
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
