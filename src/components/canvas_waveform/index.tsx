import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { parseRtttl } from "@/utils/rtttl_parser";
import { generateBars } from "./waveform_bar_generator";
import type { WaveformBar } from "./waveform_bar_generator";
import { drawBars } from "./waveform_canvas_renderer";
import { COLOR_PLAYED } from "./waveform_constants";

interface CanvasWaveformProps {
  code: string;
  currentNoteIndex?: number;
  totalNotes?: number;
  isPlaying?: boolean;
  onSeek?: (noteIndex: number) => void;
  progressRatio?: number;
  height?: number;
  barCount?: number;
  className?: string;
  playedColor?: string;
}

export function CanvasWaveform({
  code,
  currentNoteIndex = 0,
  totalNotes = 0,
  isPlaying = false,
  onSeek,
  progressRatio,
  height = 40,
  barCount = 60,
  className = "",
  playedColor,
}: CanvasWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(false);
  const hoverIndexRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  useEffect(function trackDarkModeChanges() {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { bars, noteCount } = useMemo(() => {
    const parsed = parseRtttl(code);
    if (!parsed || parsed.notes.length === 0) {
      return { bars: [] as WaveformBar[], noteCount: 0 };
    }
    return { bars: generateBars(parsed.notes, barCount), noteCount: parsed.notes.length };
  }, [code, barCount]);

  const effectiveTotalNotes = totalNotes > 0 ? totalNotes : noteCount;
  const progress =
    progressRatio !== undefined
      ? progressRatio
      : effectiveTotalNotes > 0
        ? (currentNoteIndex + 1) / effectiveTotalNotes
        : 0;
  const playedBarIndex = Math.floor(progress * bars.length);

  // Paint whenever deps change
  useEffect(
    function repaintWaveformWhenStateChanges() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        drawBars(
          ctx,
          bars,
          w,
          h,
          dpr,
          playedBarIndex,
          hoverIndexRef.current,
          isPlaying,
          !!onSeek,
          isDark,
          playedColor ?? COLOR_PLAYED,
        );
      });
      return () => cancelAnimationFrame(rafRef.current);
    },
    [bars, playedBarIndex, isPlaying, isDark, onSeek, playedColor],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek || effectiveTotalNotes === 0) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(Math.round(ratio * (effectiveTotalNotes - 1)));
    },
    [onSeek, effectiveTotalNotes],
  );

  const repaintHover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    drawBars(
      ctx,
      bars,
      rect.width,
      rect.height,
      dpr,
      playedBarIndex,
      hoverIndexRef.current,
      isPlaying,
      !!onSeek,
      isDark,
      playedColor ?? COLOR_PLAYED,
    );
  }, [bars, playedBarIndex, isPlaying, isDark, onSeek, playedColor]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      hoverIndexRef.current = Math.min(Math.floor(ratio * bars.length), bars.length - 1);
      repaintHover();
    },
    [onSeek, bars.length, repaintHover],
  );

  const handleMouseLeave = useCallback(() => {
    hoverIndexRef.current = null;
    repaintHover();
  }, [repaintHover]);

  if (bars.length === 0) {
    return <div className={className} style={{ height }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${onSeek ? "cursor-pointer" : ""} ${className}`}
      style={{ width: "100%", height, display: "block" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
