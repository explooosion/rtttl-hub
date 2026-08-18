import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";

import type { SortOption } from "./shared";

interface SearchToolbarProps {
  sortMode: string;
  trackCount: number | null;
  sortOptions: SortOption[];
  showMobileFilters: boolean;
  headerActions?: React.ReactNode;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSortModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTrackCountChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleMobileFilters: () => void;
}

export function SearchToolbar({
  sortMode,
  trackCount,
  sortOptions,
  showMobileFilters,
  headerActions,
  onSearch,
  onSortModeChange,
  onTrackCountChange,
  onToggleMobileFilters,
}: SearchToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <FaSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t("search.placeholder")}
          onChange={onSearch}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
        />
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <select
          value={sortMode}
          onChange={onSortModeChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-auto"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={trackCount === null ? "all" : trackCount}
          onChange={onTrackCountChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-auto"
        >
          <option value="all">{t("filter.tracksAll")}</option>
          <option value="1">{t("filter.tracks1")}</option>
          <option value="2">{t("filter.tracks2")}</option>
          <option value="3">{t("filter.tracks3")}</option>
          <option value="4">{t("filter.tracks4")}</option>
        </select>

        <button
          type="button"
          onClick={onToggleMobileFilters}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 sm:w-auto lg:hidden"
        >
          {showMobileFilters ? t("actions.hideFilters") : t("actions.showFilters")}
        </button>

        {headerActions}
      </div>
    </div>
  );
}
