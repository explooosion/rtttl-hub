import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import clsx from "clsx";

import { COLLECTIONS } from "../../constants/collections";
import { ThemeToggle } from "../../components/theme_toggle";
import { SettingsMenu } from "../../components/settings_menu";
import { LanguageSwitcher } from "../../components/language_switcher";

const preloadCreatePage = () => {
  void import("../../pages/create_page");
};

interface RootMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RootMobileSidebar({ isOpen, onClose }: RootMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [publicLibsOpen, setPublicLibsOpen] = useState(false);

  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isCreateActive = location.pathname === "/create";
  const isContributeActive = location.pathname === "/contribute";

  const myCreationsCollections = COLLECTIONS.filter((c) => c.group === "my-creations");
  const publicLibrariesCollections = COLLECTIONS.filter((c) => c.group === "public-libraries");
  const externalLinksCollections = COLLECTIONS.filter((c) => c.group === "external-links");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose}>
      <div
        className="absolute left-0 top-16 bottom-0 w-80 max-w-[85vw] overflow-auto bg-white shadow-xl sm:max-w-sm dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="flex flex-col py-3">
          {/* Home */}
          <Link
            to="/"
            onClick={onClose}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors",
              !isCollectionsActive && !isCreateActive && !isContributeActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            )}
          >
            {t("nav.home")}
          </Link>

          {/* Collections - Collapsible Section */}
          <div>
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className={clsx(
                "flex w-full items-center justify-between px-6 py-3 text-left text-sm font-medium transition-colors",
                isCollectionsActive
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
              )}
            >
              <span>{t("nav.collections")}</span>
              <FaChevronDown
                size={12}
                className={clsx("transition-transform", collectionsOpen && "rotate-180")}
              />
            </button>

            {/* Collections submenu */}
            {collectionsOpen && (
              <div className="bg-gray-50 dark:bg-gray-800/50">
                {/* Browse All */}
                <Link
                  to="/collections"
                  onClick={onClose}
                  className="block px-6 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                >
                  {t("collections.browseAll")} →
                </Link>

                {/* My Creations Group */}
                <div className="py-2">
                  <p className="px-6 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("collections.group.myCreations")}
                  </p>
                  {myCreationsCollections.map((col) => {
                    const Icon = col.icon;
                    const isActive = location.pathname === `/collections/${col.slug}`;
                    return (
                      <Link
                        key={col.slug}
                        to={`/collections/${col.slug}`}
                        onClick={onClose}
                        className={clsx(
                          "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                          isActive
                            ? "bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400"
                            : "text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900",
                        )}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{t(col.nameKey)}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Public Libraries Group - Collapsible */}
                <div className="py-2">
                  <button
                    onClick={() => setPublicLibsOpen(!publicLibsOpen)}
                    className="flex w-full items-center justify-between px-6 pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <span>{t("collections.group.publicLibraries")}</span>
                    <FaChevronDown
                      size={10}
                      className={clsx("transition-transform", publicLibsOpen && "rotate-180")}
                    />
                  </button>
                  <Link
                    to="/collections/public"
                    onClick={onClose}
                    className="block px-6 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-white dark:text-indigo-400 dark:hover:bg-gray-900"
                  >
                    {t("collections.browseAll")} Public →
                  </Link>
                  {publicLibsOpen &&
                    publicLibrariesCollections.map((col) => {
                      const Icon = col.icon;
                      const isActive = location.pathname === `/collections/${col.slug}`;
                      return (
                        <Link
                          key={col.slug}
                          to={`/collections/${col.slug}`}
                          onClick={onClose}
                          className={clsx(
                            "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                            isActive
                              ? "bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400"
                              : "text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900",
                          )}
                        >
                          <Icon size={16} />
                          <span className="flex-1">{t(col.nameKey)}</span>
                        </Link>
                      );
                    })}
                </div>

                {/* External Links Group */}
                <div className="py-2">
                  <p className="px-6 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("collections.group.externalLinks")}
                  </p>
                  {externalLinksCollections.map((col) => {
                    const Icon = col.icon;
                    return (
                      <a
                        key={col.slug}
                        href={col.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 transition-colors hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900"
                      >
                        <Icon size={16} />
                        <span className="flex-1">{t(col.nameKey)}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Create */}
          <Link
            to="/create"
            onClick={onClose}
            onMouseEnter={preloadCreatePage}
            onFocus={preloadCreatePage}
            className={clsx(
              "px-6 py-3 text-sm font-semibold transition-colors",
              isCreateActive
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white",
            )}
          >
            {t("actions.createNew")}
          </Link>

          {/* Contribute */}
          <Link
            to="/contribute"
            onClick={onClose}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors",
              isContributeActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            )}
          >
            {t("actions.contribute")}
          </Link>
        </nav>

        {/* Settings — Theme + Config (desktop header items moved here) */}
        <div className="mt-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between px-6">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("settings.title", { defaultValue: "Settings" })}
            </span>
          </div>
          <div className="mb-3 flex items-center gap-3 px-6">
            <ThemeToggle />
          </div>
          <div className="mb-3 px-6">
            <LanguageSwitcher />
          </div>
          <div className="px-6">
            <SettingsMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
