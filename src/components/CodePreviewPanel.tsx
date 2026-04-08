import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { usePlayerStore } from "@/stores/player-store";
import { copyToClipboard } from "@/utils/clipboard";
import clsx from "clsx";

const TRACK_DOT_CLASSES = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
    >
      {copied ? <FaCheck size={10} className="text-green-500" /> : <FaRegCopy size={10} />}
    </button>
  );
}

function CopyAllButton({ tracks }: { tracks: string[] }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(tracks.join("\n"));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
    >
      {copied ? (
        <>
          <FaCheck size={10} className="text-green-500" />{" "}
          {t("editor.copied", { defaultValue: "Copied!" })}
        </>
      ) : (
        <>
          <FaRegCopy size={10} /> {t("editor.copyAll", { defaultValue: "Copy All" })}
        </>
      )}
    </button>
  );
}

export function CodePreviewPanel() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);

  if (!currentItem) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <p className="text-center text-sm italic text-gray-400 dark:text-gray-600">
          {t("player.selectTrack", { defaultValue: "Select a track to view its code" })}
        </p>
      </div>
    );
  }

  // Derive multi-track state directly from the item's data — avoids any store sync issues
  const tracks = currentItem.tracks;
  const isMulti = !!tracks && tracks.length > 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Title */}
      <div className="mb-3">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {currentItem.title}
        </p>
        {currentItem.artist && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{currentItem.artist}</p>
        )}
      </div>

      {isMulti ? (
        /* Multi-track: each track separately + Copy All */
        <div className="space-y-2">
          {/* Copy All header */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {tracks!.length} {t("editor.track", { defaultValue: "Track" })}s
            </span>
            <CopyAllButton tracks={tracks!} />
          </div>
          {tracks!.map((trackCode, idx) => (
            <div key={idx}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "inline-block h-2 w-2 rounded-full",
                      TRACK_DOT_CLASSES[idx] ?? "bg-gray-400",
                    )}
                  />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("editor.track", { defaultValue: "Track" })} {idx + 1}
                  </span>
                </div>
                <CopyButton text={trackCode} />
              </div>
              <pre className="overflow-x-auto rounded-md bg-gray-50 p-2 text-xs leading-relaxed text-gray-700 break-all whitespace-pre-wrap dark:bg-gray-800 dark:text-gray-300">
                {trackCode || "—"}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        /* Single track */
        <div>
          <div className="mb-1 flex items-center justify-end">
            <CopyButton text={currentItem.code} />
          </div>
          <pre className="overflow-x-auto rounded-md bg-gray-50 p-2 text-xs leading-relaxed text-gray-700 break-all whitespace-pre-wrap dark:bg-gray-800 dark:text-gray-300">
            {currentItem.code || "—"}
          </pre>
        </div>
      )}
    </div>
  );
}
