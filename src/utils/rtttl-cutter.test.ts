import { describe, it, expect } from "vitest";
import { trimRtttl, deleteRegionRtttl } from "./rtttl-cutter";
import { parseRtttl, parseRtttlTimed } from "./rtttl-parser";

// Helper: compute cumulative startMs for each note in a simple scale.
// code = "Scale:d=4,o=5,b=120:c,d,e,f,g"
// At 120 BPM: whole note = 2000ms, quarter note = 500ms each
// c: 0ms, d: 500ms, e: 1000ms, f: 1500ms, g: 2000ms
const SCALE = "Scale:d=4,o=5,b=120:c,d,e,f,g";

function noteCount(code: string): number {
  const parsed = parseRtttl(code);
  return parsed ? parsed.notes.length : 0;
}

describe("trimRtttl", () => {
  it("returns code unchanged when both markers are null", () => {
    expect(trimRtttl(SCALE, null, null)).toBe(SCALE);
  });

  it("returns code unchanged when code is empty", () => {
    expect(trimRtttl("", 500, null)).toBe("");
  });

  it("returns code unchanged for invalid RTTTL", () => {
    const bad = "not valid rtttl";
    expect(trimRtttl(bad, 500, null)).toBe(bad);
  });

  it("A only — keeps notes at or after inMs, removes beginning", () => {
    // inMs = 1000 → keep e(1000), f(1500), g(2000) = 3 notes
    const result = trimRtttl(SCALE, 1000, null);
    expect(noteCount(result)).toBe(3);
    // Verify the header is preserved
    expect(result).toMatch(/^Scale:d=4,o=5,b=120:/);
  });

  it("B only — keeps notes before outMs, removes end", () => {
    // outMs = 1000 → keep c(0), d(500) = 2 notes
    const result = trimRtttl(SCALE, null, 1000);
    expect(noteCount(result)).toBe(2);
  });

  it("A+B — keeps only notes in range [inMs, outMs)", () => {
    // inMs=500, outMs=2000 → keep d(500), e(1000), f(1500) = 3 notes
    const result = trimRtttl(SCALE, 500, 2000);
    expect(noteCount(result)).toBe(3);
  });

  it("all notes trimmed out — returns header only with empty note section", () => {
    // inMs=9999 → no note has startMs >= 9999
    const result = trimRtttl(SCALE, 9999, null);
    expect(noteCount(result)).toBe(0);
    // Header must still be present
    expect(result).toContain("Scale:d=4,o=5,b=120:");
  });

  it("marker exactly on note boundary (snap behaviour) — note at boundary is kept", () => {
    // inMs = 500 exactly equals d's startMs → d must be included
    const result = trimRtttl(SCALE, 500, null);
    expect(noteCount(result)).toBe(4); // d, e, f, g
  });

  it("output is valid RTTTL parseable by parseRtttl", () => {
    const result = trimRtttl(SCALE, 500, 2000);
    const parsed = parseRtttl(result);
    expect(parsed).not.toBeNull();
    expect(parsed!.notes.length).toBeGreaterThan(0);
  });
});

describe("deleteRegionRtttl", () => {
  it("returns code unchanged when both markers are null", () => {
    expect(deleteRegionRtttl(SCALE, null, null)).toBe(SCALE);
  });

  it("returns code unchanged when code is empty", () => {
    expect(deleteRegionRtttl("", 500, null)).toBe("");
  });

  it("returns code unchanged for invalid RTTTL", () => {
    const bad = "not valid rtttl";
    expect(deleteRegionRtttl(bad, 500, null)).toBe(bad);
  });

  it("A only — removes notes from inMs to end", () => {
    // inMs = 1000 → remove e(1000), f(1500), g(2000), keep c(0), d(500) = 2 notes
    const result = deleteRegionRtttl(SCALE, 1000, null);
    expect(noteCount(result)).toBe(2);
  });

  it("B only — removes notes from start to outMs", () => {
    // outMs = 1000 → remove c(0), d(500), keep e(1000), f(1500), g(2000) = 3 notes
    const result = deleteRegionRtttl(SCALE, null, 1000);
    expect(noteCount(result)).toBe(3);
  });

  it("A+B — removes middle, keeps both ends", () => {
    // inMs=500, outMs=2000 → remove d(500),e(1000),f(1500), keep c(0) and g(2000) = 2 notes
    const result = deleteRegionRtttl(SCALE, 500, 2000);
    expect(noteCount(result)).toBe(2);
  });

  it("all notes deleted — returns header with empty note section", () => {
    // Delete everything: inMs=0, outMs=99999
    const result = deleteRegionRtttl(SCALE, 0, 99999);
    expect(noteCount(result)).toBe(0);
    expect(result).toContain("Scale:d=4,o=5,b=120:");
  });

  it("marker exactly on note boundary — note at boundary is removed", () => {
    // inMs = 0 exactly → all notes with startMs >= 0 removed
    const result = deleteRegionRtttl(SCALE, 0, null);
    expect(noteCount(result)).toBe(0);
  });

  it("output is valid RTTTL parseable by parseRtttl", () => {
    const result = deleteRegionRtttl(SCALE, 500, 2000);
    const parsed = parseRtttl(result);
    expect(parsed).not.toBeNull();
    expect(parsed!.notes.length).toBeGreaterThan(0);
  });

  it("trim and delete are inverse operations on middle section", () => {
    // trimmed middle + deleted middle should reconstruct all note counts
    const trimmed = trimRtttl(SCALE, 500, 2000);
    const deleted = deleteRegionRtttl(SCALE, 500, 2000);
    const trimmedCount = noteCount(trimmed);
    const deletedCount = noteCount(deleted);
    // d(500), e(1000), f(1500) trimmed = 3 notes; c(0), g(2000) deleted = 2 notes; total = 5
    expect(trimmedCount + deletedCount).toBe(noteCount(SCALE));
  });
});

describe("parseRtttlTimed integration", () => {
  it("timed notes have monotonically increasing startMs", () => {
    const timed = parseRtttlTimed(SCALE);
    expect(timed).not.toBeNull();
    for (let i = 1; i < timed!.length; i++) {
      expect(timed![i]!.startMs).toBeGreaterThan(timed![i - 1]!.startMs);
    }
  });
});
