import { useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorSettingsStore } from "@/stores/editor_settings_store";
import { usePlayerStore } from "@/stores/player_store";
import { CodeEditor } from "./code_editor";
import { RtttlToolbar } from "./rtttl_toolbar";
import { TrackTabs } from "./multi_track_panel";
import type { CodeEditorHandle } from "./code_editor";

export interface RtttlEditorInputHandle {
  insertText: (text: string) => void;
}

interface RtttlEditorInputProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  maxHeight?: string;
  fontSize?: number;
  showToolbar?: boolean;
  singleLine?: boolean;
  containerClassName?: string;
  /** Multi-track support — when provided, TrackTabs are shown above the editor. */
  tracks?: string[];
  activeTrackIndex?: number;
  onSelectTrack?: (index: number) => void;
  onAddTrack?: () => void;
  onRemoveTrack?: (index: number) => void;
  /** Override the note index used for playback highlight (e.g. per-track index in multi-track mode). */
  noteIndexOverride?: number;
}

export const RtttlEditorInput = forwardRef<RtttlEditorInputHandle, RtttlEditorInputProps>(
  function RtttlEditorInput(
    {
      value,
      onChange,
      minHeight,
      maxHeight,
      fontSize,
      showToolbar = true,
      singleLine = false,
      containerClassName,
      tracks,
      activeTrackIndex,
      onSelectTrack,
      onAddTrack,
      onRemoveTrack,
      noteIndexOverride,
    },
    ref,
  ) {
    const { t } = useTranslation();

    const features = useEditorSettingsStore((s) => s.features);
    const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);

    const storeNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
    const rawPlayerState = usePlayerStore((s) => s.playerState);
    // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
    const playerState = rawPlayerState === "stopped" ? "idle" : rawPlayerState;
    const currentNoteIndex = noteIndexOverride ?? storeNoteIndex;

    const codeEditorRef = useRef<CodeEditorHandle>(null);

    // Expose insertText to parent via forwardRef
    useEffect(
      function forwardInsertText() {
        if (!ref) {
          return;
        }
        const handle: RtttlEditorInputHandle = {
          insertText(text) {
            codeEditorRef.current?.insertText(text);
          },
        };
        if (typeof ref === "function") {
          ref(handle);
        } else {
          ref.current = handle;
        }
      },
      [ref],
    );

    return (
      <div>
        {/* Multi-track tabs */}
        {tracks && tracks.length > 0 && onSelectTrack && onAddTrack && onRemoveTrack && (
          <TrackTabs
            tracks={tracks}
            activeIndex={activeTrackIndex ?? 0}
            onSelect={onSelectTrack}
            onAdd={onAddTrack}
            onRemove={onRemoveTrack}
          />
        )}

        {/* Editor area */}
        {showToolbar && (
          <RtttlToolbar onInsert={(text) => codeEditorRef.current?.insertText(text)} />
        )}
        <CodeEditor
          ref={codeEditorRef}
          value={value}
          placeholder={t("editor.placeholder")}
          syntaxHighlight={features.syntaxHighlight}
          playbackTracking={features.playbackTracking}
          syntaxColors={syntaxColors}
          currentNoteIndex={currentNoteIndex}
          playerState={playerState}
          minHeight={minHeight}
          maxHeight={maxHeight}
          fontSize={fontSize}
          singleLine={singleLine}
          containerClassName={containerClassName}
          onChange={onChange}
        />
      </div>
    );
  },
);
