import { useTranslation } from "react-i18next";
import { useCollectionStore } from "@/stores/collection-store";
import { RTTTL_CATEGORIES } from "@/constants/categories";
import clsx from "clsx";

export function CategoryFilter() {
  const { t } = useTranslation();
  const activeCategories = useCollectionStore((s) => s.activeCategories);
  const toggleCategory = useCollectionStore((s) => s.toggleCategory);
  const clearCategories = useCollectionStore((s) => s.clearCategories);

  return (
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
            onChange={clearCategories}
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
              onChange={() => toggleCategory(cat)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span>{t(`categories.${cat}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
