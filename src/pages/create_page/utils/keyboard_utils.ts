/**
 * Utility functions for keyboard shortcut formatting and display.
 */

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);

/**
 * Get the primary modifier key for the current platform.
 * Returns "meta" for macOS (Command key) and "ctrl" for Windows/Linux.
 */
export function getModifierKey(): "meta" | "ctrl" {
  return isMac ? "meta" : "ctrl";
}

/**
 * Create a cross-platform keyboard shortcut descriptor.
 * Automatically uses Command (meta) on macOS and Ctrl on Windows/Linux.
 *
 * @param key - The key combination without the modifier, e.g. "z", "shift+z", "t"
 * @returns Platform-specific shortcut like "meta+z" on Mac or "ctrl+z" on Windows
 *
 * @example
 * ```ts
 * platformShortcut("z") // "meta+z" on Mac, "ctrl+z" on Windows
 * platformShortcut("shift+z") // "meta+shift+z" on Mac, "ctrl+shift+z" on Windows
 * platformShortcut("t") // "meta+t" on Mac, "ctrl+t" on Windows
 * ```
 */
export function platformShortcut(key: string): string {
  const modifier = getModifierKey();
  return `${modifier}+${key}`;
}

/**
 * Format a keyboard shortcut descriptor for display.
 * Converts platform-agnostic descriptors like "ctrl+z" to user-friendly format.
 *
 * @param descriptor - e.g. "ctrl+z", "ctrl+shift+z", "space", "i"
 * @returns Formatted shortcut like "⌘Z" on Mac or "Ctrl+Z" on Windows/Linux
 */
export function formatShortcut(descriptor: string): string {
  const parts = descriptor.toLowerCase().split("+");
  const formatted: string[] = [];

  for (const part of parts) {
    if (part === "ctrl" || part === "meta") {
      formatted.push(isMac ? "⌘" : "Ctrl");
    } else if (part === "shift") {
      formatted.push(isMac ? "⇧" : "Shift");
    } else if (part === "alt") {
      formatted.push(isMac ? "⌥" : "Alt");
    } else if (part === "space") {
      formatted.push(isMac ? "Space" : "Space");
    } else {
      // Capitalize single keys
      formatted.push(part.toUpperCase());
    }
  }

  return isMac ? formatted.join("") : formatted.join("+");
}

/**
 * Format shortcut for button title/tooltip.
 * @param label - Action label
 * @param shortcut - Shortcut descriptor
 */
export function formatTooltipWithShortcut(label: string, shortcut?: string): string {
  if (!shortcut) {
    return label;
  }
  return `${label} (${formatShortcut(shortcut)})`;
}
