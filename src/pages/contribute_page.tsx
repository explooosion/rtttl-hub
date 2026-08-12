import { useTranslation } from "react-i18next";
import { FaMusic, FaLayerGroup, FaGithub, FaExternalLinkAlt, FaCheck } from "react-icons/fa";

import { Breadcrumb } from "../components/breadcrumb";

const COMMUNITY_ISSUE_URL = "https://github.com/explooosion/rtttl-hub/issues/2";
const COLLECTION_ISSUE_URL = "https://github.com/explooosion/rtttl-hub/issues/3";

export function ContributePage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in-up mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("breadcrumb.contribute") }]}
      />

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          {t("contribute.title")}
        </h1>
        <p className="mx-auto max-w-xl text-base text-gray-500 dark:text-gray-400">
          {t("contribute.subtitle")}
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Community Song Submission */}
        <div className="flex flex-col rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-indigo-900/40 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              <FaMusic size={18} />
            </div>
            <h2 className="flex-1 text-lg font-bold text-gray-900 dark:text-white">
              {t("contribute.community.title")}
            </h2>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              {t("contribute.community.badge")}
            </span>
          </div>

          <p className="mb-4 flex-1 text-sm text-gray-500 dark:text-gray-400">
            {t("contribute.community.description")}
          </p>

          <ul className="mb-6 space-y-2">
            {(["bullet1", "bullet2", "bullet3"] as const).map((key) => (
              <li
                key={key}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <FaCheck size={12} className="mt-0.5 shrink-0 text-indigo-500" />
                <span>{t(`contribute.community.${key}`)}</span>
              </li>
            ))}
          </ul>

          <a
            href={COMMUNITY_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <FaGithub size={15} />
            {t("contribute.community.cta")}
            <FaExternalLinkAlt size={11} />
          </a>
        </div>

        {/* Curated Collection Submission */}
        <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <FaLayerGroup size={18} />
            </div>
            <h2 className="flex-1 text-lg font-bold text-gray-900 dark:text-white">
              {t("contribute.collection.title")}
            </h2>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              {t("contribute.collection.badge")}
            </span>
          </div>

          <p className="mb-4 flex-1 text-sm text-gray-500 dark:text-gray-400">
            {t("contribute.collection.description")}
          </p>

          <ul className="mb-6 space-y-2">
            {(["bullet1", "bullet2", "bullet3"] as const).map((key) => (
              <li
                key={key}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <FaCheck size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{t(`contribute.collection.${key}`)}</span>
              </li>
            ))}
          </ul>

          <a
            href={COLLECTION_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <FaGithub size={15} />
            {t("contribute.collection.cta")}
            <FaExternalLinkAlt size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
