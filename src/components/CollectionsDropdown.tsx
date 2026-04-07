import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { COLLECTIONS } from "@/constants/collections";
import { useCollectionItemCount } from "@/stores/collection-store";

function CollectionMenuItem({
  slug,
  nameKey,
  icon: Icon,
}: {
  slug: string;
  nameKey: string;
  icon: React.ComponentType<{ size: number }>;
}) {
  const { t } = useTranslation();
  const count = useCollectionItemCount(slug as "picaxe" | "community");

  return (
    <MenuItem>
      <Link
        to={`/collections/${slug}`}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Icon size={16} />
        <span className="flex-1">{t(nameKey)}</span>
        {count > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{count.toLocaleString()}</span>
        )}
      </Link>
    </MenuItem>
  );
}

export function CollectionsDropdown({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        {t("nav.collections")}
        <FaChevronDown size={10} />
      </MenuButton>
      <MenuItems className="absolute left-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <MenuItem>
          <Link
            to="/collections"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
          >
            {t("collections.browseAll")}
          </Link>
        </MenuItem>
        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
        {COLLECTIONS.map((col) => (
          <CollectionMenuItem
            key={col.slug}
            slug={col.slug}
            nameKey={col.nameKey}
            icon={col.icon}
          />
        ))}
      </MenuItems>
    </Menu>
  );
}
