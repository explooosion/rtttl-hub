import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { TimeRuler } from "./time_ruler";
import { TrackLane } from "./track_lane";
import { MAX_TRACKS } from "./constants";
import { usePlayerStore } from "../../stores/player_store";
import type { RtttlEditorInputHandle } from "../../components/rtttl_editor/rtttl_editor_input";

interface CreatePageTrackAreaProps {
  trackListRef: React.RefObject<HTMLDivElement | null>;
  trackRowsRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
  tracks: string[];
  trackIds: string[];
  trackColors: string[];
  expandedTracks: Set<number>;
  deactivatedTracks: Set<number>;
  trackEditorRefs: React.MutableRefObject<(RtttlEditorInputHandle | null)[]>;
  focusedTrackIndex: number;
  maxTrackDurationMs: number;
  timelineWidthPx: number;
  pxPerSec: number;
  playheadMs: number;
  seekPositionMs: number;
  loopInMs: number | null;
  loopOutMs: number | null;
  guideMs: number | null;
  playerState: "idle" | "playing" | "paused" | "stopped";
  dndSensors: SensorDescriptor<SensorOptions>[];
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onFocusTrack: (idx: number) => void;
  onToggleExpand: (idx: number) => void;
  onTrackCodeChange: (idx: number, val: string) => void;
  onRemoveTrack: (idx: number) => void;
  onRenameTrack: (idx: number, newName: string) => void;
  onDuplicateTrack: (idx: number) => void;
  onDeactivateTrack: (idx: number) => void;
  onColorChange: (idx: number, color: string) => void;
  onAddTrack: () => void;
}

