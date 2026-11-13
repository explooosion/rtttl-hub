import { useTranslation } from "react-i18next";
import { FaCheck, FaStar } from "react-icons/fa";

import { FREE_DAILY_UPLOAD_LIMIT, FREE_MAX_ANALYSIS_SECONDS } from "../constants/donation_tiers";

const GITHUB_REPO_URL = "https://github.com/explooosion/rtttl-hub";

export function DonatePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <FaStar size={40} className="text-amber-400" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          {t("donate.title")}
        </h1>
        <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">{t("donate.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="donate-status-title"
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <h2
            id="donate-status-title"
            className="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
          >
            {t("donate.statusTitle")}
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>{t("donate.modelProgress")}</p>
            <p>{t("donate.futurePlans")}</p>
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <FaStar aria-hidden="true" size={14} />
            {t("donate.githubCta")}
          </a>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t("donate.githubThanks")}
          </p>
        </section>

        <section
          aria-labelledby="donate-free-title"
          className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <h2
            id="donate-free-title"
            className="mb-6 text-xl font-semibold text-gray-900 dark:text-white"
          >
            {t("donate.freeTitle")}
          </h2>

          <div className="mb-6 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <FaCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.uploads", { count: FREE_DAILY_UPLOAD_LIMIT })}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FaCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.seconds", { count: FREE_MAX_ANALYSIS_SECONDS })}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FaCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.freeNote")}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center justify-center rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
            {t("donate.freeCta")}
          </div>
        </section>
      </div>
    </div>
  );
}
