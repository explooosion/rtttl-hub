import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import clsx from "clsx";

import { useFilteredItems } from "../stores/collection_store";
import { TrackRow, LetterHeader } from "./track_row";
import type { RtttlEntry } from "../utils/rtttl_parser";

const ITEMS_PER_PAGE = 50;

export function CollectionList() {
  const { t } = useTranslation();
  const items = useFilteredItems();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, safePage]);

  // Group page items by first letter
  const rowData = useMemo(() => {
    const rows: Array<{ type: "header"; letter: string } | { type: "item"; item: RtttlEntry }> = [];
    let lastLetter = "";
    for (const item of pageItems) {
      if (item.firstLetter !== lastLetter) {
        rows.push({ type: "header", letter: item.firstLetter });
        lastLetter = item.firstLetter;
      }
      rows.push({ type: "item", item });
    }
    return rows;
  }, [pageItems]);

  const goToPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (page <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(page));
        }
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  // Build page number links (show up to 7 pages around current)
  const maxVisible = 7;
  const { pageNumbers, startPage, endPage } = useMemo(
    function buildPageNumbers() {
      const nextPageNumbers: number[] = [];
      let nextStartPage = Math.max(1, safePage - Math.floor(maxVisible / 2));
      const nextEndPage = Math.min(totalPages, nextStartPage + maxVisible - 1);
      if (nextEndPage - nextStartPage + 1 < maxVisible) {
        nextStartPage = Math.max(1, nextEndPage - maxVisible + 1);
      }
      for (let page = nextStartPage; page <= nextEndPage; page++) {
        nextPageNumbers.push(page);
      }
      return {
        pageNumbers: nextPageNumbers,
        startPage: nextStartPage,
        endPage: nextEndPage,
      };
    },
    [safePage, totalPages],
  );

  const pageNumberClickHandlers = useMemo(
    function buildPageNumberClickHandlers() {
      const handlers: Record<number, () => void> = {};
      for (const page of pageNumbers) {
        handlers[page] = function handlePageNumberClick() {
          goToPage(page);
        };
      }
      return handlers;
    },
    [pageNumbers, goToPage],
  );

  function handlePrevPageClick() {
    goToPage(safePage - 1);
  }

  function handleFirstPageClick() {
    goToPage(1);
  }

  function handleLastPageClick() {
    goToPage(totalPages);
  }

  function handleNextPageClick() {
    goToPage(safePage + 1);
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        {t("search.noResults")}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {rowData.map((row, index) => {
          if (row.type === "header") {
            return <LetterHeader key={`header-${row.letter}-${index}`} letter={row.letter} />;
          }

          return <TrackRow key={`item-${row.item.id}`} item={row.item} />;
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={handlePrevPageClick}
            disabled={safePage <= 1}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FaChevronLeft size={14} />
          </button>
          {startPage > 1 && (
            <>
              <button
                onClick={handleFirstPageClick}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-gray-400">…</span>}
            </>
          )}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={pageNumberClickHandlers[page]}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                page === safePage
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {page}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
              <button
                onClick={handleLastPageClick}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={handleNextPageClick}
            disabled={safePage >= totalPages}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
