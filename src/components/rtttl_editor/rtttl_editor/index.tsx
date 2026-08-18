import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaUndo, FaPalette, FaMusic } from "react-icons/fa";
import clsx from "clsx";

import { usePlayerStore } from "../../../stores/player_store";
import { useEditorSettingsStore } from "../../../stores/editor_settings_store";
import { copyToClipboard } from "../../../utils/clipboard";
import { ConfirmDialog } from "../../../components/confirm_dialog";
import { CodeEditor } from "../code_editor";
import { RtttlToolbar } from "../rtttl_toolbar";
import { SyntaxColorPanel } from "../syntax_color_panel";
import { TrackTabs, EscOutputPanel } from "../multi_track_panel";
import { LyricsPanel } from "../lyrics_panel";
import { NowPlayingPanel } from "./now_playing_panel";
import { PlaybackControls } from "./playback_controls";
import { WaveformPanel } from "./waveform_panel";
import type { CodeEditorHandle } from "../code_editor";

export function RtttlEditorMain() {
  const { t } = useTranslation();

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

  const editorPlayerState = playerState === "stopped" ? "idle" : playerState;

  const features = useEditorSettingsStore((s) => s.features);
  const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);
  const toggleFeature = useEditorSettingsStore((s) => s.toggleFeature);

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

  function handleToggleColorPanel() {
    setColorPanelOpen((isOpen) => !isOpen);
  }

  function handleCloseColorPanel() {
    setColorPanelOpen(false);
  }

  function handleToggleSyntaxHighlight() {
    toggleFeature("syntaxHighlight");
  }

  function handleTogglePlaybackTracking() {
    toggleFeature("playbackTracking");
  }

  function handleToggleLyricsMode() {
    setLyricsMode((isLyricsMode) => !isLyricsMode);
  }

  function handlePlayPauseToggle() {
    if (playerState === "playing") {
      pause();
      return;
    }

    if (playerState === "paused") {
      resume();
      return;
    }

    if (isMultiTrack) {
      if (activeTrackIndex < 0) {
        playTracks(editedTracks);
      } else {
        playSoloTrack(activeTrackIndex);
      }
      return;
    }

    playCode(editedCode);
  }

  function handleOpenResetConfirm() {
    setResetConfirmOpen(true);
  }

  function handleCloseResetConfirm() {
    setResetConfirmOpen(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <NowPlayingPanel currentItem={currentItem} />

      <WaveformPanel
        isMultiTrack={isMultiTrack}
        editedTracks={editedTracks}
        editedCode={editedCode}
        isPlayingEdited={isPlayingEdited}
        trackNoteIndices={trackNoteIndices}
        currentNoteIndex={currentNoteIndex}
        trackTotalNotes={trackTotalNotes}
        totalNotes={totalNotes}
        onSeek={isPlayingEdited ? seekTo : undefined}
      />

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          {t("editor.title")}
        </h3>
        <div className="relative">
          <button
            ref={paletteButtonRef}
            type="button"
            onClick={handleToggleColorPanel}
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
              <SyntaxColorPanel onClose={handleCloseColorPanel} />
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={features.syntaxHighlight}
            onChange={handleToggleSyntaxHighlight}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.syntaxHighlight", { defaultValue: "Syntax Highlighting" })}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={features.playbackTracking}
            onChange={handleTogglePlaybackTracking}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          {t("editor.feature.playbackTracking", { defaultValue: "Follow Playback" })}
        </label>
      </div>

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

      <div className="mb-1 flex items-center justify-between">
        <RtttlToolbar onInsert={handleInsert} />
        <button
          type="button"
          onClick={handleToggleLyricsMode}
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

      <PlaybackControls
        displayedCode={displayedCode}
        playerState={playerState}
        copyState={copyState}
        onPlayPauseToggle={handlePlayPauseToggle}
        onStop={stop}
        onCopy={handleCopy}
      />

      {isEdited && (
        <button
          type="button"
          onClick={handleOpenResetConfirm}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <FaUndo size={12} />
          {t("editor.reset")}
        </button>
      )}

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
        onCancel={handleCloseResetConfirm}
      />
    </div>
  );
}