export function CreatePageTrackArea({
  trackListRef,
  trackRowsRef,
  tracks,
  trackIds,
  trackColors,
  expandedTracks,
  deactivatedTracks,
  trackEditorRefs,
  focusedTrackIndex,
  maxTrackDurationMs,
  timelineWidthPx,
  pxPerSec,
  playheadMs,
  seekPositionMs,
  loopInMs,
  loopOutMs,
  guideMs,
  playerState,
  dndSensors,
  onMouseMove,
  onMouseLeave,
  onClick,
  onDragEnd,
  onFocusTrack,
  onToggleExpand,
  onTrackCodeChange,
  onRemoveTrack,
  onRenameTrack,
  onDuplicateTrack,
  onDeactivateTrack,
  onColorChange,
  onAddTrack,
}: CreatePageTrackAreaProps) {
  const { t } = useTranslation();
  const playCode = usePlayerStore((s) => s.playCode);
  const stop = usePlayerStore((s) => s.stop);
  const isMultiTrack = usePlayerStore((s) => s.isMultiTrack);
  const activeTrackIndex = usePlayerStore((s) => s.activeTrackIndex);
  const setActiveTrackIndex = usePlayerStore((s) => s.setActiveTrackIndex);

  const handleTrackSoloPlayToggle = useCallback(
    function handleTrackSoloPlayToggle(index: number, code: string) {
      if (!isMultiTrack && activeTrackIndex === index && playerState !== "idle") {
        stop();
        return;
      }

      if (!code.trim()) {
        return;
      }

      const startMs = seekPositionMs > 0 ? seekPositionMs : undefined;
      playCode(code.trim(), startMs);
      setActiveTrackIndex(index);
    },
    [
      isMultiTrack,
      activeTrackIndex,
      playerState,
      stop,
      seekPositionMs,
      playCode,
      setActiveTrackIndex,
    ],
  );

  const displayMs = playerState !== "idle" ? playheadMs : seekPositionMs;

  const trackRowRefHandlers = useMemo(
    function buildTrackRowRefHandlers() {
      return tracks.map((_, idx) => {
        return function handleTrackRowRef(el: HTMLDivElement | null) {
          trackRowsRef.current[idx] = el;
        };
      });
    },
    [tracks, trackRowsRef],
  );

  const editorRefHandlers = useMemo(
    function buildEditorRefHandlers() {
      return tracks.map((_, idx) => {
        return function handleEditorRef(handle: RtttlEditorInputHandle | null) {
          trackEditorRefs.current[idx] = handle;
        };
      });
    },
    [tracks, trackEditorRefs],
  );

  const colorChangeHandlers = useMemo(
    function buildColorChangeHandlers() {
      return tracks.map((_, idx) => {
        return function handleColorChange(color: string) {
          onColorChange(idx, color);
        };
      });
    },
    [tracks, onColorChange],
  );

  const focusHandlers = useMemo(
    function buildFocusHandlers() {
      return tracks.map((_, idx) => {
        return function handleFocusTrack() {
          onFocusTrack(idx);
        };
      });
    },
    [tracks, onFocusTrack],
  );

  const expandHandlers = useMemo(
    function buildExpandHandlers() {
      return tracks.map((_, idx) => {
        return function handleToggleExpand() {
          onToggleExpand(idx);
        };
      });
    },
    [tracks, onToggleExpand],
  );

  const codeChangeHandlers = useMemo(
    function buildCodeChangeHandlers() {
      return tracks.map((_, idx) => {
        return function handleTrackCodeChange(value: string) {
          onTrackCodeChange(idx, value);
        };
      });
    },
    [tracks, onTrackCodeChange],
  );

  const removeHandlers = useMemo(
    function buildRemoveHandlers() {
      return tracks.map((_, idx) => {
        return function handleRemoveTrack() {
          onRemoveTrack(idx);
        };
      });
    },
    [tracks, onRemoveTrack],
  );

  const renameHandlers = useMemo(
    function buildRenameHandlers() {
      return tracks.map((_, idx) => {
        return function handleRenameTrack(newName: string) {
          onRenameTrack(idx, newName);
        };
      });
    },
    [tracks, onRenameTrack],
  );

  const duplicateHandlers = useMemo(
    function buildDuplicateHandlers() {
      return tracks.map((_, idx) => {
        return function handleDuplicateTrack() {
          onDuplicateTrack(idx);
        };
      });
    },
    [tracks, onDuplicateTrack],
  );

  const deactivateHandlers = useMemo(
    function buildDeactivateHandlers() {
      return tracks.map((_, idx) => {
        return function handleDeactivateTrack() {
          onDeactivateTrack(idx);
        };
      });
    },
    [tracks, onDeactivateTrack],
  );

  const soloPlayToggleHandlers = useMemo(
    function buildSoloPlayToggleHandlers() {
      return tracks.map((trackCode, idx) => {
        return function handleSoloPlayToggle() {
          handleTrackSoloPlayToggle(idx, trackCode);
        };
      });
    },
    [tracks, handleTrackSoloPlayToggle],
  );

  const handleAddTrackClick = useCallback(
    function handleAddTrackClick(e: React.MouseEvent<HTMLButtonElement>) {
      e.stopPropagation();
      onAddTrack();
    },
    [onAddTrack],
  );

  return (
    <div
      ref={trackListRef}
      className="relative flex flex-1 flex-col overflow-x-auto overflow-y-auto border border-gray-400 bg-gray-300 pb-12 dark:border-gray-800 dark:bg-gray-900"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Inner width driver — forces scrollWidth of the overflow-x-auto container */}
      <div className="relative" style={{ minWidth: `calc(12rem + ${timelineWidthPx}px)` }}>
        <TimeRuler
          totalMs={maxTrackDurationMs}
          timelineWidthPx={timelineWidthPx}
          pxPerSec={pxPerSec}
        />

        {/* Global playhead line */}
        {maxTrackDurationMs > 0 &&
          (playerState !== "idle" || seekPositionMs > 0 || playheadMs > 0) && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-gray-600/80 dark:bg-white/90"
              style={{
                left: `var(--playhead-px, ${192 + (displayMs / maxTrackDurationMs) * timelineWidthPx}px)`,
              }}
            />
          )}

        {/* A marker line */}
        {loopInMs !== null && maxTrackDurationMs > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-[21] w-0.5 bg-indigo-500/70 dark:bg-indigo-400/80"
            style={{ left: `${192 + (loopInMs / maxTrackDurationMs) * timelineWidthPx}px` }}
          />
        )}

        {/* B marker line */}
        {loopOutMs !== null && maxTrackDurationMs > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-[21] w-0.5 bg-purple-500/70 dark:bg-purple-400/80"
            style={{ left: `${192 + (loopOutMs / maxTrackDurationMs) * timelineWidthPx}px` }}
          />
        )}

        {/* Hover guide line */}
        {guideMs !== null && maxTrackDurationMs > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-indigo-500/60 dark:bg-indigo-400/60"
            style={{ left: `${192 + (guideMs / maxTrackDurationMs) * timelineWidthPx}px` }}
          />
        )}

        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
            <div className="flex cursor-crosshair flex-col gap-3 py-3">
              {tracks.map((trackCode, idx) => (
                <div key={trackIds[idx]} ref={trackRowRefHandlers[idx]}>
                  <TrackLane
                    key={trackIds[idx]}
                    id={trackIds[idx]!}
                    index={idx}
                    code={trackCode}
                    totalMs={maxTrackDurationMs}
                    timelineWidthPx={timelineWidthPx}
                    playheadMs={displayMs}
                    isFocused={focusedTrackIndex === idx}
                    isExpanded={expandedTracks.has(idx)}
                    isDeactivated={deactivatedTracks.has(idx)}
                    canRemove={tracks.length > 1}
                    canDuplicate={tracks.length < MAX_TRACKS}
                    trackColor={trackColors[idx] ?? `rgb(99, 102, 241)`}
                    onColorChange={colorChangeHandlers[idx]!}
                    onFocus={focusHandlers[idx]!}
                    onToggleExpand={expandHandlers[idx]!}
                    onChange={codeChangeHandlers[idx]!}
                    onRemove={removeHandlers[idx]!}
                    onRename={renameHandlers[idx]!}
                    onDuplicate={duplicateHandlers[idx]!}
                    onDeactivate={deactivateHandlers[idx]!}
                    canSoloPlay={trackCode.trim().length > 0}
                    isSoloPlaying={
                      !isMultiTrack && activeTrackIndex === idx && playerState !== "idle"
                    }
                    onSoloPlayToggle={soloPlayToggleHandlers[idx]!}
                    editorRef={editorRefHandlers[idx]!}
                  />
                </div>
              ))}

              {tracks.length < MAX_TRACKS && (
                <button
                  type="button"
                  onClick={handleAddTrackClick}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
                >
                  <FaPlus size={11} />
                  {t("editor.addTrack", { defaultValue: "Add Track" })}
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
