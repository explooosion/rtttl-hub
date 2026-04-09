import { create } from "zustand";
import { ToneEngine } from "@/utils/tone_engine";
import type { EngineState } from "@/utils/tone_engine";
import type { RtttlEntry } from "@/utils/rtttl_parser";
import { useListenedStore } from "./listened_store";

/** Re-export so existing consumers that import PlayerState still work. */
export type PlayerState = EngineState;

interface PlayerStoreState {
  currentItem: RtttlEntry | null;
  playerState: PlayerState;
  currentNoteIndex: number;
  totalNotes: number;
  trackNoteIndices: number[];
  trackTotalNotes: number[];
  trackMuted: boolean[];
  editedCode: string;
  editedTracks: string[];
  activeTrackIndex: number;
  engine: ToneEngine;
  /** @deprecated kept for backward compat — returns the same engine instance */
  player: ToneEngine;
  /** @deprecated kept for backward compat — returns the same engine instance */
  multiPlayer: ToneEngine;
  isMultiTrack: boolean;
  setCurrentItem: (item: RtttlEntry) => void;
  playItem: (item: RtttlEntry) => void;
  playCode: (code: string, startMs?: number) => void;
  playTracks: (tracks: string[], startMs?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (noteIndex: number) => void;
  seekToMs: (ms: number) => void;
  setEditedCode: (code: string) => void;
  setEditedTracks: (tracks: string[]) => void;
  setActiveTrackIndex: (index: number) => void;
  setEditedTrackAt: (index: number, code: string) => void;
  addTrack: () => void;
  removeTrack: (index: number) => void;
  toggleMuteTrack: (index: number) => void;
  resetMutedTracks: () => void;
  playSoloTrack: (trackIndex: number) => void;
}

const engine = new ToneEngine();

export const usePlayerStore = create<PlayerStoreState>((set, get) => {
  engine.setCallback((payload) => {
    set({
      playerState: payload.state,
      currentNoteIndex: payload.currentNoteIndex,
      totalNotes: payload.totalNotes,
      trackNoteIndices: payload.trackNoteIndices,
      trackTotalNotes: payload.trackTotalNotes,
      ...(payload.trackMuted.length > 0 ? { trackMuted: payload.trackMuted } : {}),
    });
  });

  return {
    currentItem: null,
    playerState: "idle",
    currentNoteIndex: 0,
    totalNotes: 0,
    trackNoteIndices: [],
    trackTotalNotes: [],
    trackMuted: [],
    editedCode: "",
    editedTracks: [],
    activeTrackIndex: 0,
    isMultiTrack: false,
    engine,
    player: engine,
    multiPlayer: engine,
    setCurrentItem: (item) => {
      const tracks = item.tracks ?? [];
      const isMulti = tracks.length > 1;
      set({
        currentItem: item,
        editedCode: item.code,
        editedTracks: tracks,
        activeTrackIndex: isMulti ? -1 : 0,
        isMultiTrack: isMulti,
      });
    },
    playItem: (item) => {
      const tracks = item.tracks ?? [];
      const isMulti = tracks.length > 1;
      set({
        currentItem: item,
        editedCode: item.code,
        editedTracks: tracks,
        activeTrackIndex: isMulti ? -1 : 0,
        isMultiTrack: isMulti,
      });
      useListenedStore.getState().markListened(item.id);
      if (isMulti) {
        engine.play(tracks);
      } else {
        engine.play([item.code]);
      }
    },
    playCode: (code, startMs) => {
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      set({ isMultiTrack: false });
      engine.play([code], undefined, startMs);
    },
    playTracks: (tracks, startMs) => {
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      set({ isMultiTrack: true, editedTracks: tracks });
      engine.play(tracks, get().trackMuted, startMs);
    },
    pause: () => {
      engine.pause();
    },
    resume: () => {
      engine.resume();
    },
    stop: () => {
      engine.stop();
    },
    seekTo: (noteIndex) => {
      engine.seekTo(noteIndex);
    },
    seekToMs: (ms) => {
      engine.seekToMs(ms);
    },
    setEditedCode: (editedCode) => set({ editedCode }),
    setEditedTracks: (editedTracks) => set({ editedTracks }),
    setActiveTrackIndex: (activeTrackIndex) => set({ activeTrackIndex }),
    setEditedTrackAt: (index, code) => {
      const tracks = [...get().editedTracks];
      tracks[index] = code;
      set({ editedTracks: tracks });
    },
    addTrack: () => {
      const tracks = [...get().editedTracks];
      if (tracks.length >= 4) {
        return;
      }
      tracks.push("");
      set({ editedTracks: tracks, activeTrackIndex: tracks.length - 1, isMultiTrack: true });
    },
    removeTrack: (index) => {
      const tracks = [...get().editedTracks];
      if (tracks.length <= 1) {
        return;
      }
      tracks.splice(index, 1);
      const prev = get().activeTrackIndex;
      const newActive = prev === -1 ? -1 : prev >= index ? -1 : prev;
      set({ editedTracks: tracks, activeTrackIndex: newActive });
    },
    playSoloTrack: (trackIndex) => {
      const tracks = get().editedTracks;
      const code = tracks[trackIndex] ?? "";
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      engine.play([code]);
    },
    toggleMuteTrack: (index) => {
      if (get().playerState !== "idle") {
        engine.toggleMuteTrack(index);
      } else {
        const prev = get().trackMuted;
        const next = [...prev];
        while (next.length <= index) {
          next.push(false);
        }
        next[index] = !next[index];
        set({ trackMuted: next });
      }
    },
    resetMutedTracks: () => {
      set({ trackMuted: [] });
    },
  };
});
