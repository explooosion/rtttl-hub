import { useTranslation } from "react-i18next";
import { FaCode } from "react-icons/fa";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <FaCode size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-800 dark:text-white">
                RTTTL Editor
              </DialogTitle>
              <p className="text-xs text-gray-400 dark:text-gray-500">v1.0 · RTTTL Hub</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("create.aboutDesc", {
              defaultValue:
                "A multi-track RTTTL editor for composing, previewing, and exporting ringtone tunes. Supports up to 8 simultaneous tracks with real-time waveform preview and A-B loop markers.",
            })}
          </p>
          <div className="mt-4 space-y-1.5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            {(
              [
                [
                  t("create.aboutFormat", { defaultValue: "Format" }),
                  "Ring Tone Transfer Language (RTTTL)",
                ],
                [t("create.aboutMaxTracks", { defaultValue: "Max Tracks" }), "8"],
                [
                  t("create.aboutStorage", { defaultValue: "Storage" }),
                  t("create.aboutStorageValue", { defaultValue: "Local browser storage (draft)" }),
                ],
                [
                  t("create.aboutShortcuts", { defaultValue: "Shortcuts" }),
                  "Ctrl/⌘+Z  Undo · Ctrl/⌘+Shift+Z  Redo",
                ],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 text-xs">
                <span className="w-20 shrink-0 font-medium text-gray-400 dark:text-gray-500">
                  {k}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {t("confirm.ok", { defaultValue: "OK" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
