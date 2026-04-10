import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaGithub, FaBug, FaExternalLinkAlt } from "react-icons/fa";

import { LanguageSwitcher } from "./language_switcher";
import { COLLECTIONS } from "../constants/collections";

interface AppFooterProps {
  resetConsent: () => void;
}

export function AppFooter({ resetConsent }: AppFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 text-center sm:text-left sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand / About */}
          <div>
            <Link to="/" className="mb-3 inline-flex items-center gap-2">
              <span className="font-brand text-lg font-bold tracking-wider text-gray-900 dark:text-white">
                {t("app.title")}
              </span>
            </Link>
            <p className="mb-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("footer.aboutDescription")}
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/explooosion/rtttl-hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <FaGithub size={14} />
                  {t("footer.sourceCode")}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/explooosion/rtttl-hub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <FaBug size={14} />
                  {t("footer.reportIssue")}
                </a>
              </li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              {t("footer.discover")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/collections"
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("footer.allCollections")}
                </Link>
              </li>
              {COLLECTIONS.filter((c) => c.group !== "library").map((col) => (
                <li key={col.slug}>
                  {col.source ? (
                    <a
                      href={col.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      {t(col.nameKey)}
                      <FaExternalLinkAlt size={11} />
                    </a>
                  ) : (
                    <Link
                      to={`/collections/${col.slug}`}
                      className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      {t(col.nameKey)}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link
                  to="/favorites"
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("nav.favorites")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              {t("footer.resources")}
            </h4>
            <ul className="space-y-2 text-sm">
              {COLLECTIONS.filter((c) => c.group === "library").map((col) => (
                <li key={col.slug}>
                  <a
                    href={col.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  >
                    {t(col.nameKey)}
                    <FaExternalLinkAlt size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/terms"
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("footer.cookies")}
                </Link>
              </li>
              <li>
                <button
                  onClick={resetConsent}
                  className="text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("footer.cookieSettings")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row dark:border-gray-800 dark:text-gray-500">
          <span>{t("footer.copyright")}</span>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
