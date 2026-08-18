import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { usePlayerStore } from "../../../stores/player_store";
import { useEditorSettingsStore } from "../../../stores/editor_settings_store";
import { parseRtttl, getTotalDuration } from "../../../utils/rtttl_parser";
import { validateTrackName, sanitizeTrackName } from "../../../utils/track_name_validator";
import { MAX_TRACKS } from "../constants";
import { TrackExpandedEditorRow } from "./track_expanded_editor_row";
import { TrackHeaderPanel } from "./track_header_panel";
import { TrackWaveformPanel } from "./track_waveform_panel";
import type { RtttlEditorInputHandle } from "../../../components/rtttl_editor/rtttl_editor_input";

interface TrackLaneProps {
  id: string;
  index: number;
  code: string;
  totalMs: number;
  timelineWidthPx: number;
  playheadMs: number;
  isFocused: boolean;
  isExpanded: boolean;
  isDeactivated: boolean;
  canRemove: boolean;
  canDuplicate: boolean;
  trackColor: string;
  onColorChange: (color: string) => void;
  onFocus: VoidFunction;
  onToggleExpand: VoidFunction;
  onChange: (value: string) => void;
  onRemove: VoidFunction;
  onRename: (newName: string) => void;
  onDuplicate: VoidFunction;
  onDeactivate: VoidFunction;
  canSoloPlay: boolean;
  isSoloPlaying: boolean;
  onSoloPlayToggle: VoidFunction;
  editorRef: (handle: RtttlEditorInputHandle | null) => void;
}

