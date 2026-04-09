import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { usePlayerStore } from "@/stores/player_store";
import { useEditorSettingsStore } from "@/stores/editor_settings_store";
import { copyToClipboard } from "@/utils/clipboard";
import { CodeEditor } from "@/components/rtttl_editor/code_editor";
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
      title="Copy"
      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? <FaCheck size={12} className="text-green-500" /> : <FaRegCopy size={12} />}
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
      className="flex h-7 items-center gap-1.5 rounded border border-gray-300 px-2.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? (
        <>
          <FaCheck size={11} className="text-green-500" />{" "}
          {t("editor.copied", { defaultValue: "Copied!" })}
        </>
      ) : (
        <>
          <FaRegCopy size={11} /> {t("editor.copyAll", { defaultValue: "Copy All" })}
        </>
      )}
    </button>
  );
}

export function CodePreviewPanel() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const playerState = usePlayerStore((s) => s.playerState);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const syntaxHighlight = useEditorSettingsStore((s) => s.features.syntaxHighlight);
  const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);

  // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
  const editorPlayerState = playerState === "stopped" ? "idle" : playerState;

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
              <CodeEditor
                value={trackCode || ""}
                syntaxHighlight={syntaxHighlight}
                playbackTracking={true}
                autoScroll={true}
                syntaxColors={syntaxColors}
                currentNoteIndex={trackNoteIndices[idx] ?? currentNoteIndex}
                playerState={editorPlayerState}
                minHeight="60px"
                maxHeight="100px"
                readOnly
              />
            </div>
          ))}
        </div>
      ) : (
        /* Single track */
        <div>
          <div className="mb-1 flex items-center justify-end">
            <CopyButton text={currentItem.code} />
          </div>
          <CodeEditor
            value={currentItem.code || ""}
            syntaxHighlight={syntaxHighlight}
            playbackTracking={true}
            autoScroll={true}
            syntaxColors={syntaxColors}
            currentNoteIndex={currentNoteIndex}
            playerState={editorPlayerState}
            minHeight="80px"
            maxHeight="160px"
            readOnly
          />
        </div>
      )}
    </div>
  );
}
