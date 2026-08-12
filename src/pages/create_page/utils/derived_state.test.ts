import { describe, it, expect } from "vitest";

import {
  computeHasPlayableContent,
  computeHasEmptyTracks,
  computeAllTracksMuted,
  computeAnyTrackMuted,
  computeCanCutRegion,
  computeFocusedTrackName,
} from "./derived_state";

const CODE = "Track1:d=4,o=5,b=140:c,d";

// ---------------------------------------------------------------------------
// computeHasPlayableContent
// ---------------------------------------------------------------------------
describe("computeHasPlayableContent", () => {
  it("returns false for an empty tracks list", () => {
    expect(computeHasPlayableContent([])).toBe(false);
  });

  it("returns false when all tracks are empty strings", () => {
    expect(computeHasPlayableContent(["", ""])).toBe(false);
  });

  it("returns false when all tracks are whitespace-only", () => {
    expect(computeHasPlayableContent(["   ", "\t"])).toBe(false);
  });

  it("returns true when at least one track has content", () => {
    expect(computeHasPlayableContent(["", CODE])).toBe(true);
  });

  it("returns true for a single non-empty track", () => {
    expect(computeHasPlayableContent([CODE])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeHasEmptyTracks
// ---------------------------------------------------------------------------
describe("computeHasEmptyTracks", () => {
  it("returns false when all tracks have content after the colon", () => {
    expect(computeHasEmptyTracks([CODE])).toBe(false);
  });

  it("returns true when a track has an empty body after colon", () => {
    expect(computeHasEmptyTracks(["Track1:"])).toBe(true);
  });

  it("returns true when a track has whitespace-only body after colon", () => {
    expect(computeHasEmptyTracks(["Track1:   "])).toBe(true);
  });

  it("returns true for a completely empty string", () => {
    expect(computeHasEmptyTracks([""])).toBe(true);
  });

  it("returns true when mix of empty and non-empty tracks", () => {
    expect(computeHasEmptyTracks([CODE, "Track2:"])).toBe(true);
  });

  it("returns false for multiple non-empty tracks", () => {
    expect(computeHasEmptyTracks([CODE, "Track2:d=4,o=5,b=140:e"])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeAllTracksMuted
// ---------------------------------------------------------------------------
describe("computeAllTracksMuted", () => {
  it("returns false for an empty track list", () => {
    expect(computeAllTracksMuted([], [])).toBe(false);
  });

  it("returns true when every track is muted", () => {
    expect(computeAllTracksMuted([CODE, CODE], [true, true])).toBe(true);
  });

  it("returns false when any track is unmuted", () => {
    expect(computeAllTracksMuted([CODE, CODE], [true, false])).toBe(false);
    expect(computeAllTracksMuted([CODE, CODE], [false, true])).toBe(false);
  });

  it("returns false when all tracks are unmuted", () => {
    expect(computeAllTracksMuted([CODE], [false])).toBe(false);
  });

  it("treats missing muted entry as false (not muted)", () => {
    // muted array shorter than tracks: second track defaults to false
    expect(computeAllTracksMuted([CODE, CODE], [true])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeAnyTrackMuted
// ---------------------------------------------------------------------------
describe("computeAnyTrackMuted", () => {
  it("returns false when no tracks are muted", () => {
    expect(computeAnyTrackMuted([CODE, CODE], [false, false])).toBe(false);
  });

  it("returns true when at least one track is muted", () => {
    expect(computeAnyTrackMuted([CODE, CODE], [false, true])).toBe(true);
    expect(computeAnyTrackMuted([CODE, CODE], [true, false])).toBe(true);
  });

  it("returns true when all tracks are muted", () => {
    expect(computeAnyTrackMuted([CODE, CODE], [true, true])).toBe(true);
  });

  it("returns false for an empty track list", () => {
    expect(computeAnyTrackMuted([], [])).toBe(false);
  });

  it("treats missing muted entry as false", () => {
    // first track explicitly false, second track has no entry → false
    expect(computeAnyTrackMuted([CODE, CODE], [false])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeCanCutRegion
// ---------------------------------------------------------------------------
describe("computeCanCutRegion", () => {
  it("returns false when both markers are null", () => {
    expect(computeCanCutRegion(null, null)).toBe(false);
  });

  it("returns true when only loopIn is set", () => {
    expect(computeCanCutRegion(500, null)).toBe(true);
  });

  it("returns true when only loopOut is set", () => {
    expect(computeCanCutRegion(null, 2000)).toBe(true);
  });

  it("returns true when both markers are set", () => {
    expect(computeCanCutRegion(500, 2000)).toBe(true);
  });

  it("treats 0 as a valid (set) marker", () => {
    expect(computeCanCutRegion(0, null)).toBe(true);
    expect(computeCanCutRegion(null, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeFocusedTrackName
// ---------------------------------------------------------------------------
describe("computeFocusedTrackName", () => {
  it("returns 'Track 1' for empty code at index 0", () => {
    expect(computeFocusedTrackName([""], 0)).toBe("Track 1");
  });

  it("returns 'Track 1' for whitespace-only code", () => {
    expect(computeFocusedTrackName(["  "], 0)).toBe("Track 1");
  });

  it("returns the name before the first colon", () => {
    expect(computeFocusedTrackName(["Lead:d=4,o=5,b=120:c"], 0)).toBe("Lead");
  });

  it("falls back to 'Track N' when the name before colon is empty", () => {
    expect(computeFocusedTrackName([":d=4,o=5,b=120:c"], 0)).toBe("Track 1");
  });

  it("falls back to 'Track N' when there is no colon", () => {
    // colonIdx = -1, not > 0 → fallback
    expect(computeFocusedTrackName(["nocolon"], 0)).toBe("Track 1");
  });

  it("returns 'Track N' for out-of-bounds index (undefined entry)", () => {
    expect(computeFocusedTrackName([CODE], 5)).toBe("Track 6");
  });

  it("uses 1-based index in the fallback label", () => {
    expect(computeFocusedTrackName(["", "", ""], 2)).toBe("Track 3");
  });

  it("correctly reads names from multi-track arrays at various indices", () => {
    const tracks = ["Melody:d=4,o=5,b=120:c", "Bass:d=4,o=4,b=120:c"];
    expect(computeFocusedTrackName(tracks, 0)).toBe("Melody");
    expect(computeFocusedTrackName(tracks, 1)).toBe("Bass");
  });
});
