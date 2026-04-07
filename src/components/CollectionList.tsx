import { useRef, useState, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import { FaPlay, FaRegCopy, FaCheck, FaClone } from "react-icons/fa";
import { useFilteredItems } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { useListenedStore } from "@/stores/listened-store";
import { FavoriteButton } from "./FavoriteButton";
import { copyToClipboard } from "@/utils/clipboard";
import type { RtttlEntry } from "@/utils/rtttl-parser";
import clsx from "clsx";

interface CollectionListProps {
  onDuplicate: (item: RtttlEntry) => void;
}

export function CollectionList({ onDuplicate }: CollectionListProps) {
  const { t } = useTranslation();
  const items = useFilteredItems();
  const playItem = usePlayerStore((s) => s.playItem);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listenedIds = useListenedStore((s) => s.listenedIds);
  const listenedSet = useMemo(() => new Set(listenedIds), [listenedIds]);

  // Group items by first letter for headers
  const rowData = useMemo(() => {
    const rows: Array<
      | { type: "header"; letter: string }
      | { type: "item"; item: RtttlEntry }
    > = [];
    let lastLetter = "";
    for (const item of items) {
      if (item.firstLetter !== lastLetter) {
        rows.push({ type: "header", letter: item.firstLetter });
        lastLetter = item.firstLetter;
      }
      rows.push({ type: "item", item });
    }
    return rows;
  }, [items]);

  const virtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rowData[index].type === "header" ? 36 : 56),
    overscan: 20,
  });

  const handleCopy = useCallback(
    async (item: RtttlEntry) => {
      const success = await copyToClipboard(item.code);
      if (success) {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    },
    [],
  );

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        {t("search.noResults")}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {t("search.totalItems", { count: items.length })}
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
            const row = rowData[virtualRow.index];

            if (row.type === "header") {
              return (
                <div
                  key={`header-${row.letter}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center bg-gray-100 px-4 dark:bg-gray-800"
                >
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {row.letter}
                  </span>
                </div>
              );
            }

            const item = row.item;
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
                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playItem(item);
                  }}
                  className="shrink-0 rounded-full bg-indigo-100 p-1.5 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900"
                >
                  <FaPlay size={14} />
                </button>

                {/* Title & artist */}
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

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <FavoriteButton itemId={item.id} size={16} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    title={t("editor.copyCode")}
                  >
                    {copiedId === item.id ? (
                      <FaCheck size={16} className="text-green-500" />
                    ) : (
                      <FaRegCopy size={16} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(item);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    title={t("actions.duplicate")}
                  >
                    <FaClone size={16} />
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
