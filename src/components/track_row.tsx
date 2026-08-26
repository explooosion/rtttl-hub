import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaPlay, FaPause, FaRegCopy, FaCheck, FaHeadphones, FaEllipsisV } from "react-icons/fa";
import clsx from "clsx";

import { formatCount } from "../types/track_stats";
import { getUserDisplayName } from "../services/user_profile_service";

import { usePlayerStore } from "../stores/player_store";
import { useListenedStore } from "../stores/listened_store";
import { FavoriteButton } from "./favorite_button";
import { CanvasWaveform as Waveform } from "./canvas_waveform";
import { MultiTrackWaveform } from "./multi_track_waveform";
import { copyToClipboard } from "../utils/clipboard";
import type { RtttlCategory, RtttlEntry } from "../utils/rtttl_parser";

const CATEGORY_STYLES: Record<RtttlCategory, string> = {
  pop: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  classical: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "movie-tv": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  game: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  holiday: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  folk: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  alert: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  original: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

export interface TrackRowAction {
  icon: React.ReactNode | ((item: RtttlEntry) => React.ReactNode);
  title: string | ((item: RtttlEntry) => string);
  onClick: (item: RtttlEntry) => void;
  variant?: "default" | "danger";
}

interface TrackRowProps {
  item: RtttlEntry;
  extraActions?: TrackRowAction[];
  showActionsAsMenu?: boolean;
}

export function TrackRow({ item, extraActions, showActionsAsMenu = false }: TrackRowProps) {
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [creatorName, setCreatorName] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = currentItem?.id === item.id;
  const isListened = listenedIds.includes(item.id);
  const isItemPlaying = isActive && playerState === "playing";

  // Fetch creator display name if userId exists
  useEffect(() => {
    if (item.userId) {
      getUserDisplayName(item.userId).then(setCreatorName);
    }
  }, [item.userId]);

  // Compute static creator name (from artist field for static collections)
  const staticCreatorName = useMemo(() => {
    if (item.userId) {
      return ""; // Will be fetched dynamically
    }
    return item.artist || "";
  }, [item.userId, item.artist]);

  // Display creator name: dynamic (from userId) or static (from artist)
  const displayCreatorName = item.userId ? creatorName : staticCreatorName;

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopy = useCallback(async () => {
    const text = item.tracks && item.tracks.length > 1 ? item.tracks.join("\n") : item.code;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [item.code, item.tracks]);

  function handleSelectItem() {
    setCurrentItem(item);
  }

  function handlePlayToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (isItemPlaying) {
      pause();
    } else {
      playItem(item);
    }
  }

  function handleStopPropagation(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
  }

  function handleCopyClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    void handleCopy();
  }

  function handleMenuToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  }

  const menuActionHandlers = useMemo(
    function buildMenuActionHandlers() {
      return (extraActions ?? []).map((action) => {
        return function handleMenuActionClick(e: React.MouseEvent<HTMLButtonElement>) {
          e.stopPropagation();
          action.onClick(item);
          setMenuOpen(false);
        };
      });
    },
    [extraActions, item],
  );

  const inlineActionHandlers = useMemo(
    function buildInlineActionHandlers() {
      return (extraActions ?? []).map((action) => {
        return function handleInlineActionClick(e: React.MouseEvent<HTMLButtonElement>) {
          e.stopPropagation();
          action.onClick(item);
        };
      });
    },
    [extraActions, item],
  );

  return (
    <div
      className={clsx(
        "flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-indigo-50 dark:border-gray-800 dark:hover:bg-indigo-950/30",
        isActive && "bg-indigo-50 dark:bg-indigo-950/30",
        !isActive && isListened && "bg-amber-50/30 dark:bg-amber-950/10",
      )}
      onClick={handleSelectItem}
    >
      {/* Play/Pause button */}
      <button
        onClick={handlePlayToggleClick}
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
          isItemPlaying
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900",
        )}
      >
        {isItemPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
      </button>

      {/* Title + artist + category + stats */}
      <div className="min-w-0 flex-1 sm:w-40 sm:flex-none sm:shrink-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
        {displayCreatorName && (
          <p className="truncate text-xs">
            <Link
              to={`/creators/${encodeURIComponent(displayCreatorName)}`}
              onClick={handleStopPropagation}
              className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              {displayCreatorName}
            </Link>
          </p>
        )}
        {item.categories && item.categories.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {item.categories.map((cat) => (
              <span
                key={cat}
                className={clsx(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium leading-none",
                  CATEGORY_STYLES[cat],
                )}
              >
                {t(`categories.${cat}`)}
              </span>
            ))}
          </div>
        )}
        {/* Statistics: Play count */}
        {item.playCount !== undefined && (
          <div className="mt-1.5 flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1.5" title={t("stats.plays")}>
              <FaHeadphones size={14} />
              <span>{formatCount(item.playCount)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Waveform — sm+ shows full bar, mobile shows compact bar */}
      <div className="min-w-0 flex-1" onClick={handleStopPropagation}>
        {item.tracks && item.tracks.length > 1 ? (
          <MultiTrackWaveform tracks={item.tracks} isActive={isActive} height={16} barCount={20} />
        ) : (
          <>
            {/* Desktop waveform */}
            <div className="hidden sm:block">
              <Waveform
                code={item.code}
                currentNoteIndex={isActive ? currentNoteIndex : 0}
                totalNotes={isActive ? totalNotes : 0}
                isPlaying={
                  isActive &&
                  (playerState === "playing" ||
                    playerState === "paused" ||
                    playerState === "stopped")
                }
                onSeek={isActive ? seekTo : undefined}
                height={36}
                barCount={40}
              />
            </div>
            {/* Mobile waveform (compact) */}
            <div className="sm:hidden">
              <Waveform
                code={item.code}
                currentNoteIndex={isActive ? currentNoteIndex : 0}
                totalNotes={isActive ? totalNotes : 0}
                isPlaying={
                  isActive &&
                  (playerState === "playing" ||
                    playerState === "paused" ||
                    playerState === "stopped")
                }
                onSeek={isActive ? seekTo : undefined}
                height={20}
                barCount={30}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <FavoriteButton itemId={item.id} size={18} />
        <button
          onClick={handleCopyClick}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          title={t("editor.copyCode")}
        >
          {copied ? <FaCheck size={18} className="text-green-500" /> : <FaRegCopy size={18} />}
        </button>
        {showActionsAsMenu && extraActions && extraActions.length > 0 ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title={t("actions.more")}
            >
              <FaEllipsisV size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {extraActions.map((action, i) => {
                  const icon = typeof action.icon === "function" ? action.icon(item) : action.icon;
                  const title =
                    typeof action.title === "function" ? action.title(item) : action.title;
                  return (
                    <button
                      key={i}
                      onClick={menuActionHandlers[i]!}
                      className={clsx(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                        action.variant === "danger"
                          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700",
                      )}
                    >
                      <span className="flex w-5 items-center justify-center">{icon}</span>
                      <span>{title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          extraActions?.map((action, i) => {
            const icon = typeof action.icon === "function" ? action.icon(item) : action.icon;
            const title = typeof action.title === "function" ? action.title(item) : action.title;
            return (
              <button
                key={i}
                onClick={inlineActionHandlers[i]!}
                className="group text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title={title}
              >
                {icon}
              </button>
            );
          })
        )}
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
