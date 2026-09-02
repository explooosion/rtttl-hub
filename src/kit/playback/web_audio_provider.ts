import { parseRtttl } from "../../utils/rtttl_parser";
import type { RtttlNote } from "../../utils/rtttl_parser";
import { buildCumulativeMs, findNoteIndexAtMs } from "./schedule";
import { createPayloadStabilizer } from "./payload_stabilizer";
import type { PlaybackCallback, PlaybackProvider, PlaybackState } from "./types";

const ATTACK_SEC = 0.01;
const DECAY_SEC = 0.05;
const SUSTAIN_LEVEL = 0.6;
const RELEASE_SEC = 0.02;
const GATE_RATIO = 0.9;
const START_DELAY_SEC = 0.05;
const END_EPSILON_MS = 50;

interface TrackGraph {
  osc: OscillatorNode;
  gate: GainNode;
  volume: GainNode;
  mute: GainNode;
}

interface WebAudioTrack {
  notes: RtttlNote[];
  cumulativeMs: number[];
  totalMs: number;
  muted: boolean;
  graph: TrackGraph | null;
}

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

export function resumeAudioContextIfSuspended(): void {
  if (sharedCtx && sharedCtx.state !== "running") {
    void sharedCtx.resume();
  }
}

export class WebAudioPlaybackProvider implements PlaybackProvider {
  private tracks: WebAudioTrack[] = [];
  private state: PlaybackState = "idle";
  private callback: PlaybackCallback | null = null;
  private stabilize = createPayloadStabilizer();
  private primaryTrackIdx = 0;
  private maxDurMs = 0;
  private rafId = 0;
  private startCtxTime = 0;
  private baseOffsetMs = 0;
  private volumeLinear = 1;

  setCallback(cb: PlaybackCallback): void {
    this.callback = cb;
    this.stabilize = createPayloadStabilizer();
  }

  getElapsedMs(): number {
    if (this.tracks.length === 0) {
      return 0;
    }
    const raw = Math.max(this.rawElapsedMs(), this.baseOffsetMs);
    return Math.max(0, Math.min(raw, this.maxDurMs));
  }

  getState(): PlaybackState {
    return this.state;
  }

