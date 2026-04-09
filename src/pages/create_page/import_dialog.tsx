import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { parseRtttl } from "@/utils/rtttl_parser";
import { TRACK_DOT_CLASSES, MAX_TRACKS } from "./constants";
import clsx from "clsx";

interface DetectedTrack {
  raw: string;
  valid: boolean;
  name: string;
}

function detectTracks(text: string): DetectedTrack[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parsed = parseRtttl(line);
      const name = line.split(":")[0]?.trim() ?? line.slice(0, 20);
      return { raw: line, valid: parsed !== null, name };
    });
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: string[]) => void;
}

export function ImportDialog({ open, onClose, onConfirm }: ImportDialogProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Focus textarea when dialog opens; clear text when it closes. */
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(id);
      setText("");
    };
  }, [open]);

  const detected = detectTracks(text);
  const validTracks = detected.filter((d) => d.valid).map((d) => d.raw);
  const canImport = validTracks.length > 0 && validTracks.length <= MAX_TRACKS;

  function handleConfirm() {
    if (!canImport) return;
    onConfirm(validTracks.slice(0, MAX_TRACKS));
    setText("");
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex w-full max-w-xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {t("create.importTitle", { defaultValue: "Import RTTTL" })}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Paste area */}
          <div className="px-5 pt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("create.importPasteLabel", {
                defaultValue: "Paste RTTTL code — one track per line",
              })}
            </label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Track1:d=8,o=5,b=120:c,e,g\nTrack2:d=8,o=5,b=120:e,g,c6"}
              rows={10}
              spellCheck={false}
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs leading-5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
            />
          </div>

          {/* Detected tracks preview */}
          {detected.length > 0 && (
            <div className="mt-3 px-5">
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("create.importDetected", {
                  defaultValue: "Detected {{count}} track(s)",
                  count: detected.length,
                })}
                {detected.length > MAX_TRACKS && (
                  <span className="ml-1.5 text-amber-500">
                    {"(" +
                      t("create.importTruncated", {
                        defaultValue: `first ${MAX_TRACKS} will be imported`,
                        max: MAX_TRACKS,
                      }) +
                      ")"}
                  </span>
                )}
              </p>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                {detected.slice(0, MAX_TRACKS).map((track, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded px-2 py-1">
                    <span
                      className={clsx(
                        "inline-block h-2 w-2 shrink-0 rounded-full",
                        TRACK_DOT_CLASSES[idx] ?? "bg-gray-400",
                      )}
                    />
                    <span className="flex-1 truncate font-mono text-[11px] text-gray-600 dark:text-gray-300">
                      {track.name}
                    </span>
                    {track.valid ? (
                      <FaCheckCircle size={11} className="shrink-0 text-green-500" />
                    ) : (
                      <FaExclamationCircle
                        size={11}
                        className="shrink-0 text-red-400"
                        title="Invalid RTTTL"
                      />
                    )}
                  </div>
                ))}
              </div>
              {detected.some((d) => !d.valid) && (
                <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">
                  {t("create.importInvalidSkipped", {
                    defaultValue: "Invalid lines will be skipped.",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canImport}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("create.importConfirm", { defaultValue: "Import" })}
              {validTracks.length > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {Math.min(validTracks.length, MAX_TRACKS)}
                </span>
              )}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
