import { useTranslation } from "react-i18next";
import { useCollectionStore, useAvailableLetters } from "@/stores/collection_store";
import clsx from "clsx";

export function AlphabetSidebar() {
  const { t } = useTranslation();
  const activeLetter = useCollectionStore((s) => s.activeLetter);
  const setActiveLetter = useCollectionStore((s) => s.setActiveLetter);
  const letters = useAvailableLetters();

  return (
    <div className="flex flex-row flex-wrap gap-1">
      <button
        onClick={() => setActiveLetter(null)}
        className={clsx(
          "rounded px-2 py-1 text-xs font-medium transition-colors",
          activeLetter === null
            ? "bg-indigo-600 text-white"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700",
        )}
      >
        {t("letters.all")}
      </button>
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
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
}
