import * as Tone from "tone";
import { parseRtttl } from "./rtttl_parser";
import type { RtttlNote } from "./rtttl_parser";
import { buildCumulativeMs, findNoteIndexAtMs, buildSchedule } from "./tone_schedule";
import type { ScheduledNote } from "./tone_schedule";

export type EngineState = "idle" | "playing" | "paused" | "stopped";

export interface EngineCallbackPayload {
  state: EngineState;
  currentNoteIndex: number;
  totalNotes: number;
  trackNoteIndices: number[];
  trackTotalNotes: number[];
  trackMuted: boolean[];
}

export type EngineCallback = (payload: EngineCallbackPayload) => void;

interface TrackData {
  notes: RtttlNote[];
  schedule: ScheduledNote[];
  cumulativeMs: number[];
  synth: Tone.Synth;
  gain: Tone.Gain;
  eventIds: number[];
  muted: boolean;
}

export class ToneEngine {
  private tracks: TrackData[] = [];
  private state: EngineState = "idle";
  private callback: EngineCallback | null = null;
  private primaryTrackIdx = 0;
  private rafId = 0;
  private startedOnce = false;

  setCallback(cb: EngineCallback): void {
    this.callback = cb;
  }

  /** Get current playback position in milliseconds via Tone.Transport. */
  getElapsedMs(): number {
    return Tone.getTransport().seconds * 1000;
  }

  getState(): EngineState {
    return this.state;
  }

  /**
   * Play one or more RTTTL code strings.
   * Single-track: pass `[code]`. Multi-track: pass `[code1, code2, ...]`.
   */
  async play(codes: string[], initialMuted?: boolean[], startMs = 0): Promise<void> {
    this.stop();
    await this.ensureStarted();

    const transport = Tone.getTransport();
    transport.cancel();
    transport.position = 0;

    const trackCount = codes.length;
    if (trackCount === 0) {
      return;
    }

    const volume = -6 - Math.max(0, (trackCount - 1) * 3); // dB

    this.tracks = codes.map((code, i) => {
      const parsed = parseRtttl(code);
      const notes = parsed ? parsed.notes : [];
      const schedule = buildSchedule(notes);
      const cumulativeMs = buildCumulativeMs(notes);

      const gain = new Tone.Gain(initialMuted?.[i] ? 0 : 1).toDestination();
      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.02 },
        volume,
      }).connect(gain);

      const eventIds: number[] = [];
      for (const entry of schedule) {
        if (entry.pitch) {
          const id = transport.schedule((time) => {
            synth.triggerAttackRelease(entry.pitch!, entry.durationSec * 0.9, time);
          }, entry.startSec);
          eventIds.push(id);
        }
      }

      return {
        notes,
        schedule,
        cumulativeMs,
        synth,
        gain,
        eventIds,
        muted: initialMuted?.[i] ?? false,
      };
    });

    // Primary track = longest duration (used for global note index)
    this.primaryTrackIdx = 0;
    let maxDur = 0;
    for (let i = 0; i < this.tracks.length; i++) {
      const dur = this.tracks[i].cumulativeMs[this.tracks[i].notes.length] ?? 0;
      if (dur > maxDur) {
        maxDur = dur;
        this.primaryTrackIdx = i;
      }
    }

    // Schedule transport stop at end of longest track
    if (maxDur > 0) {
      transport.schedule(
        () => {
          this.handlePlaybackEnd();
        },
        maxDur / 1000 + 0.05,
      );
    }

    transport.start();
    if (startMs > 0) {
      transport.seconds = startMs / 1000;
    }
    this.state = "playing";
    this.startNoteTracking();
    this.notify();
  }

  pause(): void {
    if (this.state !== "playing") {
      return;
    }
    Tone.getTransport().pause();
    this.state = "paused";
    this.stopNoteTracking();
    this.notify();
  }

  resume(): void {
    if (this.state !== "paused") {
      return;
    }
    Tone.getTransport().start();
    this.state = "playing";
    this.startNoteTracking();
    this.notify();
  }

  stop(): void {
    this.stopNoteTracking();
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.position = 0;
    this.disposeTracks();
    this.state = "idle";
    this.notify();
  }

  seekTo(noteIndex: number): void {
    const primary = this.tracks[this.primaryTrackIdx];
    if (!primary) {
      return;
    }
    const clamped = Math.max(0, Math.min(noteIndex, primary.notes.length - 1));
    const ms = primary.cumulativeMs[clamped] ?? 0;
    this.seekToMs(ms);
  }

  seekToMs(ms: number): void {
    if (this.tracks.length === 0) {
      return;
    }
    const wasPlaying = this.state === "playing";
    Tone.getTransport().seconds = ms / 1000;

    if (wasPlaying) {
      this.state = "playing";
      this.startNoteTracking();
    } else {
      this.state = "paused";
      this.stopNoteTracking();
    }
    this.notify();
  }

  toggleMuteTrack(trackIdx: number): void {
    const track = this.tracks[trackIdx];
    if (!track) {
      return;
    }
    track.muted = !track.muted;
    track.gain.gain.value = track.muted ? 0 : 1;
    this.notify();
  }

  destroy(): void {
    this.stop();
  }

  // ── Private ──────────────────────────────────────────

  private async ensureStarted(): Promise<void> {
    if (!this.startedOnce) {
      await Tone.start();
      this.startedOnce = true;
    }
  }

  private handlePlaybackEnd(): void {
    this.stopNoteTracking();
    // Capture last-note state before clearing tracks so the UI shows "end" position
    const finalNoteIndices = this.tracks.map((t) => Math.max(0, t.notes.length - 1));
    const finalTotalNotes = this.tracks.map((t) => t.notes.length);
    const finalMuted = this.tracks.map((t) => t.muted);
    const finalPrimaryIdx = Math.max(0, (this.tracks[this.primaryTrackIdx]?.notes.length ?? 1) - 1);
    const finalGlobalTotal = this.tracks[this.primaryTrackIdx]?.notes.length ?? 0;

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.disposeTracks();
    this.state = "idle";

    if (this.callback) {
      this.callback({
        state: "idle",
        currentNoteIndex: finalPrimaryIdx,
        totalNotes: finalGlobalTotal,
        trackNoteIndices: finalNoteIndices,
        trackTotalNotes: finalTotalNotes,
        trackMuted: finalMuted,
      });
    }
  }

  private disposeTracks(): void {
    for (const track of this.tracks) {
      track.synth.dispose();
      track.gain.dispose();
    }
    this.tracks = [];
  }

  private startNoteTracking(): void {
    this.stopNoteTracking();
    const tick = () => {
      this.notify();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopNoteTracking(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private notify(): void {
    if (!this.callback) {
      return;
    }
    const elapsedMs = this.getElapsedMs();
    const primary = this.tracks[this.primaryTrackIdx];
    const globalIdx = primary ? findNoteIndexAtMs(primary.cumulativeMs, elapsedMs) : 0;
    const globalTotal = primary ? primary.notes.length : 0;

    this.callback({
      state: this.state,
      currentNoteIndex: globalIdx,
      totalNotes: globalTotal,
      trackNoteIndices: this.tracks.map((t) => findNoteIndexAtMs(t.cumulativeMs, elapsedMs)),
      trackTotalNotes: this.tracks.map((t) => t.notes.length),
      trackMuted: this.tracks.map((t) => t.muted),
    });
  }
}
