import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaRegCopy,
  FaCheck,
  FaUndo,
  FaPalette,
  FaMusic,
} from "react-icons/fa";
import clsx from "clsx";
import { usePlayerStore } from "@/stores/player_store";
import { useEditorSettingsStore } from "@/stores/editor_settings_store";
import { copyToClipboard } from "@/utils/clipboard";
import { CanvasWaveform as Waveform } from "@/components/canvas_waveform";
import { ConfirmDialog } from "@/components/confirm_dialog";
import { CodeEditor } from "./code_editor";
import { RtttlToolbar } from "./rtttl_toolbar";
import { SyntaxColorPanel } from "./syntax_color_panel";
import { TrackTabs, EscOutputPanel } from "./multi_track_panel";
import { LyricsPanel } from "./lyrics_panel";
import type { CodeEditorHandle } from "./code_editor";

const TRACK_PLAYED_COLORS = [
  "rgb(99, 102, 241)", // indigo-500  Track 1
  "rgb(16, 185, 129)", // emerald-500 Track 2
  "rgb(245, 158, 11)", // amber-500   Track 3
  "rgb(244, 63, 94)", // rose-500    Track 4
] as const;

export function RtttlEditorMain() {
  const { t } = useTranslation();

  // Player store
  const currentItem = usePlayerStore((s) => s.currentItem);
  const editedCode = usePlayerStore((s) => s.editedCode);
  const setEditedCode = usePlayerStore((s) => s.setEditedCode);
  const playCode = usePlayerStore((s) => s.playCode);
  const playerState = usePlayerStore((s) => s.playerState);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const trackTotalNotes = usePlayerStore((s) => s.trackTotalNotes);
  const seekTo = usePlayerStore((s) => s.seekTo);

  // Multi-track state
  const isMultiTrack = usePlayerStore((s) => s.isMultiTrack);
  const editedTracks = usePlayerStore((s) => s.editedTracks);
  const activeTrackIndex = usePlayerStore((s) => s.activeTrackIndex);
  const setActiveTrackIndex = usePlayerStore((s) => s.setActiveTrackIndex);
  const setEditedTrackAt = usePlayerStore((s) => s.setEditedTrackAt);
  const addTrack = usePlayerStore((s) => s.addTrack);
  const removeTrack = usePlayerStore((s) => s.removeTrack);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const playSoloTrack = usePlayerStore((s) => s.playSoloTrack);
  const multiPlayer = usePlayerStore((s) => s.multiPlayer);

  // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
  const editorPlayerState = playerState === "stopped" ? "idle" : playerState;

  // Editor settings store
  const features = useEditorSettingsStore((s) => s.features);
  const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

  // Local UI state
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [mutedTracks, setMutedTracks] = useState<Set<number>>(new Set());
  const [lyricsMode, setLyricsMode] = useState(false);

  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);

  useEffect(
    function closeColorPanelOnClickOutside() {
      if (!colorPanelOpen) {
        return;
      }
      function handleMouseDown(e: MouseEvent) {
        if (
          colorPanelRef.current?.contains(e.target as Node) ||
          paletteButtonRef.current?.contains(e.target as Node)
        ) {
          return;
        }
        setColorPanelOpen(false);
      }
      document.addEventListener("mousedown", handleMouseDown);
      return () => {
        document.removeEventListener("mousedown", handleMouseDown);
      };
    },
    [colorPanelOpen],
  );

  const isEdited = currentItem && editedCode !== currentItem.code;
  const isPlayingEdited = playerState === "playing" || playerState === "paused";

  // The code string currently displayed in the editor
  // When multi-track "All" is selected (activeTrackIndex === -1), show track 0
  const activeEditIdx = isMultiTrack && activeTrackIndex >= 0 ? activeTrackIndex : 0;
  const displayedCode = isMultiTrack ? (editedTracks[activeEditIdx] ?? "") : editedCode;

  const handleToggleMute = useCallback(
    (idx: number) => {
      setMutedTracks((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        multiPlayer.toggleMuteTrack(idx);
        return next;
      });
    },
    [multiPlayer],
  );

  const handleTrackCodeChange = useCallback(
    (code: string) => {
      if (isMultiTrack) {
        setEditedTrackAt(activeEditIdx, code);
      } else {
        setEditedCode(code);
      }
    },
    [isMultiTrack, activeEditIdx, setEditedTrackAt, setEditedCode],
  );

  async function handleCopy() {
    const success = await copyToClipboard(editedCode);
    if (success) {
      setCopyState("copied");
    } else {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  function handleResetConfirm() {
    if (currentItem) {
      setEditedCode(currentItem.code);
    }
    setResetConfirmOpen(false);
  }

  function handleInsert(text: string) {
    codeEditorRef.current?.insertText(text);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Now Playing info — always visible to prevent layout shift */}
      <div className="mb-3">
        <h3 className="mb-1 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          {t("player.nowPlaying")}
        </h3>
        <p
          className={clsx(
            "truncate font-medium",
            currentItem
              ? "text-gray-900 dark:text-white"
              : "italic text-gray-400 dark:text-gray-600",
          )}
        >
          {currentItem ? currentItem.title : "—"}
        </p>
        <p
          className={clsx(
            "truncate text-sm text-gray-500 dark:text-gray-400",
            !currentItem?.artist && "invisible",
          )}
        >
          {currentItem?.artist ?? "placeholder"}
        </p>
      </div>

      {/* Waveform — fixed-height container prevents layout shift when code appears */}
      <div className="mb-3">
        {isMultiTrack && editedTracks.length > 0 ? (
          /* 2×2 mini waveforms per motor */
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
          /* Single waveform */
          <div className="h-12 overflow-hidden rounded-md">
            {editedCode.trim() ? (
              <Waveform
                code={editedCode}
                currentNoteIndex={currentNoteIndex}
                totalNotes={totalNotes}
                isPlaying={isPlayingEdited}
                onSeek={isPlayingEdited ? seekTo : undefined}
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

      {/* Editor title row + palette (popup dropdown) */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          {t("editor.title")}
        </h3>
        <div className="relative">
          <button
            ref={paletteButtonRef}
            type="button"
            onClick={() => setColorPanelOpen((v) => !v)}
            title={t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700",
              colorPanelOpen && "bg-gray-100 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400",
            )}
          >
            <FaPalette size={14} />
          </button>
          {colorPanelOpen && (
            <div ref={colorPanelRef} className="absolute right-0 top-full z-50 mt-1">
              <SyntaxColorPanel onClose={() => setColorPanelOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Feature checkboxes */}
      <div className="mb-3 flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={features.syntaxHighlight}
            onChange={() => toggleFeature("syntaxHighlight")}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={features.playbackTracking}
            onChange={() => toggleFeature("playbackTracking")}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
        </label>
      </div>

      {/* Multi-track tabs — shown when 2+ tracks exist */}
      {isMultiTrack && editedTracks.length > 0 && (
        <TrackTabs
          tracks={editedTracks}
          activeIndex={activeTrackIndex}
          onSelect={setActiveTrackIndex}
          onAdd={addTrack}
          onRemove={removeTrack}
          mutedTracks={mutedTracks}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Editor area */}
      <div className="mb-1 flex items-center justify-between">
        <RtttlToolbar onInsert={handleInsert} />
        <button
          type="button"
          onClick={() => setLyricsMode((v) => !v)}
          title="Toggle Lyrics Mode"
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700",
            lyricsMode && "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
          )}
        >
          <FaMusic size={12} />
        </button>
      </div>
      {lyricsMode && isPlayingEdited ? (
        <LyricsPanel
          code={displayedCode}
          currentNoteIndex={currentNoteIndex}
          isPlaying={isPlayingEdited}
          onSeek={seekTo}
        />
      ) : (
        <CodeEditor
          ref={codeEditorRef}
          value={displayedCode}
          placeholder={t("editor.placeholder")}
          syntaxHighlight={features.syntaxHighlight}
          playbackTracking={features.playbackTracking}
          syntaxColors={syntaxColors}
          currentNoteIndex={currentNoteIndex}
          playerState={editorPlayerState}
          onChange={handleTrackCodeChange}
        />
      )}

      {/* Play controls */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            if (playerState === "playing") {
              pause();
            } else if (playerState === "paused") {
              resume();
            } else if (isMultiTrack) {
              // All tab selected (or single track): play all; specific tab: play solo
              if (activeTrackIndex < 0) {
                playTracks(editedTracks);
              } else {
                playSoloTrack(activeTrackIndex);
              }
            } else {
              playCode(editedCode);
            }
          }}
          disabled={!displayedCode.trim() && playerState === "idle"}
          className={clsx(
            "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white",
            playerState === "playing"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-emerald-600 hover:bg-emerald-700",
            !displayedCode.trim() && playerState === "idle" && "cursor-not-allowed opacity-50",
          )}
        >
          {playerState === "playing" ? (
            <>
              <FaPause size={16} />
              {t("player.pause")}
            </>
          ) : playerState === "paused" ? (
            <>
              <FaPlay size={16} />
              {t("player.resume")}
            </>
          ) : (
            <>
              <FaPlay size={16} />
              {t("player.play")}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={stop}
          disabled={playerState !== "playing" && playerState !== "paused"}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FaStop size={16} />
          {t("player.stop")}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!editedCode.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {copyState === "copied" ? (
            <>
              <FaCheck size={14} className="text-green-500" />
              {t("editor.copied", { defaultValue: "Copied!" })}
            </>
          ) : (
            <>
              <FaRegCopy size={14} />
              {t("editor.copyCode", { defaultValue: "Copy" })}
            </>
          )}
        </button>
      </div>

      {isEdited && (
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <FaUndo size={12} />
          {t("editor.reset")}
        </button>
      )}

      {/* ESC motor output — shown only in multi-track mode */}
      {isMultiTrack && editedTracks.length > 0 && (
        <div className="mt-3">
          <EscOutputPanel tracks={editedTracks} />
        </div>
      )}

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        title={t("editor.resetConfirmTitle")}
        message={t("editor.resetConfirmMessage")}
        variant="danger"
        onConfirm={handleResetConfirm}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
