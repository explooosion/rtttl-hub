import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { COLLECTIONS } from "@/constants/collections";
import clsx from "clsx";

function CollectionCard({
  slug,
  nameKey,
  descriptionKey,
  icon: Icon,
}: {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/collections/${slug}`}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {t(nameKey)}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t(descriptionKey)}</p>
      </div>
    </Link>
  );
}

interface MegaMenuProps {
  isActive: boolean;
}

export function MegaMenu({ isActive }: MegaMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, close]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, close]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive || open
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        )}
      >
        {t("nav.collections")}
        <FaChevronDown size={10} className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-4 w-135 rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Collections */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("nav.collections")}
              </h3>
              <Link
                to="/collections"
                onClick={close}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {t("collections.browseAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Left: community */}
              <div>
                {COLLECTIONS.filter((c) => c.group === "community").map((col) => (
                  <div key={col.slug} onClick={close}>
                    <CollectionCard
                      slug={col.slug}
                      nameKey={col.nameKey}
                      descriptionKey={col.descriptionKey}
                      icon={col.icon}
                    />
                  </div>
                ))}
              </div>
              {/* Right: library */}
              <div className="flex flex-col">
                {COLLECTIONS.filter((c) => c.group === "library").map((col) => (
                  <div key={col.slug} onClick={close}>
                    <CollectionCard
                      slug={col.slug}
                      nameKey={col.nameKey}
                      descriptionKey={col.descriptionKey}
                      icon={col.icon}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
