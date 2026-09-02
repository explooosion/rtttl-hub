import { WebAudioPlaybackProvider } from "./web_audio_provider";
import type { PlaybackProvider } from "./types";

export type {
  PlaybackProvider,
  PlaybackState,
  PlaybackCallback,
  PlaybackCallbackPayload,
} from "./types";
export { WebAudioPlaybackProvider, resumeAudioContextIfSuspended } from "./web_audio_provider";
export { buildCumulativeMs, findNoteIndexAtMs } from "./schedule";

export function createPlaybackProvider(): PlaybackProvider {
  return new WebAudioPlaybackProvider();
}
