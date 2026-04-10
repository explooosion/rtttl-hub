import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { FaMusic } from "react-icons/fa";

import { AppHeader } from "./app_header";
import { AppMobileSidebar } from "./app_mobile_sidebar";
import { AppFooter } from "./app_footer";
import { CookieConsentBanner } from "./cookie_consent_banner";
import { useCollectionStore } from "../stores/collection_store";
import { usePlayerStore } from "../stores/player_store";
import { useCookieConsentStore } from "../stores/cookie_consent_store";
import { toRtttlEntries, type CollectionEntry } from "../utils/collection_loader";

export function AppShell() {
  const { t } = useTranslation();
  const setItems = useCollectionStore((s) => s.setItems);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const resetConsent = useCookieConsentStore((s) => s.resetConsent);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    let lastScrolled = false;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) {
        return;
      }
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
        fetch(`${base}skully-rtttl.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
        fetch(`${base}community.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
        fetch(`${base}esphome.json`).then((r) => r.json() as Promise<CollectionEntry[]>),
      ])
        .then(([picaxeData, escData, skullyData, communityData, esphomeData]) => {
          const picaxeEntries = toRtttlEntries(picaxeData, "picaxe", "picaxe");
          const escEntries = toRtttlEntries(escData, "esc-configurator", "esc");
          const skullyEntries = toRtttlEntries(skullyData, "skully-rtttl", "skully");
          const communityEntries = toRtttlEntries(communityData, "community", "community");
          const esphomeEntries = toRtttlEntries(esphomeData, "esphome", "esphome");
          setItems([
            ...picaxeEntries,
            ...escEntries,
            ...skullyEntries,
            ...communityEntries,
            ...esphomeEntries,
          ]);
        })
        .catch((err) => console.error("Failed to load collection:", err));
    },
    [setItems],
  );

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
      <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} scrolled={scrolled} />
      <AppMobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

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

      <AppFooter resetConsent={resetConsent} />
      <CookieConsentBanner />
    </div>
  );
}
