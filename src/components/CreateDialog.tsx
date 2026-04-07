import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { parseRtttl } from "@/utils/rtttl-parser";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import { FaTimes } from "react-icons/fa";

interface CreateDialogProps {
  isOpen: boolean;
  duplicateFrom: RtttlEntry | null;
  onClose: () => void;
}

export function CreateDialog({
  isOpen,
  duplicateFrom,
  onClose,
}: CreateDialogProps) {
  const { t } = useTranslation();
  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const [name, setName] = useState(
    duplicateFrom ? `${duplicateFrom.title} (Copy)` : "",
  );
  const [code, setCode] = useState(duplicateFrom?.code ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit() {
    const newErrors: string[] = [];
    if (!name.trim()) {
      newErrors.push(t("create.nameRequired"));
    }
    if (!code.trim() || !parseRtttl(code.trim())) {
      newErrors.push(t("create.invalidCode"));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const firstLetter = name.charAt(0).toUpperCase();
    const id = `user-${crypto.randomUUID()}`;
    const newItem: RtttlEntry = {
      id,
      artist: "",
      title: name.trim(),
      firstLetter: /[A-Z]/.test(firstLetter)
        ? firstLetter
        : /[0-9]/.test(firstLetter)
          ? "0-9"
          : "#",
      code: code.trim(),
    };

    addUserItem(newItem);
    setCurrentItem(newItem);
    handleClose();
  }

  function handleClose() {
    setName("");
    setCode("");
    setErrors([]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {duplicateFrom
                ? t("create.duplicateTitle")
                : t("create.title")}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            {t("create.localStorageHint")}
          </p>

          {errors.length > 0 && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  {err}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("create.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("create.namePlaceholder")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("create.code")}
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("create.codePlaceholder")}
                rows={4}
                className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("create.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {duplicateFrom ? t("create.duplicate") : t("create.create")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
