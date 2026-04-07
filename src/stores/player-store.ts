import { create } from "zustand";
import { RtttlPlayer } from "@/utils/rtttl-player";
import type { PlayerState } from "@/utils/rtttl-player";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import { useListenedStore } from "./listened-store";

interface PlayerStoreState {
  currentItem: RtttlEntry | null;
  playerState: PlayerState;
  currentNoteIndex: number;
  totalNotes: number;
  editedCode: string;
  player: RtttlPlayer;
  setCurrentItem: (item: RtttlEntry) => void;
  playItem: (item: RtttlEntry) => void;
  playCode: (code: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (noteIndex: number) => void;
  setEditedCode: (code: string) => void;
}

const player = new RtttlPlayer();

export const usePlayerStore = create<PlayerStoreState>((set, get) => {
  player.setCallback((state) => {
    set({
      playerState: state.state,
      currentNoteIndex: state.currentNoteIndex,
      totalNotes: state.totalNotes,
    });
  });

  return {
    currentItem: null,
    playerState: "idle",
    currentNoteIndex: 0,
    totalNotes: 0,
    editedCode: "",
    player,
    setCurrentItem: (item) => {
      set({ currentItem: item, editedCode: item.code });
    },
    playItem: (item) => {
      set({ currentItem: item, editedCode: item.code });
      useListenedStore.getState().markListened(item.id);
      get().player.play(item.code);
    },
    playCode: (code) => {
      const currentItem = get().currentItem;
      if (currentItem) {
        useListenedStore.getState().markListened(currentItem.id);
      }
      get().player.play(code);
    },
    pause: () => {
      get().player.pause();
    },
    resume: () => {
      get().player.resume();
    },
    stop: () => {
      get().player.stop();
    },
    seekTo: (noteIndex) => {
      get().player.seekTo(noteIndex);
    },
    setEditedCode: (editedCode) => set({ editedCode }),
  };
});
