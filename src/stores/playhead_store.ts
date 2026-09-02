import { create } from "zustand";

interface PlayheadState {
  playheadMs: number;
  setPlayheadMs: (ms: number) => void;
}

export const usePlayheadStore = create<PlayheadState>((set) => ({
  playheadMs: 0,
  setPlayheadMs: (ms) => set({ playheadMs: ms }),
}));
