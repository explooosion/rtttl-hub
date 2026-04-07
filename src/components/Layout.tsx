import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaMusic, FaHeart, FaPlus, FaBars, FaTimes, FaGithub, FaBug, FaExternalLinkAlt } from "react-icons/fa";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SettingsMenu } from "./SettingsMenu";
import { SearchBar } from "./SearchBar";
import { AlphabetSidebar } from "./AlphabetSidebar";
import { CollectionList } from "./CollectionList";
import { Player } from "./Player";
import { RtttlEditor } from "./RtttlEditor";
import { CreateDialog } from "./CreateDialog";
import { FavoritesPage } from "./FavoritesPage";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import clsx from "clsx";

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const isLoading = useCollectionStore((s) => s.isLoading);
  const setItems = useCollectionStore((s) => s.setItems);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentItem = usePlayerStore((s) => s.currentItem);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<RtttlEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isFavoritesPage = location.pathname === "/favorites";

  useEffect(function loadCollectionWhenMount() {
    fetch(`${import.meta.env.BASE_URL}rtttl-index.json`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Failed to load collection:", err));
  }, [setItems]);

  const handleDuplicate = useCallback((item: RtttlEntry) => {
    setDuplicateFrom(item);
    setCreateDialogOpen(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setDuplicateFrom(null);
    setCreateDialogOpen(true);
  }, []);

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
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <FaMusic size={24} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("app.title")}
            </h1>
          </Link>

          <div className="hidden flex-1 sm:block" />

          {/* Nav links */}
          <nav className="hidden items-center gap-4 sm:flex">
            <Link
              to="/"
              className={clsx(
                "text-sm font-medium transition-colors",
                !isFavoritesPage
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
              )}
            >
              {t("nav.collection")}
            </Link>
            <Link
              to="/favorites"
              className={clsx(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                isFavoritesPage
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
              )}
            >
              <FaHeart size={14} />
              {t("nav.favorites")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <SettingsMenu />
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-4">
          {/* Alphabet sidebar - desktop */}
          {!isFavoritesPage && (
            <aside
              className={clsx(
                "hidden w-10 shrink-0 lg:block",
              )}
            >
              <div className="sticky top-20">
                <AlphabetSidebar />
              </div>
            </aside>
          )}

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <div
                className="absolute left-0 top-16 bottom-0 w-64 overflow-auto bg-white p-4 shadow-xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="mb-4 flex flex-col gap-2 sm:hidden">
                  <Link
                    to="/"
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      !isFavoritesPage
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {t("nav.collection")}
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
                      isFavoritesPage
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    <FaHeart size={14} />
                    {t("nav.favorites")}
                  </Link>
                </nav>
                {!isFavoritesPage && <AlphabetSidebar />}
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {isFavoritesPage ? (
              <FavoritesPage />
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Left side: list */}
                <div className="flex-1">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex-1">
                      <SearchBar />
                    </div>
                    <button
                      onClick={handleCreateNew}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <FaPlus size={16} />
                      <span className="hidden sm:inline">{t("actions.createNew")}</span>
                    </button>
                  </div>
                  <CollectionList onDuplicate={handleDuplicate} />
                </div>

                {/* Right side: player + editor */}
                <div className="w-full space-y-4 lg:w-80 xl:w-96">
                  <Player />
                  <RtttlEditor />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

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

      <CreateDialog
        isOpen={createDialogOpen}
        duplicateFrom={duplicateFrom}
        onClose={() => {
          setCreateDialogOpen(false);
          setDuplicateFrom(null);
        }}
      />

      {/* Footer */}
      <footer className="mx-auto mt-8 max-w-7xl border-t border-gray-200 px-4 py-6 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          <a
            href="https://github.com/explooosion/rtttl-player"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FaGithub size={16} />
            {t("footer.sourceCode")}
          </a>
          <a
            href="https://github.com/explooosion/rtttl-player/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FaBug size={16} />
            {t("footer.reportIssue")}
          </a>
          <a
            href="https://picaxe.com/rtttl-ringtones-for-tune-command/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FaExternalLinkAlt size={16} />
            {t("footer.picaxeCollection")}
          </a>
        </div>
      </footer>
    </div>
  );
}
