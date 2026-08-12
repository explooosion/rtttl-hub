import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const STORAGE_KEY = "rtttl-beta-notice-dismissed";

export function BetaNoticeBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) {
    return null;
  }

  function handleDismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors in restricted environments
    }
    setDismissed(true);
  }

  return (
    <div className="relative z-50 flex items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800/50 dark:bg-amber-900/20">
      <FaExclamationTriangle size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 text-xs text-amber-800 dark:text-amber-300 sm:text-[13px]">
        {t("betaBanner.message", {
          defaultValue:
            "RTTTL Hub is currently under active development. Some features may be incomplete or temporarily unavailable.",
        })}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("betaBanner.dismiss", { defaultValue: "Dismiss" })}
        className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-800/40"
      >
        <FaTimes size={11} />
      </button>
    </div>
  );
}
