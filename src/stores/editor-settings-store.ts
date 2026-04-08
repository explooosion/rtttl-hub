import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface EditorFeatures {
  syntaxHighlight: boolean;
  playbackTracking: boolean;
}

// VSCode Dark+ inspired palette
export const DEFAULT_SYNTAX_COLORS = {
  name: "#9cdcfe", // variable blue   (VSCode: parameter/variable)
  separator: "#808080", // gray            (VSCode: punctuation)
  settingKey: "#569cd6", // keyword blue    (VSCode: keyword)
  settingValue: "#b5cea8", // number green  (VSCode: numeric literal)
  noteDuration: "#b5cea8", // number green
  notePitch: "#ce9178", // string orange   (VSCode: string literal)
  noteSharp: "#d4d4d4", // light gray      (VSCode: operator)
  noteOctave: "#b5cea8", // number green
  noteDot: "#d4d4d4", // light gray      (VSCode: punctuation)
  pause: "#c586c0", // pink/purple     (VSCode: control-flow keyword)
  comma: "#808080", // gray
} as const;

export type SyntaxColorKey = keyof typeof DEFAULT_SYNTAX_COLORS;
export type SyntaxColors = Record<SyntaxColorKey, string>;

interface EditorSettingsState {
  features: EditorFeatures;
  syntaxColors: SyntaxColors;
  /** Restore point — set by "Save" action */
  savedColors: SyntaxColors;
  toggleFeature: (key: keyof EditorFeatures) => void;
  setSyntaxColor: (key: SyntaxColorKey, value: string) => void;
  saveColors: () => void;
  restoreColors: () => void;
  resetColors: () => void;
}

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      features: {
        syntaxHighlight: false,
        playbackTracking: true,
      },
      syntaxColors: { ...DEFAULT_SYNTAX_COLORS },
      savedColors: { ...DEFAULT_SYNTAX_COLORS },
      toggleFeature: (key) =>
        set((state) => ({
          features: { ...state.features, [key]: !state.features[key] },
        })),
      setSyntaxColor: (key, value) =>
        set((state) => ({
          syntaxColors: { ...state.syntaxColors, [key]: value },
        })),
      saveColors: () => set((state) => ({ savedColors: { ...state.syntaxColors } })),
      restoreColors: () => set((state) => ({ syntaxColors: { ...state.savedColors } })),
      resetColors: () =>
        set({
          syntaxColors: { ...DEFAULT_SYNTAX_COLORS },
          savedColors: { ...DEFAULT_SYNTAX_COLORS },
        }),
    }),
    { name: "rtttl-editor-settings" },
  ),
);