export function TrackLane({
  id,
  index,
  code,
  totalMs,
  timelineWidthPx,
  playheadMs,
  isFocused,
  isExpanded,
  isDeactivated,
  canRemove,
  canDuplicate,
  trackColor,
  onColorChange,
  onFocus,
  onToggleExpand,
  onChange,
  onRemove,
  onRename,
  onDuplicate,
  onDeactivate,
  canSoloPlay,
  isSoloPlaying,
  onSoloPlayToggle,
  editorRef,
}: TrackLaneProps) {
  const { t } = useTranslation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };

  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const trackTotalNotes = usePlayerStore((s) => s.trackTotalNotes);
  const trackMuted = usePlayerStore((s) => s.trackMuted);
  const toggleMuteTrack = usePlayerStore((s) => s.toggleMuteTrack);
  const fontSize = useEditorSettingsStore((s) => s.fontSize);

  const isMuted = trackMuted[index] ?? false;
  const isPreviewActive =
    playerState === "playing" || playerState === "paused" || playerState === "stopped";
  const isValid = useMemo(() => code.trim().length > 0 && parseRtttl(code.trim()) !== null, [code]);
  const trackDurationMs = useMemo(() => {
    const parsed = code.trim() ? parseRtttl(code.trim()) : null;
    return parsed ? getTotalDuration(parsed.notes) : 0;
  }, [code]);

  const currentTrackNoteIndex = trackNoteIndices[index] ?? currentNoteIndex;

  const duplicateTooltip = canDuplicate
    ? t("create.duplicateTrack", { defaultValue: "Duplicate Track" })
    : t("create.duplicateTrackLimit", {
        defaultValue: "Track limit reached (max {{max}})",
        max: MAX_TRACKS,
      });
  const removeTooltip = canRemove
    ? t("editor.removeTrack", { defaultValue: "Remove track" })
    : t("create.removeTrackKeepOne", {
        defaultValue: "At least one track is required",
      });
  const clearCodeTitle = t("create.clearTrackCode", { defaultValue: "Clear code" });

  const trackName = useMemo(() => {
    if (!code.trim()) {
      return `Track ${index + 1}`;
    }
    const colonIdx = code.indexOf(":");
    if (colonIdx > 0) {
      return code.slice(0, colonIdx).trim() || `Track ${index + 1}`;
    }
    return `Track ${index + 1}`;
  }, [code, index]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    function focusInputWhenEditing() {
      if (isEditingName) {
        nameInputRef.current?.select();
      }
    },
    [isEditingName],
  );

  function handleNameClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDraftName(trackName);
    setNameError(null);
    setIsEditingName(true);
  }

  function handleNameChange(value: string) {
    setDraftName(value);
    const validation = validateTrackName(value);
    if (!validation.valid && validation.error) {
      setNameError(validation.error);
    } else {
      setNameError(null);
    }
  }

  function commitName() {
    const validation = validateTrackName(draftName);

    if (!validation.valid) {
      const sanitized = sanitizeTrackName(draftName);
      if (sanitized && validateTrackName(sanitized).valid) {
        onRename(sanitized);
        setIsEditingName(false);
        setNameError(null);
      } else {
        setNameError(validation.error || "trackNameRequired");
        return;
      }
    } else {
      const trimmed = draftName.trim();
      if (trimmed !== trackName) {
        onRename(trimmed);
      }
      setIsEditingName(false);
      setNameError(null);
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  }

  function handleContainerPaste(e: React.ClipboardEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".cm-editor")) {
      return;
    }
    const pasted = e.clipboardData?.getData("text") ?? "";
    const colonIdx = pasted.indexOf(":");
    if (colonIdx <= 0) {
      return;
    }
    const pastedName = pasted.slice(0, colonIdx).trim();
    if (!/^[\w\s-]+$/.test(pastedName)) {
      return;
    }
    if (pasted.slice(colonIdx + 1).trim().length === 0) {
      return;
    }
    e.preventDefault();
    onChange(pasted.trim());
  }

  function handleStopPropagation(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function handleTrackColorButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    colorInputRef.current?.click();
  }

  function handleTrackColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    onColorChange(e.target.value);
  }

  function handleNameInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleNameChange(e.target.value);
  }

  function handleExpandButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onToggleExpand();
  }

  function handleMuteButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    toggleMuteTrack(index);
  }

  function handleDuplicateButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (canDuplicate) {
      onDuplicate();
    }
  }

  function handleDeactivateButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onDeactivate();
  }

  function handleRemoveButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (canRemove) {
      onRemove();
    }
  }

  function handleSoloPlayToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onSoloPlayToggle();
  }

  function handleExpandedEditorAreaClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  function handleClearCodeClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onChange(`${trackName}:`);
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      className={clsx(
        "flex flex-col border border-gray-400 shadow-sm transition-opacity dark:border-gray-800",
        isFocused && "ring-2 ring-indigo-400/60",
        isDeactivated && "opacity-40 grayscale",
      )}
      onClick={onFocus}
      onPaste={handleContainerPaste}
    >
      <div className="flex">
        <TrackHeaderPanel
          listeners={listeners}
          trackColor={trackColor}
          colorInputRef={colorInputRef}
          onTrackColorInputChange={handleTrackColorInputChange}
          onTrackColorButtonClick={handleTrackColorButtonClick}
          onStopPropagation={handleStopPropagation}
          isEditingName={isEditingName}
          nameInputRef={nameInputRef}
          draftName={draftName}
          nameError={nameError}
          onNameInputChange={handleNameInputChange}
          onNameInputBlur={commitName}
          onNameInputKeyDown={handleNameKeyDown}
          onNameClick={handleNameClick}
          trackName={trackName}
          isExpanded={isExpanded}
          onExpandButtonClick={handleExpandButtonClick}
          isMuted={isMuted}
          onMuteButtonClick={handleMuteButtonClick}
          canDuplicate={canDuplicate}
          duplicateTooltip={duplicateTooltip}
          onDuplicateButtonClick={handleDuplicateButtonClick}
          isDeactivated={isDeactivated}
          onDeactivateButtonClick={handleDeactivateButtonClick}
          canRemove={canRemove}
          removeTooltip={removeTooltip}
          onRemoveButtonClick={handleRemoveButtonClick}
          canSoloPlay={canSoloPlay}
          isSoloPlaying={isSoloPlaying}
          onSoloPlayToggleClick={handleSoloPlayToggleClick}
        />

        <TrackWaveformPanel
          isMuted={isMuted}
          timelineWidthPx={timelineWidthPx}
          isValid={isValid}
          code={code}
          totalMs={totalMs}
          trackDurationMs={trackDurationMs}
          isPreviewActive={isPreviewActive}
          currentTrackNoteIndex={currentTrackNoteIndex}
          trackTotalNotes={trackTotalNotes}
          index={index}
          totalNotes={totalNotes}
          playheadMs={playheadMs}
          trackColor={trackColor}
        />
      </div>

      {isExpanded && (
        <TrackExpandedEditorRow
          onContainerClick={handleExpandedEditorAreaClick}
          onClearCodeClick={handleClearCodeClick}
          clearCodeTitle={clearCodeTitle}
          code={code}
          fontSize={fontSize}
          currentTrackNoteIndex={currentTrackNoteIndex}
          editorRef={editorRef}
          onChange={onChange}
        />
      )}
    </div>
  );
}
