import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaPlay, FaPause, FaRegCopy, FaCheck } from "react-icons/fa";
import clsx from "clsx";

import { usePlayerStore } from "../stores/player_store";
import { useListenedStore } from "../stores/listened_store";
import { FavoriteButton } from "./favorite_button";
import { CanvasWaveform as Waveform } from "./canvas_waveform";
import { MultiTrackWaveform } from "./multi_track_waveform";
import { copyToClipboard } from "../utils/clipboard";
import type { RtttlCategory, RtttlEntry } from "../utils/rtttl_parser";

const CATEGORY_STYLES: Record<RtttlCategory, string> = {
  pop: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  rock: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  classical: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "movie-tv": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  game: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  holiday: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  folk: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  nursery: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  alert: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  original: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

export interface TrackRowAction {
  icon: React.ReactNode;
  title: string;
  onClick: (item: RtttlEntry) => void;
}

interface TrackRowProps {
  item: RtttlEntry;
  extraActions?: TrackRowAction[];
}

export function TrackRow({ item, extraActions }: TrackRowProps) {
  const { t } = useTranslation();
  const playItem = usePlayerStore((s) => s.playItem);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const pause = usePlayerStore((s) => s.pause);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const listenedIds = useListenedStore((s) => s.listenedIds);
  const [copied, setCopied] = useState(false);

  const isActive = currentItem?.id === item.id;
  const isListened = listenedIds.includes(item.id);
  const isItemPlaying = isActive && playerState === "playing";

  const handleCopy = useCallback(async () => {
    const text = item.tracks && item.tracks.length > 1 ? item.tracks.join("\n") : item.code;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [item.code, item.tracks]);

  return (
    <div
      className={clsx(
        "flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-indigo-50 dark:border-gray-800 dark:hover:bg-indigo-950/30",
        isActive && "bg-indigo-50 dark:bg-indigo-950/30",
        !isActive && isListened && "bg-amber-50/30 dark:bg-amber-950/10",
      )}
      onClick={() => setCurrentItem(item)}
    >
      {/* Play/Pause button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isItemPlaying) {
            pause();
          } else {
            playItem(item);
          }
        }}
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
          isItemPlaying
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900",
        )}
      >
        {isItemPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
      </button>

      {/* Title + artist + category */}
      <div className="w-28 shrink-0 sm:w-36">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
        {item.artist && (
          <p className="truncate text-xs">
            <Link
              to={`/creators/${encodeURIComponent(item.artist)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              {item.artist}
            </Link>
          </p>
        )}
        {item.categories && item.categories.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {item.categories.map((cat) => (
              <span
                key={cat}
                className={clsx(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  CATEGORY_STYLES[cat],
                )}
              >
                {t(`categories.${cat}`)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="hidden min-w-0 flex-1 sm:block" onClick={(e) => e.stopPropagation()}>
        {item.tracks && item.tracks.length > 1 ? (
          <MultiTrackWaveform tracks={item.tracks} isActive={isActive} height={16} barCount={20} />
        ) : (
          <Waveform
            code={item.code}
            currentNoteIndex={isActive ? currentNoteIndex : 0}
            totalNotes={isActive ? totalNotes : 0}
            isPlaying={isActive && (playerState === "playing" || playerState === "paused")}
            onSeek={isActive ? seekTo : undefined}
            height={36}
            barCount={50}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <FavoriteButton itemId={item.id} size={18} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          title={t("editor.copyCode")}
        >
          {copied ? <FaCheck size={18} className="text-green-500" /> : <FaRegCopy size={18} />}
        </button>
        {extraActions?.map((action, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(item);
            }}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            title={action.title}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

interface LetterHeaderProps {
  letter: string;
}

export function LetterHeader({ letter }: LetterHeaderProps) {
  return (
    <div className="flex items-center bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{letter}</span>
    </div>
  );
}
