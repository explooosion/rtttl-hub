import { describe, it, expect } from "vitest";

import {
  addTrack,
  removeTrack,
  duplicateTrack,
  removeEmptyTracks,
  reorderTracks,
  renameTrack,
  adjustFocusedIndexAfterRemove,
  adjustFocusedIndexAfterReorder,
} from "./track_operations";
import { MAX_TRACKS, NEW_TRACK_STUB_BODY } from "../constants";

const T1 = "Track1:d=4,o=5,b=140:c,c#";
const T2 = "Track2:d=4,o=5,b=140:d,d#";
const T3 = "Track3:d=4,o=5,b=140:e,f";

// ---------------------------------------------------------------------------
// addTrack
// ---------------------------------------------------------------------------
describe("addTrack", () => {
  it("appends a new stub track when below MAX_TRACKS", () => {
    const result = addTrack([T1]);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![1]).toBe(`Track2:${NEW_TRACK_STUB_BODY}`);
  });

  it("numbers the new track based on current count", () => {
    const result = addTrack([T1, T2]);
    expect(result![2]).toBe(`Track3:${NEW_TRACK_STUB_BODY}`);
  });

  it("returns null when already at MAX_TRACKS", () => {
    const full = Array.from({ length: MAX_TRACKS }, (_, i) => `Track${i + 1}:...`);
    expect(addTrack(full)).toBeNull();
  });

  it("does not mutate the original array", () => {
    const original = [T1];
    addTrack(original);
    expect(original.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// removeTrack
// ---------------------------------------------------------------------------
describe("removeTrack", () => {
  it("removes the track at the given index", () => {
    expect(removeTrack([T1, T2, T3], 1)).toEqual([T1, T3]);
  });

  it("removes the first track", () => {
    expect(removeTrack([T1, T2], 0)).toEqual([T2]);
  });

  it("removes the last track", () => {
    expect(removeTrack([T1, T2, T3], 2)).toEqual([T1, T2]);
  });

  it("returns null when there is only one track", () => {
    expect(removeTrack([T1], 0)).toBeNull();
  });

  it("does not mutate the original array", () => {
    const original = [T1, T2];
    removeTrack(original, 0);
    expect(original.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// duplicateTrack
// ---------------------------------------------------------------------------
describe("duplicateTrack", () => {
  it("inserts a _copy track immediately after the original", () => {
    const result = duplicateTrack([T1, T2], 0);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    expect(result![0]).toBe(T1);
    expect(result![1]).toBe("Track1_copy:d=4,o=5,b=140:c,c#");
    expect(result![2]).toBe(T2);
  });

  it("appends _copy directly when there is no colon", () => {
    const result = duplicateTrack(["nocolon"], 0);
    expect(result).not.toBeNull();
    expect(result![1]).toBe("nocolon_copy");
  });

  it("duplicates the last track in the list", () => {
    const result = duplicateTrack([T1, T2], 1);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    expect(result![2]).toBe("Track2_copy:d=4,o=5,b=140:d,d#");
  });

  it("returns null when already at MAX_TRACKS", () => {
    const full = Array.from({ length: MAX_TRACKS }, (_, i) => `Track${i + 1}:...`);
    expect(duplicateTrack(full, 0)).toBeNull();
  });

  it("does not mutate the original array", () => {
    const original = [T1, T2];
    duplicateTrack(original, 0);
    expect(original.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// removeEmptyTracks
// ---------------------------------------------------------------------------
describe("removeEmptyTracks", () => {
  it("keeps tracks that have content after the colon", () => {
    expect(removeEmptyTracks([T1, T2])).toEqual([T1, T2]);
  });

  it("removes tracks with empty body after colon", () => {
    expect(removeEmptyTracks(["Track1:", T2])).toEqual([T2]);
  });

  it("removes tracks with whitespace-only body after colon", () => {
    expect(removeEmptyTracks(["Track1:   ", T2])).toEqual([T2]);
  });

  it("removes completely empty string tracks", () => {
    expect(removeEmptyTracks(["", T2])).toEqual([T2]);
  });

  it("returns [''] when every track is empty to keep at least one slot", () => {
    expect(removeEmptyTracks(["Track1:", "Track2:"])).toEqual([""]);
  });

  it("returns [''] for an already-empty single track", () => {
    expect(removeEmptyTracks([""])).toEqual([""]);
  });

  it("does not mutate the original array", () => {
    const original = ["Track1:", T2];
    removeEmptyTracks(original);
    expect(original.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// reorderTracks
// ---------------------------------------------------------------------------
describe("reorderTracks", () => {
  it("moves a track forward (from < to)", () => {
    expect(reorderTracks([T1, T2, T3], 0, 2)).toEqual([T2, T3, T1]);
  });

  it("moves a track backward (from > to)", () => {
    expect(reorderTracks([T1, T2, T3], 2, 0)).toEqual([T3, T1, T2]);
  });

  it("moves a track one step forward", () => {
    expect(reorderTracks([T1, T2, T3], 0, 1)).toEqual([T2, T1, T3]);
  });

  it("moves a track one step backward", () => {
    expect(reorderTracks([T1, T2, T3], 2, 1)).toEqual([T1, T3, T2]);
  });

  it("returns a copy (not same reference) when from === to", () => {
    const original = [T1, T2];
    const result = reorderTracks(original, 1, 1);
    expect(result).toEqual(original);
    expect(result).not.toBe(original);
  });

  it("does not mutate the original array", () => {
    const original = [T1, T2, T3];
    reorderTracks(original, 0, 2);
    expect(original).toEqual([T1, T2, T3]);
  });
});

// ---------------------------------------------------------------------------
// renameTrack
// ---------------------------------------------------------------------------
describe("renameTrack", () => {
  it("replaces the name before the first colon", () => {
    expect(renameTrack([T1], 0, "Lead")).toEqual(["Lead:d=4,o=5,b=140:c,c#"]);
  });

  it("handles a track with no colon by prepending 'Name:'", () => {
    expect(renameTrack(["nocolon"], 0, "Bass")).toEqual(["Bass:nocolon"]);
  });

  it("handles an empty track code by returning 'Name:'", () => {
    expect(renameTrack([""], 0, "Piano")).toEqual(["Piano:"]);
  });

  it("handles a whitespace-only track code the same as empty", () => {
    expect(renameTrack(["   "], 0, "Drums")).toEqual(["Drums:"]);
  });

  it("does not affect other tracks in the array", () => {
    const result = renameTrack([T1, T2], 0, "NewName");
    expect(result[1]).toBe(T2);
  });

  it("does not mutate the original array", () => {
    const original = [T1, T2];
    renameTrack(original, 0, "X");
    expect(original[0]).toBe(T1);
  });
});

// ---------------------------------------------------------------------------
// adjustFocusedIndexAfterRemove
// ---------------------------------------------------------------------------
describe("adjustFocusedIndexAfterRemove", () => {
  it("clamps to newLength-1 when focused index is beyond new bounds", () => {
    // 3 tracks → remove index 2 → newLength 2; focusedIndex was 2 → 1
    expect(adjustFocusedIndexAfterRemove(2, 2, 2)).toBe(1);
  });

  it("steps back when the focused track itself was removed", () => {
    // focusedIndex=1, removed=1, newLength=2 → max(0, 0) = 0
    expect(adjustFocusedIndexAfterRemove(1, 1, 2)).toBe(0);
  });

  it("clamps to 0 when the only focused track was the first one removed", () => {
    expect(adjustFocusedIndexAfterRemove(0, 0, 1)).toBe(0);
  });

  it("is unchanged when focused track is before the removed track", () => {
    // focusedIndex=0, removed=1, newLength=2 → unchanged
    expect(adjustFocusedIndexAfterRemove(0, 1, 2)).toBe(0);
  });

  it("clamps when focused is after removed and beyond new bounds", () => {
    // focusedIndex=2, removed=0, newLength=2 → 2 >= 2 → 1
    expect(adjustFocusedIndexAfterRemove(2, 0, 2)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// adjustFocusedIndexAfterReorder
// ---------------------------------------------------------------------------
describe("adjustFocusedIndexAfterReorder", () => {
  it("follows the moved track when the focused track is the one being moved", () => {
    expect(adjustFocusedIndexAfterReorder(0, 0, 2)).toBe(2);
    expect(adjustFocusedIndexAfterReorder(2, 2, 0)).toBe(0);
  });

  it("shifts down when a track from before focused moves past it (from < to)", () => {
    // from=0 → to=2: items at 1,2 shift left; focused=1 → 0
    expect(adjustFocusedIndexAfterReorder(1, 0, 2)).toBe(0);
  });

  it("shifts up when a track from after focused moves before it (from > to)", () => {
    // from=2 → to=0: items at 0,1 shift right; focused=1 → 2
    expect(adjustFocusedIndexAfterReorder(1, 2, 0)).toBe(2);
  });

  it("is unchanged when focused is outside the affected range (moving forward)", () => {
    // from=0 to=1; focused=2 is outside [0..1]
    expect(adjustFocusedIndexAfterReorder(2, 0, 1)).toBe(2);
  });

  it("is unchanged when focused is outside the affected range (moving backward)", () => {
    // from=2 to=1; focused=0 is outside [1..2)
    expect(adjustFocusedIndexAfterReorder(0, 2, 1)).toBe(0);
  });

  it("is unchanged when from === to", () => {
    expect(adjustFocusedIndexAfterReorder(1, 1, 1)).toBe(1);
  });
});
