import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { usePlayerStore } from "@/stores/player-store";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useRef, useState } from "react";

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

  // Local drag state: while dragging, show preview position without updating store
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const wasPausedRef = useRef(false);

  const displayIndex = dragging ? dragValue : currentNoteIndex;
  const progress = totalNotes > 0 ? (displayIndex / totalNotes) * 100 : 0;

  function handleSeekStart(e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) {
    wasPausedRef.current = playerState === "paused";
    if (playerState === "playing") pause();
    setDragging(true);
    const val = Number((e.target as HTMLInputElement).value);
    setDragValue(val);
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDragValue(Number(e.target.value));
  }

  function handleSeekEnd(e: React.ChangeEvent<HTMLInputElement>) {
    const noteIndex = Number(e.target.value);
    setDragging(false);
    seekTo(noteIndex);
    if (!wasPausedRef.current) {
      // seekTo will resume playing automatically (was playing before drag)
    }
  }

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

          {/* Seek track */}
          <div className="mb-3">
            <div className="relative flex items-center py-1">
              {/* Track background */}
              <div className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Draggable range */}
              <input
                type="range"
                min={0}
                max={Math.max(0, totalNotes - 1)}
                value={displayIndex}
                disabled={totalNotes === 0}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="seek-range relative w-full"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{totalNotes > 0 ? displayIndex + 1 : 0}</span>
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
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t("editor.placeholder")}
        </p>
      )}
    </div>
  );
}
