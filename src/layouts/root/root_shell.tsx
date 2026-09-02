import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { FaMusic, FaPlay, FaPause, FaStop } from "react-icons/fa";

import { RootHeader } from "./root_header";
import { RootMobileSidebar } from "./root_mobile_sidebar";
import { RootFooter } from "./root_footer";
import { BetaNoticeBanner } from "../../components/beta_notice_banner";
import { CookieConsentBanner } from "../../components/cookie_consent_banner";
import { CanvasWaveform } from "../../components/canvas_waveform";
import { MultiTrackWaveform } from "../../components/multi_track_waveform";
import { useCollectionStore } from "../../stores/collection_store";
import { usePlayerStore } from "../../stores/player_store";
import { useCookieConsentStore } from "../../stores/cookie_consent_store";
import { toRtttlEntries, type CollectionEntry } from "../../utils/collection_loader";
import { formatPlaybackClock, getMaxTrackDurationMs } from "../../utils/rtttl_format";
import { CopyButton, CopyAllButton } from "../../components/copy_code_buttons";

export function RootShell() {
  const { t } = useTranslation();
  const setItems = useCollectionStore((s) => s.setItems);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const elapsedMs = usePlayerStore((s) => s.engine.getElapsedMs());
  const editedCode = usePlayerStore((s) => s.editedCode);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const playItem = usePlayerStore((s) => s.playItem);
  const resetConsent = useCookieConsentStore((s) => s.resetConsent);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleMobilePlayToggle = useCallback(
    function handleMobilePlayToggle() {
      if (!currentItem) {
        return;
      }
      if (playerState === "playing") {
        pause();
      } else if (playerState === "paused") {
        resume();
      } else {
        playItem(currentItem);
      }
    },
    [currentItem, playerState, pause, resume, playItem],
  );

  useEffect(
    function loadCollectionWhenMount() {
      const base = import.meta.env.BASE_URL;
      Promise.all([
        fetch(`${base}collections/picaxe.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
        fetch(`${base}collections/skully-rtttl.json`).then(
          (r) => r.json() as Promise<CollectionEntry[]>,
        ),
        fetch(`${base}collections/community.json`).then(
          (r) => r.json() as Promise<CollectionEntry[]>,
        ),
        fetch(`${base}collections/esphome.json`).then(
          (r) => r.json() as Promise<CollectionEntry[]>,
        ),
        fetch(`${base}collections/beepmyquad.json`).then(
          (r) => r.json() as Promise<CollectionEntry[]>,
        ),
      ])
        .then(([picaxeData, skullyData, communityData, esphomeData, beepmyquadData]) => {
          const picaxeEntries = toRtttlEntries(picaxeData, "picaxe", "picaxe");
          const skullyEntries = toRtttlEntries(skullyData, "skully-rtttl", "skully");
          const communityEntries = toRtttlEntries(communityData, "community", "community");
          const esphomeEntries = toRtttlEntries(esphomeData, "esphome", "esphome");
          const beepmyquadEntries = toRtttlEntries(beepmyquadData, "beepmyquad", "beepmyquad");
          setItems([
            ...picaxeEntries,
            ...skullyEntries,
            ...communityEntries,
            ...esphomeEntries,
            ...beepmyquadEntries,
          ]);
        })
        .catch((err) => console.error("Failed to load collection:", err));
    },
    [setItems],
  );

  const totalDurationMs = currentItem
    ? getMaxTrackDurationMs(currentItem.tracks ?? [currentItem.code])
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <FaMusic size={48} className="mx-auto mb-4 animate-pulse text-indigo-500" />
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BetaNoticeBanner />
      <RootHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <RootMobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <Outlet />

      {/* Mobile now-playing bar */}
      {currentItem && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-2 pt-2 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95 lg:hidden">
          {/* Title row + controls */}
          <div className="mb-1.5 flex items-center gap-3">
            <FaMusic
              size={14}
              className={
                playerState === "playing" ? "animate-pulse text-indigo-500" : "text-indigo-400"
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {currentItem.title}
              </p>
              {currentItem.artist && (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {currentItem.artist}
                </p>
              )}
            </div>
            {/* Play / Pause / Resume */}
            <button
              onClick={handleMobilePlayToggle}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
            >
              {playerState === "playing" ? <FaPause size={12} /> : <FaPlay size={12} />}
            </button>
            {/* Stop */}
            {(playerState === "playing" || playerState === "paused") && (
              <button
                onClick={stop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FaStop size={12} />
              </button>
            )}
          </div>
          {/* Waveform — only when there's something to show */}
          {(playerState === "playing" || playerState === "paused" || playerState === "stopped") && (
            <>
              {currentItem.tracks && currentItem.tracks.length > 1 ? (
                <MultiTrackWaveform
                  tracks={currentItem.tracks}
                  isActive
                  height={16}
                  barCount={20}
                />
              ) : (
                <CanvasWaveform
                  code={editedCode || currentItem.code}
                  currentNoteIndex={currentNoteIndex}
                  totalNotes={totalNotes}
                  isPlaying={playerState === "playing"}
                  onSeek={seekTo}
                  height={32}
                  barCount={80}
                />
              )}
              <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {formatPlaybackClock(elapsedMs)} / {formatPlaybackClock(totalDurationMs)}
              </div>

              {/* RTTTL code — horizontally scrollable so it fits narrow screens */}
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                {currentItem.tracks && currentItem.tracks.length > 1 ? (
                  <div className="max-h-32 space-y-1.5 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {currentItem.tracks.length} {t("editor.tracks", { defaultValue: "Tracks" })}
                      </span>
                      <CopyAllButton tracks={currentItem.tracks} />
                    </div>
                    {currentItem.tracks.map((trackCode, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <pre className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {trackCode}
                        </pre>
                        <CopyButton text={trackCode} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <pre className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {editedCode || currentItem.code}
                    </pre>
                    <CopyButton text={editedCode || currentItem.code} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <RootFooter resetConsent={resetConsent} />
      <CookieConsentBanner />
    </div>
  );
}
