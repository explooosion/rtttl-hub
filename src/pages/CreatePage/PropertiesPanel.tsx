import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";
import type { RtttlCategory } from "@/utils/rtttl-parser";
import { RTTTL_CATEGORIES } from "@/constants/categories";
import { copyToClipboard } from "@/utils/clipboard";
import clsx from "clsx";

interface PropertiesPanelProps {
  name: string;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  tracks: string[];
  onNameChange: (value: string) => void;
  category: RtttlCategory | "";
  onCategoryChange: (value: RtttlCategory | "") => void;
  errors: string[];
  onDiscard: () => void;
  onSubmit: () => void;
}

export function PropertiesPanel({
  name,
  nameInputRef,
  tracks,
  onNameChange,
  category,
  onCategoryChange,
  errors,
  onDiscard,
  onSubmit,
}: PropertiesPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  // suppress unused warning for useRef - it's used via nameInputRef prop
  void useRef;

  async function handleCopyAll() {
    const all = tracks.filter((tk) => tk.trim()).join("\n");
    if (!all) return;
    const ok = await copyToClipboard(all);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-l border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.properties", { defaultValue: "Properties" })}
        </h3>
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {errors.length > 0 && (
          <div className="rounded bg-red-50 px-2 py-1 dark:bg-red-900/20">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("create.name")}
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t("create.namePlaceholder")}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("create.category")}
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as RtttlCategory | "")}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">{t("create.categoryPlaceholder")}</option>
            {RTTTL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Copy All Tracks */}
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={!tracks.some((tk) => tk.trim())}
          title={t("create.copyAll", { defaultValue: "Copy all track codes to clipboard" })}
          className={clsx(
            "flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors",
            "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100",
            "dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {copied ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
          {copied
            ? t("create.copied", { defaultValue: "Copied!" })
            : t("create.copyAll", { defaultValue: "Copy All Tracks" })}
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t border-gray-200 px-3 py-3 dark:border-gray-800">
        <button
          onClick={onSubmit}
          className="w-full rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("create.create")}
        </button>
        <button
          onClick={onDiscard}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("create.cancel")}
        </button>
      </div>
    </div>
  );
}
