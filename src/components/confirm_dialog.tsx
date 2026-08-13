import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  confirmText?: string; // 需要用戶輸入的確認文字
  confirmPlaceholder?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isLoading = false,
  confirmText,
  confirmPlaceholder,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const requiresConfirmation = !!confirmText;
  const canConfirm = !requiresConfirmation || inputValue === confirmText;

  const handleConfirm = () => {
    if (canConfirm) {
      setInputValue("");
      onConfirm();
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>

          {requiresConfirmation && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {confirmPlaceholder || t("confirm.typeToConfirm", { text: confirmText })}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmText}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                autoFocus
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {cancelLabel ?? t("confirm.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !canConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
              }`}
            >
              {confirmLabel ?? t("confirm.ok")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
