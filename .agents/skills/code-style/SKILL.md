---
name: code-style
description: Defines TypeScript/TSX code style rules for this repository. Apply when writing, reviewing, or refactoring any source file — covers import grouping, control flow formatting, useEffect naming, return type inference, hook ordering, and JSX callback style.
license: MIT
metadata:
  author: explooosion
  version: "1.3.0"
---

# Code Style Rules

Mandatory code style for all TypeScript and TSX source files in this repository.

## When to Apply

Apply **before every code edit or review**, including:

- Writing new components, hooks, utils, or stores
- Refactoring existing code
- Code review or automated fix passes

---

## Rule 1 — Import Grouping

Separate `node_modules` imports and relative path imports with **one blank line**.

### Format

```ts
// 1. External (node_modules) imports
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// 2. Relative imports (one blank line above)
import { usePlayerStore } from "../stores/player_store";
import { parseRtttl } from "../utils/rtttl_parser";
```

### Rules

| Rule                   | Requirement                                        |
| ---------------------- | -------------------------------------------------- |
| Order                  | External imports first, relative imports second    |
| Separator              | Exactly one blank line between the two groups      |
| No mixing              | Do not interleave external and relative imports    |
| Module-level constants | Place after all imports, not between import groups |

### Anti-patterns (Forbidden)

```ts
// WRONG — no blank line between groups
import { useState } from "react";
import { usePlayerStore } from "../stores/player_store";

// WRONG — interleaved
import { useState } from "react";
import { parseRtttl } from "../utils/rtttl_parser";
import clsx from "clsx";

// WRONG — const between imports
import { useState } from "react";
const BASE_URL = "...";
import clsx from "clsx";
```

---

## Rule 2 — Control Flow Braces

All `if`, `else if`, `else`, `switch`, and `case` blocks **must** use curly braces `{}`. The statement inside **must be on its own line** — single-line block syntax is also forbidden.

### Format

```ts
// ✅ Correct
if (!track) {
  return;
}

if (isPlaying) {
  pause();
} else {
  play();
}

switch (playerState) {
  case "playing": {
    return <FaPause />;
  }
  case "paused": {
    return <FaPlay />;
  }
  default: {
    return null;
  }
}
```

### Rules

| Rule              | Requirement                                                     |
| ----------------- | --------------------------------------------------------------- |
| Braces            | Always required — no exceptions                                 |
| Single-line body  | Must expand to multi-line with braces                           |
| Same-line block   | `{ return; }` on one line is also forbidden — must be multiline |
| `return` only     | Must still use braces                                           |
| `switch` / `case` | Each `case` body must also be wrapped in `{}`                   |
| Ternary           | Allowed only for simple value assignments, not control flow     |

### Anti-patterns (Forbidden)

```ts
// WRONG — no braces
if (!track) return;

// WRONG — single-line block (braces on same line) is also forbidden
if (!track) { return; }

// WRONG — else without braces
if (isPlaying) {
  pause();
} else play();

// WRONG — switch without per-case braces
switch (playerState) { case "playing": return <FaPause />; }
```

---

## Rule 3 — `useEffect` Named Functions

Always use a **named function** as the `useEffect` callback. Anonymous arrow functions are forbidden.

Naming format: `verb + When + trigger condition`

### Format

```tsx
// ✅ Correct
useEffect(
  function focusEditorWhenDialogOpen() {
    if (!open) {
      return;
    }
    editorRef.current?.focus();
  },
  [open],
);

useEffect(
  function registerListenersWhenMenuOpen() {
    if (!open) {
      return;
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  },
  [open],
);

useEffect(
  function saveDraftWhenTracksChange() {
    saveDraft({ name, tracks, categories });
  },
  [name, tracks, categories],
);

// ❌ Forbidden
useEffect(() => {
  saveDraft({ name, tracks });
}, [name, tracks]);
```

### Naming Guide

| Scenario                 | Example                              |
| ------------------------ | ------------------------------------ |
| One-time initialization  | `initAudioContext`                   |
| Depends on a state flag  | `focusEditorWhenDialogOpen`          |
| Multiple deps            | `reloadWhenCollectionOrFilterChange` |
| Register event listeners | `registerListenersWhenMenuOpen`      |
| Sync derived data        | `syncWaveformWhenTracksChange`       |
| Persist state            | `saveDraftWhenTracksChange`          |

---

## Rule 4 — Return Type Inference

**Do not** explicitly annotate return types on function declarations — let TypeScript infer them.

