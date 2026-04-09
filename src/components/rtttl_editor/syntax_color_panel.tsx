import { useState, useCallback } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { useTranslation } from "react-i18next";
import { useEditorSettingsStore } from "@/stores/editor_settings_store";
import type { SyntaxColorKey, SyntaxColors } from "@/stores/editor_settings_store";

interface SyntaxColorPanelProps {
  onClose: () => void;
}

const COLOR_LABELS: { key: SyntaxColorKey; labelKey: string; preview: string }[] = [
  { key: "name", labelKey: "editor.color.name", preview: "MySong" },
  { key: "separator", labelKey: "editor.color.separator", preview: ":" },
  { key: "settingKey", labelKey: "editor.color.settingKey", preview: "d" },
  { key: "settingValue", labelKey: "editor.color.settingValue", preview: "4" },
  { key: "noteDuration", labelKey: "editor.color.noteDuration", preview: "8" },
  { key: "notePitch", labelKey: "editor.color.notePitch", preview: "c" },
  { key: "noteSharp", labelKey: "editor.color.noteSharp", preview: "#" },
  { key: "noteOctave", labelKey: "editor.color.noteOctave", preview: "5" },
  { key: "noteDot", labelKey: "editor.color.noteDot", preview: "." },
  { key: "pause", labelKey: "editor.color.pause", preview: "p" },
  { key: "comma", labelKey: "editor.color.comma", preview: "," },
];

interface SyntaxTheme {
  id: string;
  label: string;
  dot: string; // representative swatch color
  colors: SyntaxColors;
}

