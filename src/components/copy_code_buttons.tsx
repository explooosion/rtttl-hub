import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck } from "react-icons/fa";

import { copyToClipboard } from "../utils/clipboard";

/** Small icon button that copies a single track's RTTTL code to the clipboard. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? <FaCheck size={12} className="text-green-500" /> : <FaRegCopy size={12} />}
    </button>
  );
}

/** Button that copies every track's RTTTL code (newline-joined) to the clipboard. */
export function CopyAllButton({ tracks }: { tracks: string[] }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(tracks.join("\n"));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-7 items-center gap-1.5 rounded border border-gray-300 px-2.5 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
    >
      {copied ? (
        <>
          <FaCheck size={11} className="text-green-500" />{" "}
          {t("editor.copied", { defaultValue: "Copied!" })}
        </>
      ) : (
        <>
          <FaRegCopy size={11} /> {t("editor.copyAll", { defaultValue: "Copy All" })}
        </>
      )}
    </button>
  );
}
