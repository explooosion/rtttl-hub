import { useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";

import { copyToClipboard } from "../../../utils/clipboard";

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
}

export function CopyButton({ text, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCopyClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    void handleCopy();
  }

  return (
    <button
      type="button"
      onClick={handleCopyClick}
      disabled={disabled}
      title="Copy"
      className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
    >
      {copied ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
    </button>
  );
}