const SYNTAX_THEMES: SyntaxTheme[] = [
  {
    id: "vscode-dark",
    label: "VSCode Dark+",
    dot: "#569cd6",
    colors: {
      name: "#9cdcfe",
      separator: "#808080",
      settingKey: "#569cd6",
      settingValue: "#b5cea8",
      noteDuration: "#b5cea8",
      notePitch: "#ce9178",
      noteSharp: "#d4d4d4",
      noteOctave: "#b5cea8",
      noteDot: "#d4d4d4",
      pause: "#c586c0",
      comma: "#808080",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    dot: "#ff79c6",
    colors: {
      name: "#ff79c6",
      separator: "#6272a4",
      settingKey: "#8be9fd",
      settingValue: "#bd93f9",
      noteDuration: "#bd93f9",
      notePitch: "#50fa7b",
      noteSharp: "#f8f8f2",
      noteOctave: "#bd93f9",
      noteDot: "#6272a4",
      pause: "#ff5555",
      comma: "#6272a4",
    },
  },
  {
    id: "monokai",
    label: "Monokai",
    dot: "#a6e22e",
    colors: {
      name: "#66d9e8",
      separator: "#75715e",
      settingKey: "#f92672",
      settingValue: "#ae81ff",
      noteDuration: "#ae81ff",
      notePitch: "#a6e22e",
      noteSharp: "#f8f8f2",
      noteOctave: "#ae81ff",
      noteDot: "#75715e",
      pause: "#f92672",
      comma: "#75715e",
    },
  },
  {
    id: "solarized",
    label: "Solarized Dark",
    dot: "#268bd2",
    colors: {
      name: "#268bd2",
      separator: "#657b83",
      settingKey: "#859900",
      settingValue: "#2aa198",
      noteDuration: "#2aa198",
      notePitch: "#cb4b16",
      noteSharp: "#b58900",
      noteOctave: "#2aa198",
      noteDot: "#657b83",
      pause: "#d33682",
      comma: "#657b83",
    },
  },
  {
    id: "ramda",
    label: "Ramda",
    dot: "#89ddff",
    colors: {
      name: "#f7f1ff",
      separator: "#5c6370",
      settingKey: "#c3e88d",
      settingValue: "#f78c6c",
      noteDuration: "#f78c6c",
      notePitch: "#89ddff",
      noteSharp: "#eeffff",
      noteOctave: "#f78c6c",
      noteDot: "#5c6370",
      pause: "#ff5370",
      comma: "#5c6370",
    },
  },
  {
    id: "one-dark",
    label: "One Dark Pro",
    dot: "#61afef",
    colors: {
      name: "#e5c07b",
      separator: "#abb2bf",
      settingKey: "#61afef",
      settingValue: "#e06c75",
      noteDuration: "#e06c75",
      notePitch: "#98c379",
      noteSharp: "#56b6c2",
      noteOctave: "#e06c75",
      noteDot: "#abb2bf",
      pause: "#c678dd",
      comma: "#abb2bf",
    },
  },
];

export function SyntaxColorPanel({ onClose }: SyntaxColorPanelProps) {
  const { t } = useTranslation();
  const { syntaxColors, setSyntaxColor, saveColors, restoreColors, resetColors } =
    useEditorSettingsStore();

  const [selectedKey, setSelectedKey] = useState<SyntaxColorKey>("name");
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  const currentColor = syntaxColors[selectedKey];

  const handleColorChange = useCallback(
    (hex: string) => {
      setSyntaxColor(selectedKey, hex);
      setActiveThemeId(null); // mark as customised
    },
    [selectedKey, setSyntaxColor],
  );

  const handleApplyTheme = useCallback(
    (theme: SyntaxTheme) => {
      for (const [key, value] of Object.entries(theme.colors)) {
        setSyntaxColor(key as SyntaxColorKey, value);
      }
      setActiveThemeId(theme.id);
    },
    [setSyntaxColor],
  );

  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("editor.syntaxColors", { defaultValue: "Syntax Colors" })}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Theme presets row */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("editor.color.themes", { defaultValue: "Quick Themes" })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SYNTAX_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleApplyTheme(theme)}
              title={theme.label}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                activeThemeId === theme.id
                  ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: theme.dot }}
              />
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-0 divide-x divide-gray-200 dark:divide-gray-700">
        {/* Token list */}
        <div className="w-44 py-1">
          {COLOR_LABELS.map(({ key, labelKey, preview }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                selectedKey === key
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
              }`}
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: syntaxColors[key] }}
              />
              <span className="flex-1 truncate">{t(labelKey, { defaultValue: key })}</span>
              <code className="font-mono opacity-60" style={{ color: syntaxColors[key] }}>
                {preview}
              </code>
            </button>
          ))}
        </div>

        {/* Picker area */}
        <div className="flex min-w-65 flex-col gap-3 p-3">
          <HexColorPicker color={currentColor} onChange={handleColorChange} />

          {/* Hex input row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">HEX</span>
            <div className="flex items-center rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
              <span className="text-xs text-gray-400">#</span>
              <HexColorInput
                color={currentColor}
                onChange={handleColorChange}
                prefixed={false}
                className="w-20 bg-transparent text-xs outline-none dark:text-gray-200"
              />
            </div>
            <span
              className="h-6 w-6 rounded border border-black/10 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
          </div>

          {/* Preview sample */}
          <div className="rounded bg-gray-50 px-3 py-2 dark:bg-gray-900">
            <code className="font-mono text-xs">
              <span style={{ color: syntaxColors.name }}>MySong</span>
              <span style={{ color: syntaxColors.separator }}>:</span>
              <span style={{ color: syntaxColors.settingKey }}>d</span>
              <span style={{ color: syntaxColors.settingKey }}>{"="}</span>
              <span style={{ color: syntaxColors.settingValue }}>4</span>
              <span style={{ color: syntaxColors.comma }}>,</span>
              <span style={{ color: syntaxColors.settingKey }}>o</span>
              <span style={{ color: syntaxColors.settingKey }}>{"="}</span>
              <span style={{ color: syntaxColors.settingValue }}>5</span>
              <span style={{ color: syntaxColors.separator }}>:</span>
              <span style={{ color: syntaxColors.noteDuration }}>4</span>
              <span style={{ color: syntaxColors.notePitch }}>c</span>
              <span style={{ color: syntaxColors.noteSharp }}>#</span>
              <span style={{ color: syntaxColors.noteOctave }}>5</span>
              <span style={{ color: syntaxColors.noteDot }}>.</span>
              <span style={{ color: syntaxColors.comma }}>,</span>
              <span style={{ color: syntaxColors.pause }}>p</span>
              <span style={{ color: syntaxColors.comma }}>,</span>
              <span style={{ color: syntaxColors.notePitch }}>e</span>
            </code>
          </div>

          {/* Footer actions — taller buttons with proper visual weight */}
          <div className="flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            <button
              type="button"
              onClick={resetColors}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t("editor.color.reset", { defaultValue: "Reset" })}
            </button>
            <button
              type="button"
              onClick={restoreColors}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t("editor.color.restore", { defaultValue: "Restore" })}
            </button>
            <button
              type="button"
              onClick={() => {
                saveColors();
                onClose();
              }}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {t("editor.color.save", { defaultValue: "Save" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
