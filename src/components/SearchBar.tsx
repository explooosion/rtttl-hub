import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { useCollectionStore } from "@/stores/collection-store";
import type { SortMode } from "@/stores/collection-store";
import { useRef, useCallback } from "react";

export function SearchBar() {
  const { t } = useTranslation();
  const setSearchQuery = useCollectionStore((s) => s.setSearchQuery);
  const sortMode = useCollectionStore((s) => s.sortMode);
  const setSortMode = useCollectionStore((s) => s.setSortMode);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setSearchQuery(e.target.value);
      }, 200);
    },
    [setSearchQuery],
  );

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "a-z", label: t("sort.aToZ") },
    { value: "z-a", label: t("sort.zToA") },
    { value: "artist-a-z", label: t("sort.artistAZ") },
    { value: "artist-z-a", label: t("sort.artistZA") },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <FaSearch
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={t("search.placeholder")}
          onChange={handleSearch}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400"
        />
      </div>
      <select
        value={sortMode}
        onChange={(e) => setSortMode(e.target.value as SortMode)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
