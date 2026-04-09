import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RtttlToolbarProps {
  onInsert: (text: string) => void;
}

interface ToolbarItem {
  label: string;
  insert: string;
  tipKey: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { label: "d=", insert: "d=", tipKey: "toolbar.tip.duration" },
  { label: "o=", insert: "o=", tipKey: "toolbar.tip.octave" },
  { label: "b=", insert: "b=", tipKey: "toolbar.tip.bpm" },
  { label: ":", insert: ":", tipKey: "toolbar.tip.separator" },
  { label: ",", insert: ",", tipKey: "toolbar.tip.comma" },
  { label: "#", insert: "#", tipKey: "toolbar.tip.sharp" },
  { label: ".", insert: ".", tipKey: "toolbar.tip.dot" },
  { label: "p", insert: "p", tipKey: "toolbar.tip.pause" },
  { label: "1", insert: "1", tipKey: "toolbar.tip.dur1" },
  { label: "2", insert: "2", tipKey: "toolbar.tip.dur2" },
  { label: "4", insert: "4", tipKey: "toolbar.tip.dur4" },
  { label: "8", insert: "8", tipKey: "toolbar.tip.dur8" },
  { label: "16", insert: "16", tipKey: "toolbar.tip.dur16" },
  { label: "32", insert: "32", tipKey: "toolbar.tip.dur32" },
];

export function RtttlToolbar({ onInsert }: RtttlToolbarProps) {
  const { t } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-700/50">
      {TOOLBAR_ITEMS.map((item) => (
        <div key={item.insert + item.label} className="relative">
          <button
            type="button"
            className="flex h-7 min-w-7 items-center justify-center rounded px-1.5 font-mono text-xs text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
            onClick={() => onInsert(item.insert)}
            onMouseEnter={() => setActiveTooltip(item.tipKey)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {item.label}
          </button>
          {activeTooltip === item.tipKey && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700">
              {t(item.tipKey, { defaultValue: item.label })}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          )}
        </div>
      ))}

      <div className="relative ml-auto">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          title={t("editor.toolbar.help", { defaultValue: "RTTTL Quick Reference" })}
          onMouseEnter={() => setActiveTooltip("__help")}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {activeTooltip === "__help" && (
          <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 w-56 rounded bg-gray-900 px-3 py-2 text-xs leading-5 text-white shadow-lg dark:bg-gray-700">
            <p className="font-semibold">
              {t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Format" })}
            </p>
            <p className="mt-1 font-mono text-gray-300">{"name:d=4,o=5,b=120:notes"}</p>
            <ul className="mt-1.5 space-y-0.5 text-gray-300">
              <li>d= default duration (1,2,4,8,16,32)</li>
              <li>o= default octave (4-7)</li>
              <li>b= tempo in BPM</li>
              <li># sharp &nbsp; . dotted &nbsp; p pause</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
