import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { usePlayerStore } from "../stores/player_store";
import { useEditorSettingsStore } from "../stores/editor_settings_store";
import { formatPlaybackClock, getMaxTrackDurationMs } from "../utils/rtttl_format";
import { CodeEditor } from "../components/rtttl_editor/code_editor";
import { CopyButton, CopyAllButton } from "./copy_code_buttons";

const TRACK_DOT_CLASSES = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export function CodePreviewPanel() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const playerState = usePlayerStore((s) => s.playerState);
  const trackNoteIndices = usePlayerStore((s) => s.trackNoteIndices);
  const elapsedMs = usePlayerStore((s) => s.engine.getElapsedMs());
  const syntaxHighlight = useEditorSettingsStore((s) => s.features.syntaxHighlight);
  const syntaxColors = useEditorSettingsStore((s) => s.syntaxColors);

  // Coerce "stopped" → "idle" for CodeEditor's narrower prop type
  const editorPlayerState = playerState === "stopped" ? "idle" : playerState;

  const totalDurationMs = (() => {
    if (!currentItem) {
      return 0;
    }
    const tracks = currentItem.tracks ?? [currentItem.code];
    return getMaxTrackDurationMs(tracks);
  })();

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
        {(playerState === "playing" || playerState === "paused" || playerState === "stopped") &&
          totalDurationMs > 0 && (
            <div className="mt-2 w-fit rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {formatPlaybackClock(elapsedMs)} / {formatPlaybackClock(totalDurationMs)}
            </div>
          )}
      </div>

      {isMulti ? (
        /* Multi-track: each track separately + Copy All */
        <div className="space-y-2">
          {/* Copy All header */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {tracks!.length} {t("editor.tracks", { defaultValue: "Tracks" })}
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
