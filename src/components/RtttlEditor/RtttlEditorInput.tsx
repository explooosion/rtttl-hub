import { useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { usePlayerStore } from "@/stores/player-store";
import { CodeEditor } from "./CodeEditor";
import { RtttlToolbar } from "./RtttlToolbar";
import { TrackTabs } from "./MultiTrackPanel";
import type { CodeEditorHandle } from "./CodeEditor";

export interface RtttlEditorInputHandle {
  insertText: (text: string) => void;
}

interface RtttlEditorInputProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  /** Multi-track support — when provided, TrackTabs are shown above the editor. */
  tracks?: string[];
  activeTrackIndex?: number;
  onSelectTrack?: (index: number) => void;
  onAddTrack?: () => void;
  onRemoveTrack?: (index: number) => void;
}

export const RtttlEditorInput = forwardRef<RtttlEditorInputHandle, RtttlEditorInputProps>(
  function RtttlEditorInput(
    {
      value,
      onChange,
      minHeight,
      tracks,
      activeTrackIndex,
      onSelectTrack,
      onAddTrack,
      onRemoveTrack,
    },
    ref,
  ) {
    const { t } = useTranslation();

    const features = useEditorSettingsStore((s) => s.features);
    const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);

    const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
    const rawPlayerState = usePlayerStore((s) => s.playerState);
    // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
    const playerState = rawPlayerState === "stopped" ? "idle" : rawPlayerState;

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
        <RtttlToolbar onInsert={(text) => codeEditorRef.current?.insertText(text)} />
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
          onChange={onChange}
        />
      </div>
    );
  },
);
