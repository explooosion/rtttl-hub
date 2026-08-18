import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CanvasWaveform as Waveform } from "../../../components/canvas_waveform";

interface TrackWaveformPanelProps {
  isMuted: boolean;
  timelineWidthPx: number;
  isValid: boolean;
  code: string;
  totalMs: number;
  trackDurationMs: number;
  isPreviewActive: boolean;
  currentTrackNoteIndex: number;
  trackTotalNotes: number[];
  index: number;
  totalNotes: number;
  playheadMs: number;
  trackColor: string;
}

export function TrackWaveformPanel({
  isMuted,
  timelineWidthPx,
  isValid,
  code,
  totalMs,
  trackDurationMs,
  isPreviewActive,
  currentTrackNoteIndex,
  trackTotalNotes,
  index,
  totalNotes,
  playheadMs,
  trackColor,
}: TrackWaveformPanelProps) {
  const { t } = useTranslation();

  const waveformPx =
    totalMs > 0 && trackDurationMs > 0
      ? Math.round((trackDurationMs / totalMs) * (timelineWidthPx - 8))
      : timelineWidthPx - 8;

  const waveBarCount = Math.max(10, Math.min(240, Math.floor((waveformPx + 1) / 3)));

  const widthPercent =
    totalMs > 0 && trackDurationMs > 0
      ? `${Math.round((trackDurationMs / totalMs) * 100)}%`
      : "100%";

  return (
    <div
      className={clsx("flex shrink-0 flex-col transition-opacity", isMuted && "opacity-40")}
      style={{ width: timelineWidthPx }}
    >
      <div className="bg-gray-300/60 px-1 py-1 dark:bg-gray-900/30">
        <div className="h-10 overflow-hidden rounded">
          {isValid ? (
            <div style={{ width: widthPercent, height: "100%" }}>
              <Waveform
                code={code.trim()}
                isPlaying={isPreviewActive}
                currentNoteIndex={currentTrackNoteIndex}
                totalNotes={trackTotalNotes[index] ?? totalNotes}
                progressRatio={
                  trackDurationMs > 0 ? Math.min(1, playheadMs / trackDurationMs) : undefined
                }
                height={40}
                barCount={waveBarCount}
                playedColor={trackColor}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-300 dark:text-gray-700">
              {code.trim()
                ? t("create.invalidCode")
                : t("editor.placeholder", { defaultValue: "Enter RTTTL code…" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
