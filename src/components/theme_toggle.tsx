import { useMemo } from "react";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { useThemeStore } from "../stores/theme_store";
import type { ThemeMode } from "../stores/theme_store";

const modes: { value: ThemeMode; icon: IconType }[] = [
  { value: "light", icon: FaSun },
  { value: "dark", icon: FaMoon },
  { value: "system", icon: FaDesktop },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const currentMode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const modeClickHandlers = useMemo(
    function buildModeClickHandlers() {
      const handlers: Record<ThemeMode, () => void> = {
        light: () => setMode("light"),
        dark: () => setMode("dark"),
        system: () => setMode("system"),
      };
      return handlers;
    },
    [setMode],
  );

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-200 p-1 dark:bg-gray-800">
      {modes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={modeClickHandlers[value]}
          title={t(`theme.${value}`)}
          className={clsx(
            "rounded-md p-1.5 transition-colors",
            currentMode === value
              ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
