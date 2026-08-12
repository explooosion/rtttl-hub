import { describe, it, expect } from "vitest";

import { formatMs, nextProjectName } from "./toolbar_utils";

// ---------------------------------------------------------------------------
// formatMs
// ---------------------------------------------------------------------------
describe("formatMs", () => {
  it("formats 0ms as 00:00.000", () => {
    expect(formatMs(0)).toBe("00:00.000");
  });

  it("formats 1000ms (1s) correctly", () => {
    expect(formatMs(1000)).toBe("00:01.000");
  });

  it("formats 60000ms (1min) correctly", () => {
    expect(formatMs(60000)).toBe("01:00.000");
  });

  it("formats 61500ms (1min 1.5s) correctly", () => {
    expect(formatMs(61500)).toBe("01:01.500");
  });

  it("formats sub-second values correctly", () => {
    expect(formatMs(500)).toBe("00:00.500");
  });

  it("formats values with millisecond precision", () => {
    expect(formatMs(1234)).toBe("00:01.234");
  });

  it("pads minutes to 2 digits", () => {
    expect(formatMs(600000)).toBe("10:00.000");
    // single-digit minute
    expect(formatMs(120000)).toBe("02:00.000");
  });

  it("seconds part is always 6 characters (ss.xxx)", () => {
    const [, secs] = formatMs(5050).split(":");
    expect(secs!.length).toBe(6);
  });

  it("formats the maximum-precision edge case (999ms)", () => {
    expect(formatMs(999)).toBe("00:00.999");
  });
});

// ---------------------------------------------------------------------------
// nextProjectName
// ---------------------------------------------------------------------------
describe("nextProjectName", () => {
  it("returns 'Untitled Project' when the list is empty", () => {
    expect(nextProjectName([])).toBe("Untitled Project");
  });

  it("returns 'Untitled Project' when it does not exist in the list", () => {
    expect(nextProjectName(["My Song", "Test Track"])).toBe("Untitled Project");
  });

  it("returns 'Untitled Project 2' when the base name already exists", () => {
    expect(nextProjectName(["Untitled Project"])).toBe("Untitled Project 2");
  });

  it("increments to find the first available slot", () => {
    expect(nextProjectName(["Untitled Project", "Untitled Project 2", "Untitled Project 3"])).toBe(
      "Untitled Project 4",
    );
  });

  it("skips gaps — uses lowest available number", () => {
    // 'Untitled Project 2' is free even though 3 exists
    expect(nextProjectName(["Untitled Project", "Untitled Project 3"])).toBe("Untitled Project 2");
  });

  it("is case-insensitive when comparing with existing titles", () => {
    expect(nextProjectName(["UNTITLED PROJECT"])).toBe("Untitled Project 2");
    expect(nextProjectName(["untitled project", "UNTITLED PROJECT 2"])).toBe("Untitled Project 3");
  });

  it("ignores unrelated titles when computing the next name", () => {
    expect(nextProjectName(["Song A", "Song B", "Untitled Project"])).toBe("Untitled Project 2");
  });
});
