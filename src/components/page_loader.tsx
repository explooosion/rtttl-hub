import { useTranslation } from "react-i18next";
import { FaMusic, FaSpinner } from "react-icons/fa";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
  icon?: "music" | "spinner";
}

export function PageLoader({ message, fullScreen = true, icon = "spinner" }: PageLoaderProps) {
  const { t } = useTranslation();

  const Icon = icon === "music" ? FaMusic : FaSpinner;
  const iconClass = icon === "spinner" ? "animate-spin" : "animate-pulse";

  return (
    <div className={`flex items-center justify-center ${fullScreen ? "h-screen" : "py-12"}`}>
      <div className="text-center">
        <Icon size={48} className={`mx-auto mb-4 text-indigo-500 ${iconClass}`} />
        <p className="text-gray-500 dark:text-gray-400">{message || t("common.loading")}</p>
      </div>
    </div>
  );
}
