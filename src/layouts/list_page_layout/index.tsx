import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";

import { CodePreviewPanel } from "../../components/code_preview_panel";
import { RTTTL_CATEGORIES } from "../../constants/categories";
import type { RtttlCategory } from "../../utils/rtttl_parser";
import type { SortMode } from "../../stores/collection_store";
import { preloadUserDisplayNames } from "../../services/user_profile_service";
import { FilterPanels } from "./filter_panels";
import { SearchToolbar } from "./search_toolbar";
import {
  getFirstLetter,
  ITEMS_PER_PAGE,
  matchesSearch,
  sortItems,
  type BreadcrumbItem,
  type ListPageLayoutProps,
  type RowData,
  type SortOption,
} from "./shared";
import { TrackListContent } from "./track_list_content";

export type { BreadcrumbItem } from "./shared";

export function ListPageLayout({
  items,
  breadcrumbs,
  title,
  description,
  source,
  headerActions,
  extraRowActions,
  showActionsAsMenu = false,
  emptyNode,
}: ListPageLayoutProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("plays-high");
  const [trackCount, setTrackCount] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<RtttlCategory[]>(() => {
    const category = searchParams.get("category") as RtttlCategory | null;
    return category && RTTTL_CATEGORIES.includes(category) ? [category] : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filteredItems = useMemo(
    function buildFilteredItems() {
      let result = items;
      if (searchQuery.trim()) {
        result = result.filter((item) => matchesSearch(item, searchQuery));
      }
      if (activeLetter) {
        result = result.filter((item) => getFirstLetter(item) === activeLetter);
      }
      if (activeCategories.length > 0) {
        result = result.filter(
          (item) =>
            item.categories &&
            item.categories.some((category) => activeCategories.includes(category)),
        );
      }
      if (trackCount !== null) {
        result = result.filter((item) => {
          const itemTrackCount = item.tracks && item.tracks.length > 1 ? item.tracks.length : 1;
          return itemTrackCount === trackCount;
        });
      }
      return sortItems(result, sortMode);
    },
    [items, searchQuery, activeLetter, activeCategories, trackCount, sortMode],
  );

  const availableLetters = useMemo(
    function buildAvailableLetters() {
      let base = items;
      if (searchQuery.trim()) {
        base = base.filter((item) => matchesSearch(item, searchQuery));
      }
      if (activeCategories.length > 0) {
        base = base.filter(
          (item) =>
            item.categories &&
            item.categories.some((category) => activeCategories.includes(category)),
        );
      }
      const letterSet = new Set(base.map(getFirstLetter));
      return Array.from(letterSet).sort();
    },
    [items, searchQuery, activeCategories],
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(
    function buildPageItems() {
      const start = (safePage - 1) * ITEMS_PER_PAGE;
      return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    },
    [filteredItems, safePage],
  );

  const rowData = useMemo(
    function buildRowData() {
      const rows: RowData[] = [];
      let last = "";
      for (const item of pageItems) {
        const letter = getFirstLetter(item);
        if (letter !== last) {
          rows.push({ type: "header", letter });
          last = letter;
        }
        rows.push({ type: "item", item });
      }
      return rows;
    },
    [pageItems],
  );

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

  const sortOptions: SortOption[] = [
    { value: "a-z", label: t("sort.aToZ") },
    { value: "z-a", label: t("sort.zToA") },
    { value: "artist-a-z", label: t("sort.artistAZ") },
    { value: "artist-z-a", label: t("sort.artistZA") },
    { value: "plays-high", label: t("sort.playsHigh") },
    { value: "plays-low", label: t("sort.playsLow") },
  ];

  const categoryToggleHandlers = useMemo(function buildCategoryToggleHandlers() {
    const handlers: Record<RtttlCategory, () => void> = {} as Record<RtttlCategory, () => void>;
    for (const category of RTTTL_CATEGORIES) {
      handlers[category] = function handleCategoryToggleClick() {
        setActiveCategories((prev) =>
          prev.includes(category)
            ? prev.filter((currentCategory) => currentCategory !== category)
            : [...prev, category],
        );
        setCurrentPage(1);
      };
    }
    return handlers;
  }, []);

  function handleClearCategories() {
    setActiveCategories([]);
    setCurrentPage(1);
  }

  function handleAllLetterClick() {
    setActiveLetter(null);
    setCurrentPage(1);
  }

  const letterToggleHandlers = useMemo(
    function buildLetterToggleHandlers() {
      const handlers: Record<string, () => void> = {};
      for (const letter of availableLetters) {
        handlers[letter] = function handleLetterToggleClick() {
          setActiveLetter((prev) => (prev === letter ? null : letter));
          setCurrentPage(1);
        };
      }
      return handlers;
    },
    [availableLetters],
  );

  const pageNumberClickHandlers = useMemo(
    function buildPageNumberClickHandlers() {
      const handlers: Record<number, () => void> = {};
      for (const page of pageNumbers) {
        handlers[page] = function handlePageNumberClick() {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      }
      return handlers;
    },
    [pageNumbers],
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const value = e.target.value;
    timerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 200);
  }

  function handleSortModeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSortMode(e.target.value as SortMode);
    setCurrentPage(1);
  }

  function handleTrackCountChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setTrackCount(value === "all" ? null : parseInt(value, 10));
    setCurrentPage(1);
  }

  function handleToggleMobileFilters() {
    setShowMobileFilters(!showMobileFilters);
  }

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

  useEffect(
    function preloadDisplayNamesWhenPageItemsChange() {
      preloadUserDisplayNames(pageItems);
    },
    [pageItems],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          {breadcrumbs.map((crumb: BreadcrumbItem, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <FaChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
              )}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {(title || description) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <FaExternalLinkAlt size={12} />
                  <span className="font-medium">{t("collections.officialSource")}</span>
                </a>
              )}
            </div>
          )}
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      )}

      <div className="flex gap-4">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            <FilterPanels
              activeCategories={activeCategories}
              activeLetter={activeLetter}
              availableLetters={availableLetters}
              categoryToggleHandlers={categoryToggleHandlers}
              onClearCategories={handleClearCategories}
              onAllLetterClick={handleAllLetterClick}
              letterToggleHandlers={letterToggleHandlers}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1">
              <SearchToolbar
                sortMode={sortMode}
                trackCount={trackCount}
                sortOptions={sortOptions}
                showMobileFilters={showMobileFilters}
                headerActions={headerActions}
                onSearch={handleSearch}
                onSortModeChange={handleSortModeChange}
                onTrackCountChange={handleTrackCountChange}
                onToggleMobileFilters={handleToggleMobileFilters}
              />

              {showMobileFilters && (
                <div className="mb-4 space-y-4 lg:hidden">
                  <FilterPanels
                    activeCategories={activeCategories}
                    activeLetter={activeLetter}
                    availableLetters={availableLetters}
                    categoryToggleHandlers={categoryToggleHandlers}
                    onClearCategories={handleClearCategories}
                    onAllLetterClick={handleAllLetterClick}
                    letterToggleHandlers={letterToggleHandlers}
                  />
                </div>
              )}

              <TrackListContent
                items={items}
                filteredItemCount={filteredItems.length}
                rowData={rowData}
                extraRowActions={extraRowActions}
                showActionsAsMenu={showActionsAsMenu}
                emptyNode={emptyNode}
                totalPages={totalPages}
                safePage={safePage}
                startPage={startPage}
                endPage={endPage}
                pageNumbers={pageNumbers}
                pageNumberClickHandlers={pageNumberClickHandlers}
                onPrevPageClick={handlePrevPageClick}
                onFirstPageClick={handleFirstPageClick}
                onLastPageClick={handleLastPageClick}
                onNextPageClick={handleNextPageClick}
              />
            </div>

            <div className="hidden w-full lg:sticky lg:top-18 lg:block lg:w-72 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <CodePreviewPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
