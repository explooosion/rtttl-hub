import { useTranslation } from "react-i18next";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FaGlobe } from "react-icons/fa";
import clsx from "clsx";

const languages = [
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-HK", label: "繁體中文（香港）" },
  { code: "zh-CN", label: "简体中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const current = languages.find((l) => l.code === i18n.language) ?? languages[0];
  const currentLabel = current.label;

  return (
    <Popover className="relative">
      <PopoverButton className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:text-white">
        <FaGlobe size={16} />
        <span className="hidden sm:inline">{currentLabel}</span>
      </PopoverButton>

      <PopoverPanel
        anchor="top start"
        className="z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800 [--anchor-gap:8px]"
      >
        {({ close }) => (
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  close();
                }}
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors",
                  i18n.language === lang.code
                    ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
