import {
  useRef,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useMemo,
  forwardRef,
} from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
import {
  rtttlLanguageSupport,
  rtttlNotesLanguageSupport,
  buildHighlightExtension,
} from "./rtttl-language";
import { playbackHighlightExtension, setActiveNote, clearActiveNote } from "./playback-highlight";
import { parseRtttlOffsets } from "@/utils/rtttl-parser";
import type { NoteOffset } from "@/utils/rtttl-parser";
import type { SyntaxColors } from "@/stores/editor-settings-store";
import { useThemeStore, getEffectiveTheme } from "@/stores/theme-store";

export interface CodeEditorHandle {
  insertText: (text: string) => void;
}

interface CodeEditorProps {
  value: string;
  placeholder?: string;
  syntaxHighlight: boolean;
  playbackTracking: boolean;
  syntaxColors: SyntaxColors;
  currentNoteIndex: number;
  playerState: "idle" | "playing" | "paused";
  notesOnly?: boolean;
  minHeight?: string;
  onChange: (value: string) => void;
}

const baseTheme = EditorView.theme({
  // When syntax highlighting is off, fall back to a readable dark-gray text
  "&": { fontSize: "13px", color: "#1f2937" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
    overflow: "auto",
  },
  ".cm-content": { padding: "10px 0", minHeight: "160px" },
  ".cm-line": { padding: "0 12px" },
  "&.cm-focused": { outline: "none" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#6366f1" },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(99,102,241,0.2) !important",
  },
  ".cm-rtttl-active-note": {
    backgroundColor: "rgba(99,102,241,0.25)",
    borderRadius: "3px",
    outline: "1px solid rgba(99,102,241,0.5)",
  },
});

const darkTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", color: "#e2e8f0" },
    ".cm-cursor": { borderLeftColor: "#818cf8" },
    ".cm-rtttl-active-note": {
      backgroundColor: "rgba(129,140,248,0.3)",
      outline: "1px solid rgba(129,140,248,0.6)",
    },
  },
  { dark: true },
);

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  {
    value,
    placeholder = "",
    syntaxHighlight,
    playbackTracking,
    syntaxColors,
    currentNoteIndex,
    playerState,
    notesOnly = false,
    minHeight,
    onChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const offsetsRef = useRef<NoteOffset[]>([]);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(function syncOnChangeRef() {
    onChangeRef.current = onChange;
  });

  const langCompartment = useMemo(() => new Compartment(), []);
  const highlightCompartment = useMemo(() => new Compartment(), []);
  const themeCompartment = useMemo(() => new Compartment(), []);
  const mode = useThemeStore((s) => s.mode);

  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      const view = viewRef.current;
      if (!view) {
        return;
      }
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
      view.focus();
    },
  }));

  useEffect(function initEditorOnMount() {
    if (!containerRef.current || viewRef.current) {
      return;
    }

    offsetsRef.current = parseRtttlOffsets(value);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        offsetsRef.current = parseRtttlOffsets(newValue);
        onChangeRef.current(newValue);
      }
    });

    const langExtension = notesOnly ? rtttlNotesLanguageSupport() : rtttlLanguageSupport();

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        langCompartment.of(syntaxHighlight ? langExtension : []),
        highlightCompartment.of(syntaxHighlight ? buildHighlightExtension(syntaxColors) : []),
        playbackHighlightExtension(),
        cmPlaceholder(placeholder),
        updateListener,
        baseTheme,
        ...(minHeight ? [EditorView.theme({ ".cm-content": { minHeight } })] : []),
        themeCompartment.of(
          getEffectiveTheme(useThemeStore.getState().mode) === "dark" ? darkTheme : [],
        ),
      ],
    });

    viewRef.current = new EditorView({ state, parent: containerRef.current });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    function syncValueOnExternalChange() {
      const view = viewRef.current;
      if (!view) {
        return;
      }
      const docValue = view.state.doc.toString();
      if (docValue !== value) {
        view.dispatch({ changes: { from: 0, to: docValue.length, insert: value } });
        offsetsRef.current = parseRtttlOffsets(value);
      }
    },
    [value],
  );

  useEffect(
    function reconfigureSyntaxOnSettingsChange() {
      const view = viewRef.current;
      if (!view) {
        return;
      }
      const langExtension = notesOnly ? rtttlNotesLanguageSupport() : rtttlLanguageSupport();
      view.dispatch({
        effects: [
          langCompartment.reconfigure(syntaxHighlight ? langExtension : []),
          highlightCompartment.reconfigure(
            syntaxHighlight ? buildHighlightExtension(syntaxColors) : [],
          ),
        ],
      });
    },
    [syntaxHighlight, syntaxColors, notesOnly, langCompartment, highlightCompartment],
  );

  useEffect(
    function reconfigureThemeOnModeChange() {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: themeCompartment.reconfigure(getEffectiveTheme(mode) === "dark" ? darkTheme : []),
      });
    },
    [mode, themeCompartment],
  );

  useEffect(
    function updatePlaybackOnNoteChange() {
      const view = viewRef.current;
      if (!view) {
        return;
      }
      if (!playbackTracking || playerState === "idle") {
        view.dispatch({ effects: clearActiveNote.of(null) });
        return;
      }
      view.dispatch({
        effects: setActiveNote.of({
          noteIndex: currentNoteIndex,
          offsets: offsetsRef.current,
        }),
      });
    },
    [currentNoteIndex, playerState, playbackTracking],
  );

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
    />
  );
});
