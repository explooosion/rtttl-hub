import { useRef, useEffect, useMemo, useCallback } from "react";
import { parseRtttl, parseRtttlOffsets } from "@/utils/rtttl_parser";
import type { RtttlNote } from "@/utils/rtttl_parser";

interface LyricsPanelProps {
  code: string;
  currentNoteIndex: number;
  isPlaying: boolean;
  onSeek?: (noteIndex: number) => void;
}

interface NoteToken {
  label: string;
  noteIndex: number;
}

function buildNoteTokens(code: string, _notes: RtttlNote[]): NoteToken[] {
  const offsets = parseRtttlOffsets(code);
  return offsets.map((offset, i) => ({
    label: code.slice(offset.from, offset.to),
    noteIndex: i,
  }));
}

function noteFreqToName(freq: number): string {
  if (freq <= 0) {
    return "—";
  }
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function LyricsPanel({ code, currentNoteIndex, isPlaying, onSeek }: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevIndexRef = useRef(-1);

  const parsed = useMemo(() => parseRtttl(code), [code]);
  const tokens = useMemo(() => {
    if (!parsed) {
      return [];
    }
    return buildNoteTokens(code, parsed.notes);
  }, [code, parsed]);

  // Highlight using direct DOM manipulation — no React re-render per frame
  useEffect(
    function highlightActiveNoteWhenPlaying() {
      if (!isPlaying) {
        // Clear all highlights when not playing
        for (const span of spanRefs.current) {
          if (span) {
            span.classList.remove("lyrics-active", "lyrics-played");
          }
        }
        prevIndexRef.current = -1;
        return;
      }

      const prev = prevIndexRef.current;
      if (prev === currentNoteIndex) {
        return;
      }

      // Mark previously active as played
      if (prev >= 0 && spanRefs.current[prev]) {
        const prevSpan = spanRefs.current[prev]!;
        prevSpan.classList.remove("lyrics-active");
        prevSpan.classList.add("lyrics-played");
      }

      // Mark all before current as played (in case of seek jumps)
      for (let i = 0; i < currentNoteIndex; i++) {
        const span = spanRefs.current[i];
        if (span && !span.classList.contains("lyrics-played")) {
          span.classList.add("lyrics-played");
        }
      }

      // Clear highlights after current
      for (let i = currentNoteIndex + 1; i < spanRefs.current.length; i++) {
        const span = spanRefs.current[i];
        if (span) {
          span.classList.remove("lyrics-played", "lyrics-active");
        }
      }

      // Set active
      const activeSpan = spanRefs.current[currentNoteIndex];
      if (activeSpan) {
        activeSpan.classList.remove("lyrics-played");
        activeSpan.classList.add("lyrics-active");

        // Auto-scroll into view
        const container = containerRef.current;
        if (container) {
          const spanTop = activeSpan.offsetTop;
          const spanH = activeSpan.offsetHeight;
          const scrollTop = container.scrollTop;
          const viewH = container.clientHeight;
          if (spanTop < scrollTop || spanTop + spanH > scrollTop + viewH) {
            container.scrollTop = spanTop - viewH / 3;
          }
        }
      }

      prevIndexRef.current = currentNoteIndex;
    },
    [isPlaying, currentNoteIndex],
  );

  const handleClick = useCallback(
    (noteIndex: number) => {
      if (onSeek) {
        onSeek(noteIndex);
      }
    },
    [onSeek],
  );

  if (tokens.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-600">
        No notes
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="lyrics-panel overflow-y-auto rounded-md bg-gray-50 px-3 py-2 font-mono text-sm leading-relaxed dark:bg-gray-800/50"
      style={{ maxHeight: 200 }}
    >
      <div className="flex flex-wrap gap-1">
        {tokens.map((token, i) => {
          const note = parsed?.notes[i];
          const isRest = note?.isRest ?? false;
          return (
            <span
              key={i}
              ref={(el) => {
                spanRefs.current[i] = el;
              }}
              className={`lyrics-note inline-block rounded px-1.5 py-0.5 transition-colors ${
                isRest ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
              } ${onSeek ? "cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30" : ""}`}
              title={note ? (isRest ? "Rest" : noteFreqToName(note.frequency)) : ""}
              onClick={() => handleClick(i)}
            >
              {token.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
