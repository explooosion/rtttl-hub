import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import {
  RtttlFormatGuideSection,
  ShortcutsGuideSection,
  ToolbarGuideSection,
  TrackLaneGuideSection,
} from "./sections";

interface HelpDialogProps {
  open: boolean;
  onClose: VoidFunction;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <DialogTitle className="text-base font-semibold text-gray-800 dark:text-white">
            {t("editor.toolbar.helpTitle", { defaultValue: "Studio Guide" })}
          </DialogTitle>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ToolbarGuideSection t={t} />
            <TrackLaneGuideSection t={t} />
            <RtttlFormatGuideSection t={t} />
          </div>

          <ShortcutsGuideSection t={t} />

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
