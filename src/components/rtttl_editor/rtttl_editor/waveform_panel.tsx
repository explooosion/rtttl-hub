import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CanvasWaveform as Waveform } from "../../../components/canvas_waveform";

const TRACK_PLAYED_COLORS = [
  "rgb(99, 102, 241)",
  "rgb(16, 185, 129)",
  "rgb(245, 158, 11)",
  "rgb(244, 63, 94)",
] as const;

interface WaveformPanelProps {
  isMultiTrack: boolean;
  editedTracks: string[];
  editedCode: string;
  isPlayingEdited: boolean;
  trackNoteIndices: number[];
  currentNoteIndex: number;
  trackTotalNotes: number[];
  totalNotes: number;
  onSeek?: (noteIndex: number) => void;
}

export function WaveformPanel({
  isMultiTrack,
  editedTracks,
  editedCode,
  isPlayingEdited,
  trackNoteIndices,
  currentNoteIndex,
  trackTotalNotes,
  totalNotes,
  onSeek,
}: WaveformPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-3">
      {isMultiTrack && editedTracks.length > 0 ? (
        <div className="grid h-16 grid-cols-2 gap-1.5">
          {([0, 1, 2, 3] as const).map((idx) => {
            const trackCode = editedTracks[idx] ?? "";
            return (
              <div key={idx} className="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                {trackCode.trim() ? (
                  <Waveform
                    code={trackCode}
                    isPlaying={isPlayingEdited}
                    currentNoteIndex={trackNoteIndices[idx] ?? currentNoteIndex}
                    totalNotes={trackTotalNotes[idx] ?? 0}
                    height={29}
                    barCount={25}
                    playedColor={TRACK_PLAYED_COLORS[idx]}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-12 overflow-hidden rounded-md">
          {editedCode.trim() ? (
            <Waveform
              code={editedCode}
              currentNoteIndex={currentNoteIndex}
              totalNotes={totalNotes}
              isPlaying={isPlayingEdited}
              onSeek={onSeek}
              height={48}
              barCount={50}
            />
          ) : (
            <div className="h-12 rounded-md bg-gray-100 dark:bg-gray-800" />
          )}
        </div>
      )}
      <div
        className={clsx(
          "mt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500",
          (!isPlayingEdited || totalNotes === 0) && "invisible",
        )}
      >
        <span>{t("player.note", { current: currentNoteIndex + 1, total: totalNotes })}</span>
      </div>
    </div>
  );
}
