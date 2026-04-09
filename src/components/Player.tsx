import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { usePlayerStore } from "@/stores/player-store";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CanvasWaveform as Waveform } from "./CanvasWaveform";

export function Player() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const playCode = usePlayerStore((s) => s.playCode);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const editedCode = usePlayerStore((s) => s.editedCode);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
        {t("player.nowPlaying")}
      </h3>

      {currentItem ? (
        <>
          <div className="mb-2">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {currentItem.title}
            </p>
            {currentItem.artist && (
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                {currentItem.artist}
              </p>
            )}
          </div>

          {/* Waveform seek */}
          <div className="mb-3">
            <Waveform
              code={editedCode || currentItem.code}
              currentNoteIndex={currentNoteIndex}
              totalNotes={totalNotes}
              isPlaying={playerState === "playing" || playerState === "paused"}
              onSeek={seekTo}
              height={48}
              barCount={60}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{totalNotes > 0 ? currentNoteIndex + 1 : 0}</span>
              <span>{totalNotes}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {playerState === "playing" ? (
              <button
                onClick={pause}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                )}
              >
                <FaPause size={16} />
                {t("player.pause")}
              </button>
            ) : playerState === "paused" ? (
              <button
                onClick={resume}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                )}
              >
                <FaPlay size={16} />
                {t("player.resume")}
              </button>
            ) : (
              <button
                onClick={() => playCode(editedCode || currentItem.code)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                )}
              >
                <FaPlay size={16} />
                {t("player.play")}
              </button>
            )}
            <button
              onClick={stop}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FaStop size={16} />
              {t("player.stop")}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t("editor.placeholder")}</p>
      )}
    </div>
  );
}
