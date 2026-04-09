import { useEffect } from "react";

/**
 * Central keyboard shortcut registry for CreatePage.
 * Each entry maps a hotkey descriptor to a callback.
 *
 * Descriptor format: [modifier+]key
 *   modifiers: "ctrl", "meta", "shift", "alt"
 *   key: lowercase KeyboardEvent.key
 *
 * Examples: "ctrl+z", "ctrl+shift+z", "meta+z", "meta+shift+z"
 */
export interface ShortcutDef {
  /** e.g. "ctrl+z" or "meta+z" – handles both Ctrl and Cmd automatically */
  key: string;
  action: () => void;
  /** If true, skip the shortcut when focus is inside an input/textarea/contenteditable */
  ignoreInInput?: boolean;
}

function parseShortcut(descriptor: string): {
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
} {
  const parts = descriptor.toLowerCase().split("+");
  return {
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("meta"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key: parts[parts.length - 1]!,
  };
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        if (shortcut.ignoreInInput && isInputFocused()) continue;

        const parsed = parseShortcut(shortcut.key);

        const ctrlOrMeta = parsed.ctrl || parsed.meta;
        const matchesCtrlMeta = ctrlOrMeta ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const matchesShift = parsed.shift ? e.shiftKey : !e.shiftKey;
        const matchesAlt = parsed.alt ? e.altKey : !e.altKey;
        const matchesKey = e.key.toLowerCase() === parsed.key;

        if (matchesCtrlMeta && matchesShift && matchesAlt && matchesKey) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
