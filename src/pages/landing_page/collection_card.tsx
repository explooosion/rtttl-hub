import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaMusic, FaExternalLinkAlt } from "react-icons/fa";

import { COLLECTION_ILLUSTRATIONS } from "./landing_constants";

interface CollectionCardProps {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  source?: string;
}

export function CollectionCard({ slug, nameKey, descriptionKey, source }: CollectionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const illustration = COLLECTION_ILLUSTRATIONS[slug] ?? {
    icon: FaMusic,
    gradient: "from-gray-500 to-gray-600",
  };
  const Icon = illustration.icon;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/collections/${slug}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/collections/${slug}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900"
    >
      {/* Illustration banner */}
      <div
        className={`flex h-24 shrink-0 items-center justify-center bg-linear-to-br ${illustration.gradient}`}
      >
        <Icon size={32} className="text-white/80 transition-transform group-hover:scale-110" />
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">{t(nameKey)}</h3>
        <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {t(descriptionKey)}
        </p>
        <div className="mt-auto">
          {source ? (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <FaExternalLinkAlt size={10} />
              {t("collections.officialSource")}
            </a>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </div>
    </div>
  );
}
