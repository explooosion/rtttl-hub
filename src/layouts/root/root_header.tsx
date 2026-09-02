import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaGithub, FaSearch } from "react-icons/fa";
import clsx from "clsx";

import { ThemeToggle } from "../../components/theme_toggle";
import { SettingsMenu } from "../../components/settings_menu";
import { LanguageSwitcher } from "../../components/language_switcher";
import { MegaMenu } from "../../components/mega_menu";
import { MyZoneMenu } from "../../components/my_zone_menu";
import { UserMenu } from "../../components/user_menu";
import { useCollectionStore } from "../../stores/collection_store";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;

const preloadCreatePage = () => {
  void import("../../pages/create_page");
};

interface RootHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export function RootHeader({ sidebarOpen, setSidebarOpen }: RootHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = useCollectionStore((s) => s.searchQuery);
  const setSearchQuery = useCollectionStore((s) => s.setSearchQuery);

  const isMyZoneActive = location.pathname.startsWith("/my-zone/");
  const isCollectionsActive =
    location.pathname.startsWith("/collections") && !location.pathname.startsWith("/my-zone/");
  const isCreateActive = location.pathname === "/create";
  const isContributeActive = location.pathname === "/contribute";
  const isAboutActive = location.pathname === "/about";
  const isDonateActive = location.pathname === "/donate";

  // Global searchbar should only appear on homepage and /collections page
  const shouldShowGlobalSearch = location.pathname === "/" || location.pathname === "/collections";

  function handleSidebarToggle() {
    setSidebarOpen(!sidebarOpen);
  }

  function handleGlobalSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() && !location.pathname.startsWith("/collections/")) {
      navigate("/collections/picaxe");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      {/* Main row: always visible */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5">
        {/* Mobile hamburger */}
        <button onClick={handleSidebarToggle} className="shrink-0 lg:hidden">
          {sidebarOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoSrc} alt="RTTTL Hub" width={26} height={26} className="rounded" />
          <h1 className="font-brand text-base font-bold tracking-wider text-gray-900 dark:text-white">
            {t("app.title")}
          </h1>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden shrink-0 items-center gap-4 pl-4 sm:flex">
          <MegaMenu isActive={isCollectionsActive} />
          <MyZoneMenu isActive={isMyZoneActive} />
          <Link
            to="/contribute"
            className={clsx(
              "whitespace-nowrap text-sm font-medium transition-colors",
              isContributeActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {t("breadcrumb.contribute")}
          </Link>
          <Link
            to="/about"
            className={clsx(
              "whitespace-nowrap text-sm font-medium transition-colors",
              isAboutActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {t("footer.about")}
          </Link>
          <Link
            to="/donate"
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isDonateActive
                ? "bg-amber-600 text-white"
                : "bg-amber-500 text-white hover:bg-amber-600",
            )}
          >
            {t("nav.donate", { defaultValue: "Support RTTTL Hub" })}
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

        <div className="flex-1" />

        {/* Right side controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Theme Toggle - hidden on mobile, show from md */}
          <div className="hidden md:flex md:items-center">
            <ThemeToggle />
          </div>
          {/* Language Switcher - icon only, hidden on mobile/tablet, show from lg */}
          <div className="hidden lg:block">
            <LanguageSwitcher iconOnly />
          </div>
          {/* GitHub - hidden on mobile/tablet, show from lg */}
          <a
            href="https://github.com/explooosion/rtttl-hub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 lg:block dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FaGithub size={18} />
          </a>
          {/* Settings Menu - show from md */}
          <div className="hidden md:block">
            <SettingsMenu />
          </div>
          {/* User Menu - always visible */}
          <UserMenu />
        </div>
      </div>

      {/* Search row — only visible when sidebar closed, desktop only, and on homepage/collections */}
      <div
        className={clsx(
          "hidden sm:grid",
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          sidebarOpen || !shouldShowGlobalSearch ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
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
                onChange={handleGlobalSearchChange}
                className="w-full rounded-full border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
