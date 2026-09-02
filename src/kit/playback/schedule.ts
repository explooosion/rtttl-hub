import type { RtttlNote } from "../../utils/rtttl_parser";

export function buildCumulativeMs(notes: RtttlNote[]): number[] {
  const cum: number[] = [0];
  let acc = 0;
  for (const n of notes) {
    acc += n.durationMs;
    cum.push(acc);
  }
  return cum;
}

export function findNoteIndexAtMs(cumulativeMs: number[], ms: number): number {
  if (cumulativeMs.length <= 1) {
    return 0;
  }
  let lo = 0;
  let hi = cumulativeMs.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if ((cumulativeMs[mid] ?? 0) <= ms) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}
