import { usePlayerStore } from "@/stores/player_store";
import { CanvasWaveform } from "./canvas_waveform";
import clsx from "clsx";

const TRACK_PLAYED_COLORS = [
  "rgb(99, 102, 241)",
  "rgb(16, 185, 129)",
  "rgb(245, 158, 11)",
  "rgb(244, 63, 94)",
] as const;

interface MultiTrackWaveformProps {
  tracks: string[];
  isActive: boolean;
  /** Height per mini waveform row in px (default 16). Grid total = height*2 + gap. */
  height?: number;
  barCount?: number;
}

/**
 * 2×2 grid of mini waveforms for multi-track items.
 * Each track uses its own per-track note index from the Zustand store.
 */
export function MultiTrackWaveform({
  tracks,
  isActive,
  height = 16,
  barCount = 20,
}: MultiTrackWaveformProps) {
  const playerState = usePlayerStore((s) => s.playerState);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);

  const isPlaying = isActive && (playerState === "playing" || playerState === "paused");

  return (
    <div className="grid grid-cols-2 gap-1" style={{ height: height * 2 + 4 }}>
      {([0, 1, 2, 3] as const).map((idx) => {
        const trackCode = tracks[idx] ?? "";
        return (
          <div
            key={idx}
            className={clsx(
              "overflow-hidden rounded",
              !trackCode.trim() && "bg-gray-100 dark:bg-gray-800",
            )}
          >
            {trackCode.trim() && (
              <CanvasWaveform
                code={trackCode}
                isPlaying={isPlaying}
                currentNoteIndex={isActive ? (trackNoteIndices[idx] ?? currentNoteIndex) : 0}
                height={height}
                barCount={barCount}
                playedColor={TRACK_PLAYED_COLORS[idx]}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
