import { useMemo, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import { FaPlay, FaRegCopy, FaCheck, FaHeart } from "react-icons/fa";
import { useCollectionStore } from "@/stores/collection-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { usePlayerStore } from "@/stores/player-store";
import { useListenedStore } from "@/stores/listened-store";
import { copyToClipboard } from "@/utils/clipboard";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import clsx from "clsx";

export function FavoritesPage() {
  const { t } = useTranslation();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const playItem = usePlayerStore((s) => s.playItem);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listenedIds = useListenedStore((s) => s.listenedIds);
  const listenedSet = useMemo(() => new Set(listenedIds), [listenedIds]);

  const favoriteItems = useMemo(() => {
    const allItems = [...items, ...userItems];
    const idSet = new Set(favoriteIds);
    return allItems.filter((item) => idSet.has(item.id));
  }, [items, userItems, favoriteIds]);

  const virtualizer = useVirtualizer({
    count: favoriteItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const handleCopy = useCallback(async (item: RtttlEntry) => {
    const success = await copyToClipboard(item.code);
    if (success) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  if (favoriteItems.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
        <FaHeart size={48} className="opacity-50" />
        <p className="text-center">{t("favorites.empty")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        {t("favorites.title")}
      </h2>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {t("search.totalItems", { count: favoriteItems.length })}
      </p>
      <div
        ref={parentRef}
        className="h-[calc(100vh-320px)] min-h-100 overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = favoriteItems[virtualRow.index];
            const isActive = currentItem?.id === item.id;
            const isListened = listenedSet.has(item.id);

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={clsx(
                  "flex cursor-pointer items-center gap-2 border-b border-gray-100 px-4 transition-colors hover:bg-indigo-50 dark:border-gray-800 dark:hover:bg-indigo-950/30",
                  isActive && "bg-indigo-50 dark:bg-indigo-950/30",
                  !isActive && isListened && "bg-amber-50/60 dark:bg-amber-950/20",
                )}
                onClick={() => setCurrentItem(item)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playItem(item);
                  }}
                  className="shrink-0 rounded-full bg-indigo-100 p-1.5 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900"
                >
                  <FaPlay size={14} />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  {item.artist && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {item.artist}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="text-red-500 hover:text-red-600"
                    title={t("favorites.remove")}
                  >
                    <FaHeart size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {copiedId === item.id ? (
                      <FaCheck size={16} className="text-green-500" />
                    ) : (
                      <FaRegCopy size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
