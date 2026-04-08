import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { parseRtttl } from "@/utils/rtttl-parser";
import type { RtttlNote } from "@/utils/rtttl-parser";

interface WaveformProps {
  code: string;
  currentNoteIndex?: number;
  totalNotes?: number;
  isPlaying?: boolean;
  onSeek?: (noteIndex: number) => void;
  height?: number;
  barCount?: number;
  className?: string;
  playedColor?: string;
}

interface WaveformBar {
  height: number; // 0–1 normalized
  noteIndex: number; // maps back to which note this bar represents
}

function generateBars(notes: RtttlNote[], barCount: number): WaveformBar[] {
  if (notes.length === 0) return [];

  const maxFreq = Math.max(...notes.filter((n) => !n.isRest).map((n) => n.frequency), 1);
  const minFreq = Math.min(
    ...notes.filter((n) => !n.isRest && n.frequency > 0).map((n) => n.frequency),
    maxFreq,
  );
  const freqRange = maxFreq - minFreq || 1;

  const totalDuration = notes.reduce((sum, n) => sum + n.durationMs, 0);
  if (totalDuration === 0) return [];

  const bars: WaveformBar[] = [];
  const barDuration = totalDuration / barCount;

  for (let i = 0; i < barCount; i++) {
    const barStart = i * barDuration;
    const barEnd = barStart + barDuration;

    let maxHeight = 0;
    let dominantNoteIdx = 0;
    let accumulatedTime = 0;

    for (let j = 0; j < notes.length; j++) {
      const noteStart = accumulatedTime;
      const noteEnd = accumulatedTime + notes[j].durationMs;
      accumulatedTime = noteEnd;

      if (noteEnd <= barStart) continue;
      if (noteStart >= barEnd) break;

      const note = notes[j];
      if (note.isRest) {
        if (maxHeight === 0) {
          maxHeight = 0.08;
          dominantNoteIdx = j;
        }
      } else {
        const normalized = 0.15 + 0.85 * ((note.frequency - minFreq) / freqRange);
        if (normalized > maxHeight) {
          maxHeight = normalized;
          dominantNoteIdx = j;
        }
      }
    }

    bars.push({ height: maxHeight || 0.08, noteIndex: dominantNoteIdx });
  }

  return bars.map((bar, i) => ({
    ...bar,
    height: Math.max(0.05, Math.min(1, bar.height * (0.7 + 0.6 * Math.abs(Math.sin(i * 0.7))))),
  }));
}

// Color constants
const COLOR_PLAYED = "rgb(99, 102, 241)"; // indigo-500
const COLOR_HOVER_LIGHT = "rgba(199, 210, 254, 0.7)"; // indigo-200 70%
const COLOR_HOVER_DARK = "rgba(165, 180, 252, 0.5)"; // indigo-300 50%
const COLOR_DEFAULT_LIGHT = "rgb(209, 213, 219)"; // gray-300
const COLOR_DEFAULT_DARK = "rgb(75, 85, 99)"; // gray-600

export function Waveform({
  code,
  currentNoteIndex = 0,
  totalNotes = 0,
  isPlaying = false,
  onSeek,
  height = 40,
  barCount = 60,
  className = "",
  playedColor,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
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
    return {
      bars: generateBars(parsed.notes, barCount),
      noteCount: parsed.notes.length,
    };
  }, [code, barCount]);

  const effectiveTotalNotes = totalNotes > 0 ? totalNotes : noteCount;
  // Use (currentNoteIndex + 1) so the bar containing the current note is shown as played
  const progress = effectiveTotalNotes > 0 ? (currentNoteIndex + 1) / effectiveTotalNotes : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || effectiveTotalNotes === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const noteIndex = Math.round(ratio * (effectiveTotalNotes - 1));
      onSeek(noteIndex);
    },
    [onSeek, effectiveTotalNotes],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const barIdx = Math.floor(ratio * bars.length);
      setHoverIndex(Math.min(barIdx, bars.length - 1));
    },
    [onSeek, bars.length],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  if (bars.length === 0) {
    return <div className={`h-[${height}px] ${className}`} />;
  }

  // Calculate the bar index that represents the current playback position
  const playedBarIndex = Math.floor(progress * bars.length);

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-px ${onSeek ? "cursor-pointer" : ""} ${className}`}
      style={{ height }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {bars.map((bar, i) => {
        const isPlayed = isPlaying && i < playedBarIndex;

        // Determine hover zone: between current playback and hover position
        let isHovered = false;
        if (hoverIndex !== null && isPlaying && onSeek) {
          const lo = Math.min(playedBarIndex, hoverIndex);
          const hi = Math.max(playedBarIndex, hoverIndex);
          isHovered = !isPlayed && i >= lo && i <= hi;
        } else if (hoverIndex !== null && !isPlaying && onSeek) {
          // Not playing: highlight from start to hover
          isHovered = i <= hoverIndex;
        }

        let bgColor: string;
        if (isPlayed) {
          bgColor = playedColor ?? COLOR_PLAYED;
        } else if (isHovered) {
          bgColor = isDark ? COLOR_HOVER_DARK : COLOR_HOVER_LIGHT;
        } else {
          bgColor = isDark ? COLOR_DEFAULT_DARK : COLOR_DEFAULT_LIGHT;
        }

        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-100"
            style={{
              height: `${bar.height * 100}%`,
              minWidth: 2,
              backgroundColor: bgColor,
            }}
          />
        );
      })}
    </div>
  );
}
