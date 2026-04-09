import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaRegCopy,
  FaCheck,
  FaVolumeMute,
  FaVolumeUp,
  FaClone,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaEraser,
} from "react-icons/fa";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePlayerStore } from "@/stores/player_store";
import { useEditorSettingsStore } from "@/stores/editor_settings_store";
import { parseRtttl, getTotalDuration } from "@/utils/rtttl_parser";
import { copyToClipboard } from "@/utils/clipboard";
import { CanvasWaveform as Waveform } from "@/components/canvas_waveform";
import { RtttlEditorInput } from "@/components/rtttl_editor/rtttl_editor_input";
import type { RtttlEditorInputHandle } from "@/components/rtttl_editor/rtttl_editor_input";
import clsx from "clsx";

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
  onFocus: () => void;
  onToggleExpand: () => void;
  onChange: (value: string) => void;
  onRemove: () => void;
  onRename: (newName: string) => void;
  onDuplicate: () => void;
  onDeactivate: () => void;
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
  const isPreviewActive = playerState === "playing" || playerState === "paused";
  const isValid = useMemo(() => code.trim().length > 0 && parseRtttl(code.trim()) !== null, [code]);
  const trackDurationMs = useMemo(() => {
    const parsed = code.trim() ? parseRtttl(code.trim()) : null;
    return parsed ? getTotalDuration(parsed.notes) : 0;
  }, [code]);

  const currentTrackNoteIndex = trackNoteIndices[index] ?? currentNoteIndex;

  /** 從 RTTTL 代碼第一個 `:` 前解析音軌名稱，無法解析時回退到 Track N。 */
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
    setIsEditingName(true);
  }

  function commitName() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== trackName) {
      onRename(trimmed);
    }
    setIsEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  }

  /** If pasted text looks like a complete RTTTL string (name:...), replace entire track code. */
  function handleContainerPaste(e: React.ClipboardEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".cm-editor")) return;
    const pasted = e.clipboardData?.getData("text") ?? "";
    const colonIdx = pasted.indexOf(":");
    if (colonIdx <= 0) return;
    const pastedName = pasted.slice(0, colonIdx).trim();
    // Must look like a valid RTTTL name (letters, digits, underscore, hyphen, space)
    if (!/^[\w\s-]+$/.test(pastedName)) return;
    // After the name there must be more content (not just an empty tail)
    if (pasted.slice(colonIdx + 1).trim().length === 0) return;
    e.preventDefault();
    onChange(pasted.trim());
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
      {/* Track lane row: Header + Waveform + NoteTimeline */}
      <div className="flex">
        {/* Left: Track Header — sticky during horizontal scroll */}
        <div className="sticky left-0 z-10 flex w-48 shrink-0 flex-col justify-between border-r border-gray-400 bg-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-900">
          {/* Row 1: drag handle + colour dot + name + expand toggle */}
          <div className="flex items-center gap-1.5">
            {/* Drag handle */}
            <button
              type="button"
              {...listeners}
              className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-700 dark:hover:text-gray-400"
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <FaGripVertical size={11} />
            </button>
            {/* Colour dot — click to open native color picker */}
            <button
              type="button"
              title={t("create.changeTrackColor", { defaultValue: "Change track color" })}
              onClick={(e) => {
                e.stopPropagation();
                colorInputRef.current?.click();
              }}
              className="relative inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-offset-1 hover:ring-2 hover:ring-white/60 focus:outline-none"
              style={{ backgroundColor: trackColor }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={trackColor}
                onChange={(e) => {
                  e.stopPropagation();
                  onColorChange(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="invisible absolute h-0 w-0"
                tabIndex={-1}
              />
            </button>
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 rounded bg-transparent px-0.5 text-xs font-semibold tracking-wide text-gray-700 outline-none ring-1 ring-inset ring-indigo-400 dark:text-gray-300"
              />
            ) : (
              <span
                className="min-w-0 flex-1 cursor-text truncate text-xs font-semibold tracking-wide text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
                onClick={handleNameClick}
                title={t("editor.clickToRename", { defaultValue: "Click to rename" })}
              >
                {trackName}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={isExpanded ? "Collapse" : "Expand"}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              {isExpanded ? <FaChevronDown size={9} /> : <FaChevronRight size={9} />}
            </button>
          </div>

          {/* Rows 2+3: flow layout — all 4 buttons in one row when space allows */}
          <div className="mt-1.5 border-t border-gray-300 pt-1.5 flex flex-wrap gap-1 dark:border-gray-700">
            {/* Mute */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMuteTrack(index);
              }}
              title={isMuted ? "Unmute" : "Mute"}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded border text-[10px] font-bold transition-colors",
                isMuted
                  ? "border-amber-400 bg-amber-400/20 text-amber-500 dark:border-amber-500 dark:text-amber-400"
                  : "border-gray-400 text-gray-500 hover:border-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300",
              )}
            >
              {isMuted ? <FaVolumeMute size={11} /> : <FaVolumeUp size={11} />}
            </button>
            {/* Duplicate */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (canDuplicate) onDuplicate();
              }}
              disabled={!canDuplicate}
              title={t("create.duplicateTrack", { defaultValue: "Duplicate Track" })}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
            >
              <FaClone size={11} />
            </button>
            {/* Deactivate */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate();
              }}
              title={
                isDeactivated
                  ? t("create.activateTrack", { defaultValue: "Activate Track" })
                  : t("create.deactivateTrack", { defaultValue: "Deactivate Track" })
              }
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded border transition-colors",
                isDeactivated
                  ? "border-gray-500 bg-gray-300/40 text-gray-600 dark:border-gray-500 dark:text-gray-400"
                  : "border-gray-400 text-gray-500 hover:border-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300",
              )}
            >
              {isDeactivated ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
            </button>
            {/* Remove */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (canRemove) onRemove();
              }}
              disabled={!canRemove}
              title={t("editor.removeTrack")}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-700 dark:hover:text-red-400"
            >
              <FaTrash size={11} />
            </button>
          </div>
        </div>

        {/* Right: Waveform at fixed pixel width */}
        <div
          className={clsx("flex shrink-0 flex-col transition-opacity", isMuted && "opacity-40")}
          style={{ width: timelineWidthPx }}
        >
          <div className="bg-gray-300/60 px-1 py-1 dark:bg-gray-900/30">
            <div className="h-10 overflow-hidden rounded">
              {isValid ? (
                (() => {
                  // Proportional pixel width of the waveform container (accounting for px-1 padding)
                  const waveformPx =
                    totalMs > 0 && trackDurationMs > 0
                      ? Math.round((trackDurationMs / totalMs) * (timelineWidthPx - 8))
                      : timelineWidthPx - 8;
                  // Each bar needs at least 3px (2px bar + 1px gap); clamp between 10 and 240
                  const waveBarCount = Math.max(
                    10,
                    Math.min(240, Math.floor((waveformPx + 1) / 3)),
                  );
                  return (
                    <div
                      style={{
                        width:
                          totalMs > 0 && trackDurationMs > 0
                            ? `${Math.round((trackDurationMs / totalMs) * 100)}%`
                            : "100%",
                        height: "100%",
                      }}
                    >
                      <Waveform
                        code={code.trim()}
                        isPlaying={isPreviewActive}
                        currentNoteIndex={currentTrackNoteIndex}
                        totalNotes={trackTotalNotes[index] ?? totalNotes}
                        progressRatio={
                          trackDurationMs > 0
                            ? Math.min(1, playheadMs / trackDurationMs)
                            : undefined
                        }
                        height={40}
                        barCount={waveBarCount}
                        playedColor={trackColor}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-300 dark:text-gray-700">
                  {code.trim()
                    ? t("create.invalidCode")
                    : t("editor.placeholder", { defaultValue: "Enter RTTTL code…" })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: single-line Code Editor */}
      {isExpanded && (
        <div className="flex border-t border-gray-200 dark:border-gray-800/50">
          {/* Sticky spacer to match the header column */}
          <div className="sticky left-0 z-10 flex w-48 shrink-0 items-center gap-1 border-t border-r border-gray-400 bg-gray-200 px-2.5 py-1.5 dark:border-gray-800 dark:bg-gray-900">
            {/* Clear code */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(`${trackName}:`);
              }}
              title={t("create.clearTrackCode", { defaultValue: "Clear code" })}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-orange-400 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-orange-700 dark:hover:text-orange-400"
            >
              <FaEraser size={11} />
            </button>
            {/* Copy */}
            <CopyButton text={code} disabled={!code.trim()} />
          </div>
          <div className="min-w-0 flex-1">
            <RtttlEditorInput
              ref={editorRef}
              value={code}
              fontSize={fontSize}
              showToolbar={false}
              containerClassName="overflow-hidden bg-gray-200 dark:bg-gray-900"
              noteIndexOverride={currentTrackNoteIndex}
              onChange={onChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void handleCopy();
      }}
      disabled={disabled}
      title="Copy"
      className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
    >
      {copied ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
    </button>
  );
}
