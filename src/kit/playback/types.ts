export type PlaybackState = "idle" | "playing" | "paused" | "stopped";

export interface PlaybackCallbackPayload {
  state: PlaybackState;
  currentNoteIndex: number;
  totalNotes: number;
  trackNoteIndices: number[];
  trackTotalNotes: number[];
  trackMuted: boolean[];
}

export type PlaybackCallback = (payload: PlaybackCallbackPayload) => void;

export interface PlaybackProvider {
  play(codes: string[], initialMuted?: boolean[], startMs?: number): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  seekTo(noteIndex: number): void;
  seekToMs(ms: number): void;
  toggleMuteTrack(trackIdx: number): void;
  getElapsedMs(): number;
  getState(): PlaybackState;
  setCallback(cb: PlaybackCallback): void;
  destroy(): void;
}
