import { useEffect, useRef } from "react";

import { usePlayerStore } from "../../../stores/player_store";
import { usePlayheadStore } from "../../../stores/playhead_store";
import { TIMELINE_MIN_WIDTH } from "../constants";

interface UsePlaybackLoopParams {
  trackListRef: React.RefObject<HTMLDivElement | null>;
  maxTrackDurationMs: number;
  timelineWidthPx: number;
  pxPerSec: number;
  seekPositionMs: number;
  loopInMs: number | null;
  loopOutMs: number | null;
}

const HEADER_W = 192;
const PLAYHEAD_COMMIT_STEP_MS = 80;

export function usePlaybackLoop({
  trackListRef,
  maxTrackDurationMs,
  timelineWidthPx,
  pxPerSec,
  seekPositionMs,
  loopInMs,
  loopOutMs,
}: UsePlaybackLoopParams) {
  const playerState = usePlayerStore((s) => s.playerState);
  const engine = usePlayerStore((s) => s.engine);

  const rafRef = useRef(0);
  const pxPerSecRef = useRef(pxPerSec);
  const maxDurRef = useRef(maxTrackDurationMs);
  const loopInRef = useRef(loopInMs);
  const loopOutRef = useRef(loopOutMs);
  const pendingMsRef = useRef<number | null>(null);
  const committedMsRef = useRef(0);

  useEffect(function syncPxPerSecRef() {
    pxPerSecRef.current = pxPerSec;
  });

  useEffect(function syncMaxDurRef() {
    maxDurRef.current = maxTrackDurationMs;
  });

  useEffect(function syncLoopRefs() {
    loopInRef.current = loopInMs;
    loopOutRef.current = loopOutMs;
  });

  useEffect(
    function autoScrollWhenPlaying() {
      if (playerState !== "playing") {
        cancelAnimationFrame(rafRef.current);
        return;
      }
      const animate = () => {
        const el = trackListRef.current;
        if (!el) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        const elapsed = engine.getElapsedMs();
        const dur = maxDurRef.current;
        if (dur <= 0) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        const tw = Math.max(TIMELINE_MIN_WIDTH, Math.round((dur / 1000) * pxPerSecRef.current));
        const playheadPx = HEADER_W + (elapsed / dur) * tw;
        const leftPct = Math.min(100, (elapsed / dur) * 100);

        el.style.setProperty("--playhead-px", `${playheadPx}px`);
        el.style.setProperty("--playhead-left", `${leftPct}%`);
        const clampedMs = Math.min(dur, elapsed);
        pendingMsRef.current = clampedMs;
        if (
          Math.abs(clampedMs - committedMsRef.current) >= PLAYHEAD_COMMIT_STEP_MS ||
          clampedMs >= dur
        ) {
          committedMsRef.current = clampedMs;
          usePlayheadStore.getState().setPlayheadMs(clampedMs);
        }

        // A-B loop enforcement
        const loopIn = loopInRef.current;
        const loopOut = loopOutRef.current;
        if (loopIn !== null && loopOut !== null && loopOut > loopIn && elapsed >= loopOut) {
          engine.seekToMs(loopIn);
        }

        const visible = el.clientWidth;
        const rightEdge = el.scrollLeft + visible * 0.7;
        if (playheadPx > rightEdge || playheadPx < el.scrollLeft + HEADER_W) {
          el.scrollLeft = Math.max(0, playheadPx - visible * 0.3);
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(rafRef.current);
        if (pendingMsRef.current !== null) {
          committedMsRef.current = pendingMsRef.current;
          usePlayheadStore.getState().setPlayheadMs(pendingMsRef.current);
          pendingMsRef.current = null;
        }
      };
    },
    [playerState, engine, trackListRef],
  );

  useEffect(
    function syncPlayheadCssVarsWhenNotPlaying() {
      if (playerState === "playing") {
        return;
      }
      const apply = () => {
        const el = trackListRef.current;
        if (!el || maxTrackDurationMs <= 0) {
          return;
        }
        const pos =
          playerState !== "idle" ? usePlayheadStore.getState().playheadMs : seekPositionMs;
        const pct = Math.min(100, (pos / maxTrackDurationMs) * 100);
        const px = HEADER_W + (pos / maxTrackDurationMs) * timelineWidthPx;
        el.style.setProperty("--playhead-left", `${pct}%`);
        el.style.setProperty("--playhead-px", `${px}px`);
      };
      apply();
      if (playerState === "idle") {
        return;
      }
      return usePlayheadStore.subscribe(apply);
    },
    [playerState, seekPositionMs, maxTrackDurationMs, timelineWidthPx, trackListRef],
  );
}