  async play(codes: string[], initialMuted?: boolean[], startMs = 0): Promise<void> {
    this.stop();
    const ctx = getAudioContext();
    if (ctx.state !== "running") {
      await ctx.resume();
    }
    if (codes.length === 0) {
      return;
    }

    const volumeDb = -6 - Math.max(0, (codes.length - 1) * 3);
    this.volumeLinear = Math.pow(10, volumeDb / 20);

    this.tracks = codes.map((code, i) => {
      const parsed = parseRtttl(code);
      const notes = parsed ? parsed.notes : [];
      const cumulativeMs = buildCumulativeMs(notes);
      return {
        notes,
        cumulativeMs,
        totalMs: cumulativeMs[notes.length] ?? 0,
        muted: initialMuted?.[i] ?? false,
        graph: null,
      };
    });

    this.primaryTrackIdx = 0;
    this.maxDurMs = 0;
    for (let i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i].totalMs > this.maxDurMs) {
        this.maxDurMs = this.tracks[i].totalMs;
        this.primaryTrackIdx = i;
      }
    }

    this.scheduleFrom(Math.max(0, startMs));
    this.state = "playing";
    this.startNoteTracking();
    this.notify();
  }

  pause(): void {
    if (this.state !== "playing") {
      return;
    }
    void getAudioContext().suspend();
    this.state = "paused";
    this.stopNoteTracking();
    this.notify();
  }

  resume(): void {
    if (this.state !== "paused") {
      return;
    }
    void getAudioContext().resume();
    this.state = "playing";
    this.startNoteTracking();
    this.notify();
  }

  stop(): void {
    this.stopNoteTracking();
    this.disposeGraphs();
    this.tracks = [];
    this.state = "idle";
    this.baseOffsetMs = 0;
    this.maxDurMs = 0;
    this.notify();
  }

  seekTo(noteIndex: number): void {
    const primary = this.tracks[this.primaryTrackIdx];
    if (!primary) {
      return;
    }
    const clamped = Math.max(0, Math.min(noteIndex, primary.notes.length - 1));
    this.seekToMs(primary.cumulativeMs[clamped] ?? 0);
  }

  seekToMs(ms: number): void {
    if (this.tracks.length === 0) {
      return;
    }
    const wasPlaying = this.state === "playing";
    this.scheduleFrom(Math.max(0, Math.min(ms, this.maxDurMs)));

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
    if (track.graph) {
      track.graph.mute.gain.value = track.muted ? 0 : 1;
    }
    this.notify();
  }

  destroy(): void {
    this.stop();
  }

  private rawElapsedMs(): number {
    return (getAudioContext().currentTime - this.startCtxTime) * 1000 + this.baseOffsetMs;
  }

  private scheduleFrom(offsetMs: number): void {
    this.disposeGraphs();
    const ctx = getAudioContext();
    const base = ctx.currentTime + START_DELAY_SEC;
    this.startCtxTime = base;
    this.baseOffsetMs = offsetMs;

    for (const track of this.tracks) {
      if (track.notes.length === 0) {
        continue;
      }
      const osc = new OscillatorNode(ctx, { type: "square" });
      const gate = new GainNode(ctx, { gain: 0 });
      const volume = new GainNode(ctx, { gain: this.volumeLinear });
      const mute = new GainNode(ctx, { gain: track.muted ? 0 : 1 });
      osc.connect(gate);
      gate.connect(volume);
      volume.connect(mute);
      mute.connect(ctx.destination);

      const startIdx = findNoteIndexAtMs(track.cumulativeMs, offsetMs);
      for (let i = startIdx; i < track.notes.length; i++) {
        const note = track.notes[i];
        if (note.isRest || note.frequency <= 0) {
          continue;
        }
        const noteStartMs = track.cumulativeMs[i] ?? 0;
        const noteEndMs = noteStartMs + note.durationMs;
        if (noteEndMs <= offsetMs) {
          continue;
        }
        const effectiveStartMs = Math.max(noteStartMs, offsetMs);
        const t0 = base + (effectiveStartMs - offsetMs) / 1000;
        const tEnd = base + (noteEndMs - offsetMs) / 1000;
        const gateOff = Math.min(t0 + ((noteEndMs - effectiveStartMs) / 1000) * GATE_RATIO, tEnd);
        this.scheduleNote(osc, gate, note.frequency, t0, gateOff, tEnd);
      }

      const trackEndSec = base + Math.max(0, track.totalMs - offsetMs) / 1000;
      osc.start(base);
      osc.stop(trackEndSec + 0.1);
      track.graph = { osc, gate, volume, mute };
    }
  }

  private scheduleNote(
    osc: OscillatorNode,
    gate: GainNode,
    frequency: number,
    t0: number,
    gateOff: number,
    tEnd: number,
  ): void {
    osc.frequency.setValueAtTime(frequency, t0);
    const attackEnd = Math.min(t0 + ATTACK_SEC, gateOff);
    const decayEnd = Math.min(attackEnd + DECAY_SEC, gateOff);
    const releaseEnd = Math.min(gateOff + RELEASE_SEC, tEnd);
    const sustainValue = decayEnd > attackEnd ? SUSTAIN_LEVEL : 1;

    gate.gain.setValueAtTime(0, t0);
    gate.gain.linearRampToValueAtTime(1, attackEnd);
    if (decayEnd > attackEnd) {
      gate.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, decayEnd);
    }
    gate.gain.setValueAtTime(sustainValue, gateOff);
    gate.gain.linearRampToValueAtTime(0, releaseEnd);
  }

  private disposeGraphs(): void {
    for (const track of this.tracks) {
      const graph = track.graph;
      if (!graph) {
        continue;
      }
      graph.osc.stop();
      graph.osc.disconnect();
      graph.gate.disconnect();
      graph.volume.disconnect();
      graph.mute.disconnect();
      track.graph = null;
    }
  }

  private handlePlaybackEnd(): void {
    this.stopNoteTracking();
    const finalNoteIndices = this.tracks.map((t) => Math.max(0, t.notes.length - 1));
    const finalTotalNotes = this.tracks.map((t) => t.notes.length);
    const finalMuted = this.tracks.map((t) => t.muted);
    const primary = this.tracks[this.primaryTrackIdx];
    const finalPrimaryIdx = Math.max(0, (primary?.notes.length ?? 1) - 1);
    const finalGlobalTotal = primary?.notes.length ?? 0;

    this.disposeGraphs();
    this.tracks = [];
    this.state = "stopped";

    this.emit({
      state: "stopped",
      currentNoteIndex: finalPrimaryIdx,
      totalNotes: finalGlobalTotal,
      trackNoteIndices: finalNoteIndices,
      trackTotalNotes: finalTotalNotes,
      trackMuted: finalMuted,
    });
  }

  private startNoteTracking(): void {
    this.stopNoteTracking();
    const tick = () => {
      if (this.maxDurMs > 0 && this.rawElapsedMs() >= this.maxDurMs + END_EPSILON_MS) {
        this.handlePlaybackEnd();
        return;
      }
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
    const elapsed = this.getElapsedMs();
    const primary = this.tracks[this.primaryTrackIdx];
    this.emit({
      state: this.state,
      currentNoteIndex: primary ? findNoteIndexAtMs(primary.cumulativeMs, elapsed) : 0,
      totalNotes: primary ? primary.notes.length : 0,
      trackNoteIndices: this.tracks.map((t) => findNoteIndexAtMs(t.cumulativeMs, elapsed)),
      trackTotalNotes: this.tracks.map((t) => t.notes.length),
      trackMuted: this.tracks.map((t) => t.muted),
    });
  }

  private emit(payload: Parameters<PlaybackCallback>[0]): void {
    if (!this.callback) {
      return;
    }
    const stabilized = this.stabilize(payload);
    if (stabilized) {
      this.callback(stabilized);
    }
  }
}
