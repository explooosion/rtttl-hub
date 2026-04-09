import { parseRtttlTimed, parseRtttlOffsets } from "./rtttl-parser";

/**
 * Returns the raw RTTTL header (everything up to and including the second colon).
 * Returns null if the header cannot be found.
 */
function extractHeader(code: string): string | null {
  const first = code.indexOf(":");
  if (first === -1) return null;
  const second = code.indexOf(":", first + 1);
  if (second === -1) return null;
  return code.slice(0, second + 1);
}

/**
 * Rebuilds an RTTTL string from a header and a list of raw note token strings.
 */
function buildRtttl(header: string, tokens: string[]): string {
  return header + tokens.join(",");
}

/**
 * Core: given the raw code and a set of noteIndex values to keep,
 * reconstruct the RTTTL string preserving all whitespace of surviving tokens.
 */
function keepNotesByIndex(code: string, indicesToKeep: Set<number>): string {
  const header = extractHeader(code);
  if (header === null) return code;

  const offsets = parseRtttlOffsets(code);
  if (offsets.length === 0) return header;

  const tokens: string[] = [];
  for (let i = 0; i < offsets.length; i++) {
    if (indicesToKeep.has(i)) {
      tokens.push(code.slice(offsets[i]!.from, offsets[i]!.to));
    }
  }

  return buildRtttl(header, tokens);
}

/**
 * Trim to Selection — keeps only the notes whose startMs falls within the
 * half-open interval [inMs, outMs).
 *
 * - inMs only  → keep notes with startMs >= inMs
 * - outMs only → keep notes with startMs < outMs
 * - both       → keep notes with inMs <= startMs < outMs
 * - neither    → return code unchanged
 *
 * Boundary strategy: based on note's startMs (snap-to-grid behaviour).
 * No sub-note splitting is performed.
 */
export function trimRtttl(code: string, inMs: number | null, outMs: number | null): string {
  if (inMs === null && outMs === null) return code;
  if (!code.trim()) return code;

  const timed = parseRtttlTimed(code);
  if (!timed) return code;

  const keep = new Set<number>();
  for (const note of timed) {
    const { startMs, noteIndex } = note;
    const afterIn = inMs === null || startMs >= inMs;
    const beforeOut = outMs === null || startMs < outMs;
    if (afterIn && beforeOut) {
      keep.add(noteIndex);
    }
  }

  return keepNotesByIndex(code, keep);
}

/**
 * Delete Selection — removes notes whose startMs falls within the
 * half-open interval [inMs, outMs) and keeps everything outside.
 *
 * - inMs only  → remove notes with startMs >= inMs (keep start to inMs)
 * - outMs only → remove notes with startMs < outMs (keep outMs to end)
 * - both       → remove notes in [inMs, outMs), keep both ends
 * - neither    → return code unchanged
 */
export function deleteRegionRtttl(code: string, inMs: number | null, outMs: number | null): string {
  if (inMs === null && outMs === null) return code;
  if (!code.trim()) return code;

  const timed = parseRtttlTimed(code);
  if (!timed) return code;

  const keep = new Set<number>();
  for (const note of timed) {
    const { startMs, noteIndex } = note;
    const inRegion = (inMs === null || startMs >= inMs) && (outMs === null || startMs < outMs);
    if (!inRegion) {
      keep.add(noteIndex);
    }
  }

  return keepNotesByIndex(code, keep);
}
