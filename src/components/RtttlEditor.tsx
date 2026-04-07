import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player-store";
import { copyToClipboard } from "@/utils/clipboard";
import { FaPlay, FaRegCopy, FaCheck } from "react-icons/fa";

export function RtttlEditor() {
  const { t } = useTranslation();
  const currentItem = usePlayerStore((s) => s.currentItem);
  const editedCode = usePlayerStore((s) => s.editedCode);
  const setEditedCode = usePlayerStore((s) => s.setEditedCode);
  const playCode = usePlayerStore((s) => s.playCode);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function handleCopy() {
    const success = await copyToClipboard(editedCode);
    if (success) {
      setCopyState("copied");
    } else {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
        {t("editor.title")}
      </h3>
      <textarea
        value={editedCode}
        onChange={(e) => setEditedCode(e.target.value)}
        placeholder={t("editor.placeholder")}
        rows={8}
        className="mb-3 w-full resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => playCode(editedCode)}
          disabled={!editedCode.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPlay size={14} />
          {t("editor.playEdited")}
        </button>
        <button
          onClick={handleCopy}
          disabled={!editedCode.trim()}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {copyState === "copied" ? (
            <>
              <FaCheck size={14} className="text-green-500" />
              {t("editor.copied")}
            </>
          ) : (
            <>
              <FaRegCopy size={14} />
              {t("editor.copyCode")}
            </>
          )}
        </button>
        {currentItem && editedCode !== currentItem.code && (
          <button
            onClick={() => setEditedCode(currentItem.code)}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
