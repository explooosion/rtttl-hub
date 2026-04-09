import type { RtttlNote } from "@/utils/rtttl_parser";

export interface WaveformBar {
  height: number;
  noteIndex: number;
}

export function generateBars(notes: RtttlNote[], barCount: number): WaveformBar[] {
  if (notes.length === 0) {
    return [];
  }

  const maxFreq = Math.max(...notes.filter((n) => !n.isRest).map((n) => n.frequency), 1);
  const minFreq = Math.min(
    ...notes.filter((n) => !n.isRest && n.frequency > 0).map((n) => n.frequency),
    maxFreq,
  );
  const freqRange = maxFreq - minFreq || 1;
  const totalDuration = notes.reduce((sum, n) => sum + n.durationMs, 0);
  if (totalDuration === 0) {
    return [];
  }

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
      if (noteEnd <= barStart) {
        continue;
      }
      if (noteStart >= barEnd) {
        break;
      }
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