Exception: exported utility functions where an explicit constraint is needed.

```tsx
// ✅ Correct — TypeScript infers the return type
function parseTrackName(rtttl: string) {
  return rtttl.split(":")[0]?.trim() ?? "";
}

function derivePlayerIcon(state: PlayerState) {
  if (state === "playing") {
    return <FaPause />;
  }
  return <FaPlay />;
}

// ❌ Forbidden — do not annotate return types on local functions
function parseTrackName(rtttl: string): string {
  return rtttl.split(":")[0]?.trim() ?? "";
}

function derivePlayerIcon(state: PlayerState): React.ReactNode {
  return <FaPlay />;
}
```

---

## Rule 5 — Hook Ordering

`useEffect` hooks **must** be placed **after** all handler functions (`handleXxx`), not before them.

Required order inside a React component body:

1. Variable declarations & derived values
2. `useXxx` hook calls (e.g. `useState`, `useRef`, `useCallback`, store selectors)
3. Handler functions (`handleXxx`)
4. `useEffect` hooks
5. Early-return guards
6. JSX `return`

```tsx
// ✅ Correct order
const [text, setText] = useState("");
const validTracks = parseRtttl(text);
const canImport = validTracks !== null;

function handleConfirm() {
  onConfirm(text);
  setText("");
}

useEffect(
  function focusInputWhenOpen() {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  },
  [open],
);

return <Dialog />;

// ❌ Forbidden — useEffect before handler function
const [text, setText] = useState("");

useEffect(function focusInputWhenOpen() { // ← should be after handleConfirm
  // ...
}, [open]);

function handleConfirm() {
  // ...
}
```

---

## Rule 6 — No Inline Arrow Functions In JSX

Inline arrow functions in JSX props are forbidden.

### Format

```tsx
// ✅ Correct — stable named handler
function handleImportClick() {
  onImport();
}

function handleTrackClick() {
  onFocusTrack(trackIndex);
}

return (
  <>
    <button onClick={handleImportClick}>Import</button>
    <button onClick={handleTrackClick}>Focus</button>
  </>
);

// ✅ Correct — precomputed callback map for indexed handlers
const trackClickHandlers = useMemo(
  function buildTrackClickHandlers() {
    return tracks.map((_, idx) => () => {
      onFocusTrack(idx);
    });
  },
  [tracks, onFocusTrack],
);

return tracks.map((track, idx) => (
  <button key={track.id} onClick={trackClickHandlers[idx]}>
    {track.name}
  </button>
));

// ❌ Forbidden — inline arrow inside JSX
return <button onClick={() => onImport()}>Import</button>;

// ❌ Forbidden — inline arrow with args inside JSX
return <button onClick={() => onFocusTrack(trackIndex)}>Focus</button>;
```

### Rules

| Rule                    | Requirement                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| JSX callbacks           | Do not use `() => ...` directly in JSX props                      |
| Event handlers          | Define named handler functions before `return`                    |
| Parameterized callbacks | Use precomputed handlers (`useMemo`) or component extraction       |
| Stability               | Keep handler references stable where possible                      |
| Readability             | Prefer explicit handler names like `handleXxxClick` / `handleXxx` |

### Anti-patterns (Forbidden)

```tsx
// WRONG
<button onClick={() => doSomething()} />

// WRONG
<TrackRow onRemove={() => removeTrack(index)} />

// WRONG
<input onChange={(e) => setValue(e.target.value)} />
```

---

## Rule 7 — Use `VoidFunction` For Zero-Arg Callback Props

When defining callbacks in `interface` or `type` props/state shapes, if the callback has no parameters and returns `void`, use `VoidFunction` instead of `() => void`.

### Format

```ts
// ✅ Correct
interface DialogProps {
  onClose: VoidFunction;
  onConfirm?: VoidFunction;
}

type ToolbarActions = {
  onPlayToggle: VoidFunction;
  onStop: VoidFunction;
};

// ❌ Forbidden
interface DialogPropsBad {
  onClose: () => void;
  onConfirm?: () => void;
}
```

### Rules

| Rule            | Requirement                                                |
| --------------- | ---------------------------------------------------------- |
| Scope           | Applies to interface/type property signatures              |
| Zero-arg only   | Only replace callbacks with no params and `void` return    |
| Keep semantics  | Do not change callbacks that have parameters               |
| Optional props  | Use `onClose?: VoidFunction` for optional zero-arg actions |
