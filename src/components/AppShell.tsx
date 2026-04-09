import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  FaMusic,
  FaBars,
  FaTimes,
  FaGithub,
  FaBug,
  FaExternalLinkAlt,
  FaSearch,
} from "react-icons/fa";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SettingsMenu } from "./SettingsMenu";
import { MegaMenu } from "./MegaMenu";
import { UserMenu } from "./UserMenu";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { useCookieConsentStore } from "@/stores/cookie-consent-store";
import { COLLECTIONS } from "@/constants/collections";
import { MOCK_COMMUNITY_ITEMS } from "@/data/mock-community";
import { toRtttlEntries, type CollectionEntry } from "@/utils/collection-loader";
import clsx from "clsx";

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const setItems = useCollectionStore((s) => s.setItems);
  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const searchQuery = useCollectionStore((s) => s.searchQuery);
  const setSearchQuery = useCollectionStore((s) => s.setSearchQuery);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const resetConsent = useCookieConsentStore((s) => s.resetConsent);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isFavoritesActive = location.pathname === "/favorites";
  const isCreateActive = location.pathname === "/create";

  useEffect(() => {
    let lastScrolled = false;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (!lastScrolled && y > 80) {
          lastScrolled = true;
          setScrolled(true);
        } else if (lastScrolled && y < 10) {
          lastScrolled = false;
          setScrolled(false);
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(
    function loadCollectionWhenMount() {
      const base = import.meta.env.BASE_URL;
      Promise.all([
        fetch(`${base}picaxe.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
        fetch(`${base}esc-configurator.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
      ])
        .then(([picaxeData, escData]) => {
          const picaxeEntries = toRtttlEntries(picaxeData, "picaxe", "picaxe");
          const escEntries = toRtttlEntries(escData, "esc-configurator", "esc");
          setItems([...picaxeEntries, ...escEntries]);
          // Read live state to avoid stale closure race in React Strict Mode
          if (useCollectionStore.getState().userItems.length === 0) {
            for (const item of MOCK_COMMUNITY_ITEMS) {
              addUserItem(item);
            }
          }
        })
        .catch((err) => console.error("Failed to load collection:", err));
    },
    [setItems, addUserItem],
  );

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <FaMusic size={48} className="mx-auto mb-4 animate-pulse text-indigo-500" />
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              className="w-full rounded-full border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
            />
          </div>

          {!scrolled && <div className="flex-1" />}

          {/* Right side controls */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <SettingsMenu />
            <UserMenu />
          </div>
        </div>

        {/* Search row — only visible when NOT scrolled */}
        <div
          className={clsx(
            "grid transition-[grid-template-rows] duration-300 ease-in-out",
            scrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={closeSidebar}>
          <div
            className="absolute left-0 top-16 bottom-0 w-64 overflow-auto bg-white p-4 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={closeSidebar}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  !isCollectionsActive && !isFavoritesActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/collections"
                onClick={closeSidebar}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isCollectionsActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {t("nav.collections")}
              </Link>
              <Link
                to="/favorites"
                onClick={closeSidebar}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isFavoritesActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {t("nav.favorites")}
              </Link>
              <Link
                to="/create"
                onClick={closeSidebar}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isCreateActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {t("actions.createNew")}
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <Outlet />

      {/* Mobile now-playing bar */}
      {currentItem && playerState === "playing" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-2 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95 lg:hidden">
          <div className="flex items-center gap-3">
            <FaMusic size={20} className="animate-pulse text-indigo-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {currentItem.title}
              </p>
              {currentItem.artist && (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {currentItem.artist}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand / About */}
            <div>
              <Link to="/" className="mb-3 flex items-center gap-2">
                <span className="font-brand text-lg font-bold tracking-wider text-gray-900 dark:text-white">
                  {t("app.title")}
                </span>
              </Link>
              <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t("footer.aboutDescription")}
              </p>
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
                {COLLECTIONS.map((col) => (
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
            <LanguageSwitcher />
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}
