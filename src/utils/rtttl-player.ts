import { parseRtttl } from "./rtttl-parser";
import type { RtttlNote } from "./rtttl-parser";

export type PlayerState = "idle" | "playing" | "paused" | "stopped";

export type PlayerCallback = (state: {
  state: PlayerState;
  currentNoteIndex: number;
  totalNotes: number;
}) => void;

export class RtttlPlayer {
  private audioContext: AudioContext | null = null;
  private currentNoteIndex = 0;
  private notes: RtttlNote[] = [];
  private state: PlayerState = "idle";
  private callback: PlayerCallback | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;

  /** cumulativeMs[i] = sum of durationMs for notes 0 .. i-1 (i.e. the start time of note i). */
  private cumulativeMs: number[] = [0];
  /** Wall-clock time (Date.now()) when the current note's setTimeout actually fired. */
  private noteAnchorWallMs = 0;
  /** primaryCumulativeMs value at the current note index. */
  private noteAnchorMs = 0;
  /** Frozen elapsed ms while paused; null while playing. */
  private frozenElapsedMs: number | null = null;

  setCallback(cb: PlayerCallback) {
    this.callback = cb;
  }

  private notify() {
    if (this.callback) {
      this.callback({
        state: this.state,
        currentNoteIndex: this.currentNoteIndex,
        totalNotes: this.notes.length,
      });
    }
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  play(code: string) {
    this.stop();
    const parsed = parseRtttl(code);
    if (!parsed || parsed.notes.length === 0) {
      return;
    }
    this.notes = parsed.notes;
    // Precompute cumulative start times so getElapsedMs() can anchor to note boundaries.
    const cum: number[] = [0];
    let acc = 0;
    for (const n of this.notes) {
      acc += n.durationMs;
      cum.push(acc);
    }
    this.cumulativeMs = cum;
    this.currentNoteIndex = 0;
    this.noteAnchorMs = 0;
    this.noteAnchorWallMs = Date.now();
    this.frozenElapsedMs = null;
    this.state = "playing";
    this.notify();
    this.playNextNote();
  }

  private playNextNote() {
    if (this.state !== "playing") {
      return;
    }
    if (this.currentNoteIndex >= this.notes.length) {
      this.state = "idle";
      this.notify();
      return;
    }

    const note = this.notes[this.currentNoteIndex];
    const ctx = this.ensureContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    this.cleanupOscillator();

    if (!note.isRest && note.frequency > 0) {
      this.gainNode = ctx.createGain();
      this.gainNode.connect(ctx.destination);
      this.gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

      // Smooth envelope to avoid clicks
      const attackTime = Math.min(0.01, note.durationMs / 1000 / 4);
      const releaseTime = Math.min(0.02, note.durationMs / 1000 / 4);
      const sustainTime = note.durationMs / 1000 - attackTime - releaseTime;

      this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + attackTime);
      if (sustainTime > 0) {
        this.gainNode.gain.setValueAtTime(0.15, ctx.currentTime + attackTime + sustainTime);
      }
      this.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + note.durationMs / 1000);

      this.oscillator = ctx.createOscillator();
      this.oscillator.type = "square";
      this.oscillator.frequency.setValueAtTime(note.frequency, ctx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
      this.oscillator.stop(ctx.currentTime + note.durationMs / 1000);
    }

    this.notify();

    // Anchor timing to this note's nominal start time so visual stays in sync with audio.
    this.noteAnchorMs = this.cumulativeMs[this.currentNoteIndex] ?? 0;
    this.noteAnchorWallMs = Date.now();

    this.timeoutId = setTimeout(() => {
      this.currentNoteIndex++;
      this.playNextNote();
    }, note.durationMs);
  }

  private cleanupOscillator() {
    if (this.oscillator) {
      try {
        this.oscillator.disconnect();
      } catch {
        // already disconnected
      }
      this.oscillator = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // already disconnected
      }
      this.gainNode = null;
    }
  }

  pause() {
    if (this.state !== "playing") {
      return;
    }
    this.frozenElapsedMs = this.getElapsedMs();
    this.state = "paused";
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.cleanupOscillator();
    this.notify();
  }

  resume() {
    if (this.state !== "paused") {
      return;
    }
    // Restore anchor so getElapsedMs() continues from where we paused.
    this.noteAnchorMs = this.frozenElapsedMs ?? this.noteAnchorMs;
    this.noteAnchorWallMs = Date.now();
    this.frozenElapsedMs = null;
    this.state = "playing";
    this.notify();
    this.playNextNote();
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.cleanupOscillator();
    this.state = "idle";
    this.currentNoteIndex = 0;
    this.notes = [];
    this.cumulativeMs = [0];
    this.noteAnchorMs = 0;
    this.noteAnchorWallMs = 0;
    this.frozenElapsedMs = 0;
    this.notify();
  }

  seekTo(noteIndex: number) {
    if (this.notes.length === 0) return;
    const clamped = Math.max(0, Math.min(noteIndex, this.notes.length - 1));
    const wasPlaying = this.state === "playing";

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.cleanupOscillator();
    this.currentNoteIndex = clamped;
    const seekMs = this.cumulativeMs[clamped] ?? 0;
    this.noteAnchorMs = seekMs;
    this.noteAnchorWallMs = Date.now();

    if (wasPlaying) {
      this.frozenElapsedMs = null;
      this.state = "playing";
      this.notify();
      this.playNextNote();
    } else {
      this.frozenElapsedMs = seekMs;
      this.state = "paused";
      this.notify();
    }
  }

  /**
   * Returns the current playback position in milliseconds, anchored to the
   * audio player's note boundaries.  Between note changes the value
   * interpolates using the wall clock so the visual stays smooth.
   * Calling this instead of a raw Date.now() calculation eliminates the
   * accumulated setTimeout drift that caused the white line to run ahead of
   * (or behind) the actual audio.
   */
  getElapsedMs(): number {
    if (this.frozenElapsedMs !== null) {
      return this.frozenElapsedMs;
    }
    return this.noteAnchorMs + (Date.now() - this.noteAnchorWallMs);
  }

  getState(): PlayerState {
    return this.state;
  }

  getCurrentNoteIndex(): number {
    return this.currentNoteIndex;
  }

  getTotalNotes(): number {
    return this.notes.length;
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
