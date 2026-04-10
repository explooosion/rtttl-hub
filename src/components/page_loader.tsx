import { useTranslation } from "react-i18next";
import { FaMusic } from "react-icons/fa";

export function PageLoader() {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <FaMusic size={48} className="mx-auto mb-4 animate-pulse text-indigo-500" />
        <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
      </div>
    </div>
  );
}
