import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme_toggle";
import { LanguageSwitcher } from "@/components/language_switcher";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;

export function DawHeader() {
  const { t } = useTranslation();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-300 bg-gray-200 px-4 dark:border-gray-800 dark:bg-gray-900">
      <Link to="/" className="flex items-center gap-2">
        <img src={logoSrc} alt="RTTTL Hub" className="h-6 w-6" />
        <span className="font-brand text-base font-bold tracking-wider text-gray-900 dark:text-white">
          RTTTL Hub
        </span>
      </Link>
      <span className="mx-1 text-gray-300 dark:text-gray-700">|</span>
      <span className="font-brand text-sm font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
        {t("create.title")}
      </span>
      <div className="flex-1" />
      <ThemeToggle />
      <LanguageSwitcher />
    </header>
  );
}
