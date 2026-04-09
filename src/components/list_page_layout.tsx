import { useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch, FaChevronRight, FaChevronLeft, FaExternalLinkAlt } from "react-icons/fa";
import { CodePreviewPanel } from "./code_preview_panel";
import { TrackRow, LetterHeader } from "./track_row";
import type { TrackRowAction } from "./track_row";
import { RTTTL_CATEGORIES } from "@/constants/categories";
import type { RtttlEntry, RtttlCategory } from "@/utils/rtttl_parser";
import type { SortMode } from "@/stores/collection_store";
import clsx from "clsx";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface ListPageLayoutProps {
  items: RtttlEntry[];
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  /** Official source URL shown as attribution under the description */
  source?: string;
  /** Extra buttons in the search toolbar (e.g. Create New) */
  headerActions?: React.ReactNode;
  /** Extra row action buttons per item (e.g. Duplicate) */
  extraRowActions?: TrackRowAction[];
  /** Shown when `items` prop is empty (before local filters) */
  emptyNode?: React.ReactNode;
}

const ITEMS_PER_PAGE = 50;

function matchesSearch(item: RtttlEntry, q: string): boolean {
  const lq = q.toLowerCase();
  return (
    item.title.toLowerCase().includes(lq) ||
    item.artist.toLowerCase().includes(lq) ||
    item.code.toLowerCase().includes(lq)
  );
}

function sortItems(arr: RtttlEntry[], mode: SortMode): RtttlEntry[] {
  const sorted = [...arr];
  if (mode === "a-z") sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (mode === "z-a") sorted.sort((a, b) => b.title.localeCompare(a.title));
  else if (mode === "artist-a-z")
    sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  else if (mode === "artist-z-a")
    sorted.sort((a, b) => b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title));
  return sorted;
}

function getFirstLetter(item: RtttlEntry): string {
  return item.firstLetter ?? (item.title[0] ?? "#").toUpperCase();
}

export function ListPageLayout({
  items,
  breadcrumbs,
  title,
  description,
  source,
  headerActions,
  extraRowActions,
  emptyNode,
}: ListPageLayoutProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("a-z");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<RtttlCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Apply filters
  const filteredItems = useMemo(() => {
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
          (item.category && activeCategories.includes(item.category)) ||
          (item.sourceCategory && activeCategories.includes(item.sourceCategory as RtttlCategory)),
      );
    }
    return sortItems(result, sortMode);
  }, [items, searchQuery, activeLetter, activeCategories, sortMode]);

  // Available letters derived from items filtered by search+category (not letter)
  const availableLetters = useMemo(() => {
    let base = items;
    if (searchQuery.trim()) base = base.filter((item) => matchesSearch(item, searchQuery));
    if (activeCategories.length > 0) {
      base = base.filter(
        (item) =>
          (item.category && activeCategories.includes(item.category)) ||
          (item.sourceCategory && activeCategories.includes(item.sourceCategory as RtttlCategory)),
      );
    }
    const set = new Set(base.map(getFirstLetter));
    return Array.from(set).sort();
  }, [items, searchQuery, activeCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safePage]);

  const rowData = useMemo(() => {
    const rows: Array<{ type: "header"; letter: string } | { type: "item"; item: RtttlEntry }> = [];
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
  }, [pageItems]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
    }, 200);
  }, []);

  const handleLetterToggle = useCallback((letter: string | null) => {
    setActiveLetter((prev) => (letter === null || prev === letter ? null : letter));
    setCurrentPage(1);
  }, []);

  const handleCategoryToggle = useCallback((cat: RtttlCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setCurrentPage(1);
  }, []);

  const handleClearCategories = useCallback(() => {
    setActiveCategories([]);
    setCurrentPage(1);
  }, []);

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "a-z", label: t("sort.aToZ") },
    { value: "z-a", label: t("sort.zToA") },
    { value: "artist-a-z", label: t("sort.artistAZ") },
    { value: "artist-z-a", label: t("sort.artistZA") },
  ];

  // Pagination numbers
  const pageNumbers: number[] = [];
  const maxVisible = 7;
  let startPage = Math.max(1, safePage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const categoryFilterUI = (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {t("create.category")}
      </h4>
      <div className="space-y-1">
        <label
          className={clsx(
            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
            activeCategories.length === 0 && "font-medium text-indigo-600 dark:text-indigo-400",
          )}
        >
          <input
            type="checkbox"
            checked={activeCategories.length === 0}
            onChange={handleClearCategories}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <span>{t("categories.all")}</span>
        </label>
        {RTTTL_CATEGORIES.map((cat) => (
          <label
            key={cat}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
              activeCategories.includes(cat) && "font-medium text-indigo-600 dark:text-indigo-400",
            )}
          >
            <input
              type="checkbox"
              checked={activeCategories.includes(cat)}
              onChange={() => handleCategoryToggle(cat)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span>{t(`categories.${cat}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const alphabetUI = (
    <div className="flex flex-row flex-wrap gap-1">
      <button
        onClick={() => handleLetterToggle(null)}
        className={clsx(
          "rounded px-2 py-1 text-xs font-medium transition-colors",
          activeLetter === null
            ? "bg-indigo-600 text-white"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700",
        )}
      >
        {t("letters.all")}
      </button>
      {availableLetters.map((letter) => (
        <button
          key={letter}
          onClick={() => handleLetterToggle(letter)}
          className={clsx(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            activeLetter === letter
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700",
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <FaChevronRight size={10} className="text-gray-400 dark:text-gray-600" />}
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

      {/* Page header */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>}
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <FaExternalLinkAlt size={10} />
              {t("collections.officialSource")}
            </a>
          )}
        </div>
      )}

      <div className="flex gap-4">
        {/* Left sidebar — desktop */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            {categoryFilterUI}
            {alphabetUI}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1">
              {/* Search + sort + mobile toggle + extra actions */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <FaSearch
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder={t("search.placeholder")}
                    onChange={handleSearch}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortMode}
                    onChange={(e) => {
                      setSortMode(e.target.value as SortMode);
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowMobileFilters((v) => !v)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                  >
                    {showMobileFilters ? t("actions.hideFilters") : t("actions.showFilters")}
                  </button>
                  {headerActions}
                </div>
              </div>

              {/* Mobile: category + alphabet */}
              {showMobileFilters && (
                <div className="mb-4 space-y-4 lg:hidden">
                  {categoryFilterUI}
                  {alphabetUI}
                </div>
              )}

              {/* List content */}
              {items.length === 0 ? (
                (emptyNode ?? (
                  <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
                    {t("search.noResults")}
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
                  {t("search.noResults")}
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    {rowData.map((row, index) => {
                      if (row.type === "header") {
                        return (
                          <LetterHeader key={`header-${row.letter}-${index}`} letter={row.letter} />
                        );
                      }
                      return (
                        <TrackRow
                          key={`item-${row.item.id}`}
                          item={row.item}
                          extraActions={extraRowActions}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                      <button
                        onClick={() => goToPage(safePage - 1)}
                        disabled={safePage <= 1}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <FaChevronLeft size={14} />
                      </button>
                      {startPage > 1 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
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
                          onClick={() => goToPage(page)}
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
                          {endPage < totalPages - 1 && (
                            <span className="px-1 text-gray-400">…</span>
                          )}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => goToPage(safePage + 1)}
                        disabled={safePage >= totalPages}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <FaChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right side: code preview */}
            <div className="hidden w-full lg:block lg:w-72 lg:sticky lg:top-18 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <CodePreviewPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
