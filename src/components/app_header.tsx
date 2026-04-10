import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaGithub, FaSearch } from "react-icons/fa";
import clsx from "clsx";

import { ThemeToggle } from "./theme_toggle";
import { SettingsMenu } from "./settings_menu";
import { MegaMenu } from "./mega_menu";
import { UserMenu } from "./user_menu";
import { useCollectionStore } from "../stores/collection_store";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;

const preloadCreatePage = () => {
  void import("../pages/create_page");
};

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  scrolled: boolean;
}

export function AppHeader({ sidebarOpen, setSidebarOpen, scrolled }: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = useCollectionStore((s) => s.searchQuery);
  const setSearchQuery = useCollectionStore((s) => s.setSearchQuery);

  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isFavoritesActive = location.pathname === "/favorites";
  const isCreateActive = location.pathname === "/create";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      {/* Main row: always visible */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5">
        {/* Mobile hamburger */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0 lg:hidden">
          {sidebarOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoSrc} alt="RTTTL Hub" width={26} height={26} className="rounded" />
          <h1 className="font-brand text-base font-bold tracking-wider text-gray-900 dark:text-white">
            {t("app.title")}
          </h1>
        </Link>

        {/* Desktop nav — hidden when scrolled */}
        <nav
          className={clsx(
            "hidden shrink-0 items-center gap-4 pl-4 sm:flex",
            "transition-all duration-300",
            scrolled ? "w-0 overflow-hidden opacity-0 pl-0" : "opacity-100",
          )}
        >
          <MegaMenu isActive={isCollectionsActive} />
          <Link
            to="/favorites"
            className={clsx(
              "whitespace-nowrap text-sm font-medium transition-colors",
              isFavoritesActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {t("nav.favorites")}
          </Link>
          <Link
            to="/create"
            onMouseEnter={preloadCreatePage}
            onFocus={preloadCreatePage}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-brand font-bold tracking-wider transition-colors",
              isCreateActive
                ? "bg-indigo-700 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700",
            )}
          >
            {t("actions.createNew")}
          </Link>
        </nav>

        {/* Searchbar — only visible when scrolled */}
        <div
          className={clsx(
            "relative transition-all duration-300",
            scrolled ? "flex-1 opacity-100" : "w-0 overflow-hidden opacity-0",
          )}
        >
          <FaSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() && !location.pathname.startsWith("/collections/")) {
                navigate("/collections/picaxe");
              }
            }}
            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
          />
        </div>

        {!scrolled && <div className="flex-1" />}

        {/* Right side controls */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href="https://github.com/explooosion/rtttl-hub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaGithub size={18} />
          </a>
          <SettingsMenu />
          <UserMenu />
        </div>
      </div>

      {/* Search row — only visible when NOT scrolled and sidebar is closed */}
      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          scrolled || sidebarOpen ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pt-1 pb-3">
            <div className="relative">
              <FaSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && !location.pathname.startsWith("/collections/")) {
                    navigate("/collections/picaxe");
                  }
                }}
                className="w-full rounded-full border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
