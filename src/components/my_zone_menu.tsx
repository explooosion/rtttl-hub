import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaChevronDown, FaHeart, FaPencilAlt } from "react-icons/fa";
import clsx from "clsx";

interface MyZoneMenuProps {
  isActive: boolean;
}

const MY_ZONE_ITEMS = [
  {
    slug: "my-creations",
    nameKey: "collections.myCreations.name",
    Icon: FaPencilAlt,
  },
  {
    slug: "favorites",
    nameKey: "collections.favorites.name",
    Icon: FaHeart,
  },
] as const;

export function MyZoneMenu({ isActive }: MyZoneMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  function handleMenuToggle() {
    setOpen(!open);
  }

  function handleCloseMenu() {
    close();
  }

  useEffect(
    function closeOnClickOutside() {
      function handleClickOutside(e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          close();
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    },
    [open, close],
  );

  useEffect(
    function closeOnEscape() {
      function handleEscape(e: KeyboardEvent) {
        if (e.key === "Escape") {
          close();
        }
      }
      if (open) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    },
    [open, close],
  );

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={handleMenuToggle}
        className={clsx(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive || open
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        )}
      >
        {t("collections.group.myCreations", { defaultValue: "My Zone" })}
        <FaChevronDown size={10} className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 pt-2">
          <div className="w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("collections.group.myCreations", { defaultValue: "My Zone" })}
            </h3>
            <div className="flex flex-col gap-1">
              {MY_ZONE_ITEMS.map(({ slug, nameKey, Icon }) => (
                <Link
                  key={slug}
                  to={`/my-zone/${slug}`}
                  onClick={handleCloseMenu}
                  className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1 self-center">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {t(nameKey)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
