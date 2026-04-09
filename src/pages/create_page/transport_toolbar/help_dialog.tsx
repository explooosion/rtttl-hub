import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <DialogTitle className="text-base font-semibold text-gray-800 dark:text-white">
            {t("editor.toolbar.helpTitle", { defaultValue: "RTTTL Quick Reference" })}
          </DialogTitle>
          <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">
            name : d=4, o=5, b=120 : notes
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Header fields
              </p>
              <div className="grid grid-cols-1 gap-y-2">
                {(
                  [
                    ["d=", "Default note duration (1 2 4 8 16 32)"],
                    ["o=", "Default octave (4 – 7)"],
                    ["b=", "Tempo in BPM"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <code className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {k}
                    </code>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Note modifiers
              </p>
              <div className="grid grid-cols-1 gap-y-2">
                {(
                  [
                    ["#", "Sharp  (e.g. c#5)"],
                    [".", "Dotted — 1.5 × duration"],
                    ["p", "Rest / pause"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <code className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {k}
                    </code>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-600">
            Notes: c d e f g a b &nbsp;·&nbsp; add octave number &amp; duration prefix freely
          </p>
          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {t("confirm.ok", { defaultValue: "Got it" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
