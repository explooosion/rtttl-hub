import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { useCollectionStore, useAvailableLetters } from "../stores/collection_store";

export function AlphabetSidebar() {
  const { t } = useTranslation();
  const activeLetter = useCollectionStore((s) => s.activeLetter);
  const setActiveLetter = useCollectionStore((s) => s.setActiveLetter);
  const letters = useAvailableLetters();

  function handleAllClick() {
    setActiveLetter(null);
  }

  const letterClickHandlers = useMemo(
    function buildLetterClickHandlers() {
      const handlers: Record<string, () => void> = {};
      for (const letter of letters) {
        handlers[letter] = function handleLetterClick() {
          setActiveLetter(activeLetter === letter ? null : letter);
        };
      }
      return handlers;
    },
    [letters, activeLetter, setActiveLetter],
  );

  return (
    <div className="flex flex-row flex-wrap gap-1">
      <button
        onClick={handleAllClick}
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
          onClick={letterClickHandlers[letter]}
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
