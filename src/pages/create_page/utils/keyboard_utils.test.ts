import { describe, it, expect } from "vitest";

import {
  formatShortcut,
  formatTooltipWithShortcut,
  getModifierKey,
  platformShortcut,
} from "./keyboard_utils";

describe("getModifierKey", () => {
  it("returns meta or ctrl based on platform", () => {
    const result = getModifierKey();
    // Should return either "meta" (Mac) or "ctrl" (Windows/Linux)
    expect(["meta", "ctrl"]).toContain(result);
  });
});

describe("platformShortcut", () => {
  it("creates platform-specific shortcut for single key", () => {
    const result = platformShortcut("z");
    // Should be either "meta+z" (Mac) or "ctrl+z" (Windows/Linux)
    expect(result).toMatch(/^(meta|ctrl)\+z$/);
  });

  it("creates platform-specific shortcut with shift modifier", () => {
    const result = platformShortcut("shift+z");
    // Should be either "meta+shift+z" (Mac) or "ctrl+shift+z" (Windows/Linux)
    expect(result).toMatch(/^(meta|ctrl)\+shift\+z$/);
  });

  it("creates platform-specific shortcut for different keys", () => {
    const result = platformShortcut("t");
    expect(result).toMatch(/^(meta|ctrl)\+t$/);
  });
});

describe("formatShortcut", () => {
  it("formats ctrl+z shortcut", () => {
    const result = formatShortcut("ctrl+z");
    // On Mac: ⌘Z, on Windows/Linux: Ctrl+Z
    expect(result).toMatch(/^(⌘Z|Ctrl\+Z)$/);
  });

  it("formats ctrl+shift combinations", () => {
    const result = formatShortcut("ctrl+shift+z");
    // On Mac: ⌘⇧Z, on Windows/Linux: Ctrl+Shift+Z
    expect(result).toMatch(/^(⌘⇧Z|Ctrl\+Shift\+Z)$/);
  });

  it("formats single keys", () => {
    const result = formatShortcut("space");
    expect(result).toBe("Space");
  });

  it("capitalizes single character keys", () => {
    const result = formatShortcut("i");
    expect(result).toBe("I");
  });

  it("handles delete key", () => {
    const result = formatShortcut("delete");
    expect(result).toBe("DELETE");
  });

  it("handles alt modifier", () => {
    const result = formatShortcut("alt+x");
    // On Mac: ⌥X, on Windows/Linux: Alt+X
    expect(result).toMatch(/^(⌥X|Alt\+X)$/);
  });

  it("treats meta same as ctrl", () => {
    const result = formatShortcut("meta+s");
    // On Mac: ⌘S, on Windows/Linux: Ctrl+S
    expect(result).toMatch(/^(⌘S|Ctrl\+S)$/);
  });
});

describe("formatTooltipWithShortcut", () => {
  it("combines label with shortcut", () => {
    const result = formatTooltipWithShortcut("Undo", "ctrl+z");
    expect(result).toContain("Undo");
    expect(result).toContain("(");
    expect(result).toContain(")");
    // Should contain either Mac or Windows format
    expect(result).toMatch(/(⌘Z|Ctrl\+Z)/);
  });

  it("returns label only when no shortcut provided", () => {
    const result = formatTooltipWithShortcut("My Action");
    expect(result).toBe("My Action");
  });

  it("returns label only when shortcut is undefined", () => {
    const result = formatTooltipWithShortcut("My Action", undefined);
    expect(result).toBe("My Action");
  });
});
