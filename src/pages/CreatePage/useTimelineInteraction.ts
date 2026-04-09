import { useState, useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import {
  PX_PER_SEC_MIN,
  PX_PER_SEC_MAX,
  PX_PER_SEC_DEFAULT,
  TIMELINE_MIN_WIDTH,
} from "./constants";

interface UseTimelineInteractionParams {
  trackListRef: React.RefObject<HTMLDivElement | null>;
  maxTrackDurationMs: number;
  setPlayheadMs: (ms: number) => void;
}

const HEADER_W = 192;

export function useTimelineInteraction({
  trackListRef,
  maxTrackDurationMs,
  setPlayheadMs,
}: UseTimelineInteractionParams) {
  const playerState = usePlayerStore((s) => s.playerState);
  const seekToMs = usePlayerStore((s) => s.seekToMs);

  const [guideMs, setGuideMs] = useState<number | null>(null);
  const [seekPositionMs, setSeekPositionMs] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(PX_PER_SEC_DEFAULT);

  const timelineWidthPx = Math.max(
    TIMELINE_MIN_WIDTH,
    Math.round((maxTrackDurationMs / 1000) * pxPerSec),
  );

  function handleTrackAreaMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackListRef.current;
    if (!el || maxTrackDurationMs <= 0) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const timelineX = e.clientX - rect.left + el.scrollLeft - HEADER_W;
    if (timelineX < 0) {
      setGuideMs(null);
      return;
    }
    setGuideMs(
      Math.max(0, Math.min(maxTrackDurationMs, (timelineX / timelineWidthPx) * maxTrackDurationMs)),
    );
  }

  function handleTrackAreaClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackListRef.current;
    if (!el || maxTrackDurationMs <= 0) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const timelineX = e.clientX - rect.left + el.scrollLeft - HEADER_W;
    if (timelineX < 0) {
      return;
    }
    const ms = Math.max(
      0,
      Math.min(maxTrackDurationMs, (timelineX / timelineWidthPx) * maxTrackDurationMs),
    );
    if (playerState === "playing") {
      seekToMs(ms);
      setPlayheadMs(ms);
    } else if (playerState === "paused") {
      // Seek the engine so resume() will play from the new position
      seekToMs(ms);
      setSeekPositionMs(ms);
      setPlayheadMs(ms);
    } else {
      setSeekPositionMs(ms);
      setPlayheadMs(ms);
    }
  }

  useEffect(
    function attachWheelZoom() {
      const el = trackListRef.current;
      if (!el) {
        return;
      }
      function onWheel(e: WheelEvent) {
        if (!e.ctrlKey && !e.metaKey) {
          return;
        }
        e.preventDefault();
        const rect = el!.getBoundingClientRect();
        const cursorOffsetPx = e.clientX - rect.left - HEADER_W;
        const scrollLeft = el!.scrollLeft;
        const cursorTimeSec = (scrollLeft + cursorOffsetPx) / pxPerSec;

        setPxPerSec((prev) => {
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          const next = Math.min(PX_PER_SEC_MAX, Math.max(PX_PER_SEC_MIN, prev * factor));
          requestAnimationFrame(() => {
            el!.scrollLeft = cursorTimeSec * next - cursorOffsetPx;
          });
          return next;
        });
      }
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    },
    [pxPerSec, trackListRef],
  );

  return {
    guideMs,
    setGuideMs,
    seekPositionMs,
    setSeekPositionMs,
    pxPerSec,
    timelineWidthPx,
    handleTrackAreaMouseMove,
    handleTrackAreaClick,
  };
}
