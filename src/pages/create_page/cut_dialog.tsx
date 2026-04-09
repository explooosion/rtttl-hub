import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaCut, FaEraser } from "react-icons/fa";

export type CutMode = "trim" | "delete";

interface CutDialogProps {
  mode: CutMode;
  open: boolean;
  tracks: string[];
  trackColors: string[];
  inMs: number | null;
  outMs: number | null;
  onConfirm: (selectedIndices: number[]) => void;
  onCancel: () => void;
}

function getTrackName(code: string, fallback: string): string {
  if (!code.trim()) return fallback;
  const colonIdx = code.indexOf(":");
  if (colonIdx > 0) {
    const name = code.slice(0, colonIdx).trim();
    if (name) return name;
  }
  return fallback;
}

export function CutDialog({
  mode,
  open,
  tracks,
  trackColors,
  inMs,
  outMs,
  onConfirm,
  onCancel,
}: CutDialogProps) {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Set<number>>(() => new Set(tracks.map((_, i) => i)));

  function toggleTrack(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selected].sort((a, b) => a - b));
    // Reset selection for next open
    setSelected(new Set(tracks.map((_, i) => i)));
  }

  function handleCancel() {
    setSelected(new Set(tracks.map((_, i) => i)));
    onCancel();
  }

  const rangeLabel = (() => {
    if (inMs !== null && outMs !== null) {
      return `${(inMs / 1000).toFixed(1)}s – ${(outMs / 1000).toFixed(1)}s`;
    }
    if (inMs !== null) return `${(inMs / 1000).toFixed(1)}s →`;
    if (outMs !== null) return `← ${(outMs / 1000).toFixed(1)}s`;
    return "";
  })();

  const isTrim = mode === "trim";

  return (
    <Dialog open={open} onClose={handleCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Title */}
          <div className="mb-1 flex items-center gap-2">
            {isTrim ? (
              <FaCut size={15} className="text-indigo-500" />
            ) : (
              <FaEraser size={15} className="text-amber-500" />
            )}
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {isTrim
                ? t("create.trimRegion", { defaultValue: "Trim to Selection" })
                : t("create.deleteRegion", { defaultValue: "Delete Selection" })}
            </DialogTitle>
          </div>

          {/* Range indicator */}
          {rangeLabel && (
            <p className="mb-3 font-mono text-xs text-gray-400 dark:text-gray-500">{rangeLabel}</p>
          )}

          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t("create.cutDialogDesc", {
              defaultValue: "Select tracks to apply the cut to:",
            })}
          </p>

          {/* Track checklist */}
          <div className="space-y-1">
            {tracks.map((code, i) => {
              const name = getTrackName(
                code,
                t("editor.trackN", { defaultValue: `Track ${i + 1}`, n: i + 1 }),
              );
              const color = trackColors[i] ?? "rgb(99, 102, 241)";
              const isChecked = selected.has(i);
              return (
                <label
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTrack(i)}
                    className="h-4 w-4 rounded accent-indigo-500"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300">{name}</span>
                </label>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleConfirm}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("create.cutDialogConfirm", { defaultValue: "Apply" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
