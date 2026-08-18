import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronRight } from "react-icons/fa";
import clsx from "clsx";

import { useCookieConsentStore } from "../stores/cookie_consent_store";

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { hasConsented, acceptAll, rejectAll, savePreferences } = useCookieConsentStore();

  const [showDetails, setShowDetails] = useState(false);
  const [prefEnabled, setPrefEnabled] = useState(true);
  const [statsEnabled, setStatsEnabled] = useState(true);

  if (hasConsented) {
    return null;
  }

  const handleSave = () => {
    savePreferences({ preferences: prefEnabled, statistics: statsEnabled });
  };

  function handleShowDetails() {
    setShowDetails(true);
  }

  function handleTogglePrefEnabled() {
    setPrefEnabled(!prefEnabled);
  }

  function handleToggleStatsEnabled() {
    setStatsEnabled(!statsEnabled);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-5xl">
        {!showDetails ? (
          /* Simple view */
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                {t("cookie.title")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("cookie.description")}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={acceptAll}
                className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:border-gray-200 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {t("cookie.acceptAll")}
              </button>
              <button
                onClick={handleShowDetails}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("cookie.managePreferences")}
                <FaChevronRight size={10} />
              </button>
              <button
                onClick={rejectAll}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("cookie.rejectAll")}
              </button>
            </div>
          </div>
        ) : (
          /* Detail view */
          <div>
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              {t("cookie.managePreferences")}
            </p>
            <div className="mb-4 space-y-3">
              {/* Necessary - always on */}
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("cookie.necessary")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t("cookie.necessaryDesc")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("cookie.alwaysActive")}
                </span>
              </div>

              {/* Preferences */}
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("cookie.preferences")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t("cookie.preferencesDesc")}
                  </p>
                </div>
                <button
                  onClick={handleTogglePrefEnabled}
                  className={clsx(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    prefEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600",
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      prefEnabled && "translate-x-5",
                    )}
                  />
                </button>
              </div>

              {/* Statistics */}
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("cookie.statistics")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t("cookie.statisticsDesc")}
                  </p>
                </div>
                <button
                  onClick={handleToggleStatsEnabled}
                  className={clsx(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    statsEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600",
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      statsEnabled && "translate-x-5",
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:border-gray-200 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {t("cookie.savePreferences")}
              </button>
              <button
                onClick={acceptAll}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("cookie.acceptAll")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
