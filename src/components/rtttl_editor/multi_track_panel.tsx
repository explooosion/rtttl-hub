import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck, FaPlus, FaTimes } from "react-icons/fa";
import clsx from "clsx";
import { copyToClipboard } from "@/utils/clipboard";

const TRACK_LABELS = ["Track 1", "Track 2", "Track 3", "Track 4"] as const;
const TRACK_DOT_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

interface EscOutputPanelProps {
  tracks: string[];
}

export function EscOutputPanel({ tracks }: EscOutputPanelProps) {
  const { t } = useTranslation();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopy = useCallback(async (code: string, idx: number) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    const allText = tracks.map((code, i) => `${TRACK_LABELS[i]}: ${code || "(empty)"}`).join("\n");
    const ok = await copyToClipboard(allText);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }, [tracks]);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("editor.escOutput", { defaultValue: "ESC Motor Output" })}
        </h4>
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {copiedAll ? (
            <>
              <FaCheck size={10} className="text-green-500" />
              {t("editor.copied", { defaultValue: "Copied!" })}
            </>
          ) : (
            <>
              <FaRegCopy size={10} />
              {t("editor.copyAll", { defaultValue: "Copy All" })}
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {[0, 1, 2, 3].map((motorIdx) => {
          const code = tracks[motorIdx] ?? "";
          const hasCode = code.trim().length > 0;
          return (
            <div
              key={motorIdx}
              className="flex items-start gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
            >
              <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span
                  className={clsx("inline-block h-2 w-2 rounded-full", TRACK_DOT_COLORS[motorIdx])}
                />
                {TRACK_LABELS[motorIdx]}
              </span>
              <code
                className={clsx(
                  "min-h-5 flex-1 break-all font-mono text-xs",
                  hasCode
                    ? "text-gray-800 dark:text-gray-200"
                    : "italic text-gray-400 dark:text-gray-600",
                )}
              >
                {hasCode ? code : t("editor.escEmpty", { defaultValue: "(no track)" })}
              </code>
              {hasCode && (
                <button
                  type="button"
                  onClick={() => handleCopy(code, motorIdx)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={t("editor.copyCode", { defaultValue: "Copy" })}
                >
                  {copiedIdx === motorIdx ? (
                    <FaCheck size={10} className="text-green-500" />
                  ) : (
                    <FaRegCopy size={10} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TrackTabsProps {
  tracks: string[];
  activeIndex: number; // -1 = "All" (play all tracks)
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  mutedTracks?: Set<number>;
  onToggleMute?: (index: number) => void;
}

export function TrackTabs({
  tracks,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  mutedTracks: _mutedTracks,
  onToggleMute: _onToggleMute,
}: TrackTabsProps) {
  const { t } = useTranslation();

  const activeDotColor =
    activeIndex === -1
      ? "bg-gray-400 dark:bg-gray-500"
      : (TRACK_DOT_COLORS[activeIndex] ?? "bg-gray-400");

  return (
    <div className="mb-2 flex items-center gap-2">
      {/* Active motor color indicator */}
      <span className={clsx("inline-block h-2 w-2 shrink-0 rounded-full", activeDotColor)} />

      {/* Motor dropdown */}
      <select
        value={activeIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-indigo-400"
      >
        {tracks.length > 1 && (
          <option value={-1}>{t("categories.all", { defaultValue: "All" })}</option>
        )}
        {tracks.map((_, idx) => (
          <option key={idx} value={idx}>
            {TRACK_LABELS[idx] ?? `Track ${idx + 1}`}
          </option>
        ))}
      </select>

      {/* Remove current motor — only when a specific motor is selected */}
      {tracks.length > 1 && activeIndex >= 0 && (
        <button
          type="button"
          onClick={() => onRemove(activeIndex)}
          className="flex items-center rounded-md border border-gray-300 px-2 py-1 text-gray-400 transition-colors hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-red-500 dark:hover:text-red-400"
          title={t("editor.removeTrack", { defaultValue: "Remove track" })}
        >
          <FaTimes size={9} />
        </button>
      )}

      {/* Add track */}
      {tracks.length < 4 && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center rounded-md border border-gray-300 px-2 py-1 text-gray-400 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
          title={t("editor.addTrack", { defaultValue: "Add track" })}
        >
          <FaPlus size={9} />
        </button>
      )}
    </div>
  );
}
