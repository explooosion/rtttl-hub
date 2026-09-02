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
  onClose: VoidFunction;
}

export function RootMobileSidebar({ isOpen, onClose }: RootMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [myZoneOpen, setMyZoneOpen] = useState(false);
  const [publicLibsOpen, setPublicLibsOpen] = useState(false);

  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isMyZoneActive = location.pathname.startsWith("/my-zone/");
  const isCreateActive = location.pathname === "/create";
  const isContributeActive = location.pathname === "/contribute";
  const isAboutActive = location.pathname === "/about";
  const isDonateActive = location.pathname === "/donate";

  const myCreationsCollections = COLLECTIONS.filter((c) => c.group === "my-creations");
  const publicLibrariesCollections = COLLECTIONS.filter((c) => c.group === "public-libraries");
  const externalLinksCollections = COLLECTIONS.filter((c) => c.group === "external-links");

  function handlePanelClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  function handleToggleCollectionsOpen() {
    setCollectionsOpen(!collectionsOpen);
  }

  function handleToggleMyZoneOpen() {
    setMyZoneOpen(!myZoneOpen);
  }

  function handleTogglePublicLibrariesOpen() {
    setPublicLibsOpen(!publicLibsOpen);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose}>
      <div
        className="absolute left-0 top-16 bottom-0 w-80 max-w-[85vw] overflow-auto bg-white shadow-xl sm:max-w-sm dark:bg-gray-900"
        onClick={handlePanelClick}
      >
        <nav className="flex flex-col py-3">
          {/* Home */}
          <Link
            to="/"
            onClick={onClose}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors",
              !isCollectionsActive &&
                !isMyZoneActive &&
                !isCreateActive &&
                !isContributeActive &&
                !isAboutActive &&
                !isDonateActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            )}
          >
            {t("nav.home")}
          </Link>

          {/* Collections - Collapsible Section */}
          <div>
            <button
              onClick={handleToggleCollectionsOpen}
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
                  <p className="px-6 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                    onClick={handleTogglePublicLibrariesOpen}
                    className="flex w-full items-center justify-between px-6 pb-1.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                  <p className="px-6 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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

          {/* My Zone - Collapsible Section */}
          <div>
            <button
              onClick={handleToggleMyZoneOpen}
              className={clsx(
                "flex w-full items-center justify-between px-6 py-3 text-left text-sm font-medium transition-colors",
                isMyZoneActive
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
              )}
            >
              <span>{t("collections.group.myCreations", { defaultValue: "My Zone" })}</span>
              <FaChevronDown
                size={12}
                className={clsx("transition-transform", myZoneOpen && "rotate-180")}
              />
            </button>
            {myZoneOpen && (
              <div className="bg-gray-50 dark:bg-gray-800/50">
                <Link
                  to="/my-zone/my-creations"
                  onClick={onClose}
                  className={clsx(
                    "block px-6 py-2.5 text-sm transition-colors",
                    location.pathname === "/my-zone/my-creations"
                      ? "bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900",
                  )}
                >
                  {t("collections.myCreations.name")}
                </Link>
                <Link
                  to="/my-zone/favorites"
                  onClick={onClose}
                  className={clsx(
                    "block px-6 py-2.5 text-sm transition-colors",
                    location.pathname === "/my-zone/favorites"
                      ? "bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900",
                  )}
                >
                  {t("collections.favorites.name")}
                </Link>
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
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
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

          {/* About */}
          <Link
            to="/about"
            onClick={onClose}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors",
              isAboutActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            )}
          >
            {t("footer.about")}
          </Link>

          {/* Donate */}
          <Link
            to="/donate"
            onClick={onClose}
            className={clsx(
              "mx-6 my-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              isDonateActive
                ? "bg-amber-600 text-white"
                : "bg-amber-500 text-white hover:bg-amber-600",
            )}
          >
            {t("nav.donate", { defaultValue: "Support RTTTL Hub" })}
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
            <ThemeToggle mobile />
          </div>
          <div className="mb-3 px-6">
            <LanguageSwitcher mobile />
          </div>
          <div className="px-6">
            <SettingsMenu mobile />
          </div>
        </div>
      </div>
    </div>
  );
}
