import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { RTTTL_CATEGORIES } from "../../constants/categories";
import type { RtttlCategory } from "../../utils/rtttl_parser";
import type { CategoryToggleHandlers } from "./shared";

interface FilterPanelsProps {
  activeCategories: RtttlCategory[];
  activeLetter: string | null;
  availableLetters: string[];
  categoryToggleHandlers: CategoryToggleHandlers;
  onClearCategories: VoidFunction;
  onAllLetterClick: VoidFunction;
  letterToggleHandlers: Record<string, () => void>;
}

export function FilterPanels({
  activeCategories,
  activeLetter,
  availableLetters,
  categoryToggleHandlers,
  onClearCategories,
  onAllLetterClick,
  letterToggleHandlers,
}: FilterPanelsProps) {
  const { t } = useTranslation();

  return (
    <>
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
              onChange={onClearCategories}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span>{t("categories.all")}</span>
          </label>

          {RTTTL_CATEGORIES.map((category) => (
            <label
              key={category}
              className={clsx(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                activeCategories.includes(category) &&
                  "font-medium text-indigo-600 dark:text-indigo-400",
              )}
            >
              <input
                type="checkbox"
                checked={activeCategories.includes(category)}
                onChange={categoryToggleHandlers[category]}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <span>{t(`categories.${category}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-row flex-wrap gap-1">
        <button
          type="button"
          onClick={onAllLetterClick}
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
            type="button"
            onClick={letterToggleHandlers[letter]}
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
    </>
  );
}
