import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { COLLECTIONS } from "@/constants/collections";
import type { CollectionDef } from "@/constants/collections";
import { FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";
import { Breadcrumb } from "@/components/breadcrumb";

function CollectionRow({
  slug,
  nameKey,
  descriptionKey,
  icon: Icon,
  source,
}: {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  source?: string;
}) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/collections/${slug}`}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-900/50 dark:text-indigo-400">
        <Icon size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 dark:text-white">{t(nameKey)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t(descriptionKey)}</p>
        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FaExternalLinkAlt size={10} />
            {t("collections.officialSource")}
          </a>
        )}
      </div>
      <FaArrowRight size={14} className="shrink-0 text-gray-400 dark:text-gray-500" />
    </Link>
  );
}

function CollectionGroup({
  title,
  description,
  collections,
}: {
  title: string;
  description?: string;
  collections: CollectionDef[];
}) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="space-y-3">
        {collections.map((col) => (
          <CollectionRow
            key={col.slug}
            slug={col.slug}
            nameKey={col.nameKey}
            descriptionKey={col.descriptionKey}
            icon={col.icon}
            source={col.source}
          />
        ))}
      </div>
    </section>
  );
}

export function CollectionsPage() {
  const { t } = useTranslation();

  const libraryCollections = COLLECTIONS.filter((c) => c.group === "library");
  const communityCollections = COLLECTIONS.filter((c) => c.group === "community");

  return (
    <div className="animate-fade-in-up mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("breadcrumb.collections") }]}
      />
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {t("collections.title")}
      </h2>
      <p className="mb-8 text-gray-600 dark:text-gray-400">{t("collections.subtitle")}</p>

      <div className="space-y-8">
        <CollectionGroup
          title={t("collections.group.community")}
          description={t("collections.group.communityDesc")}
          collections={communityCollections}
        />
        <CollectionGroup
          title={t("collections.group.libraries")}
          description={t("collections.group.librariesDesc")}
          collections={libraryCollections}
        />
      </div>
    </div>
  );
}
