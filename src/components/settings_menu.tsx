import { useTranslation } from "react-i18next";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { FaCog, FaTrashAlt } from "react-icons/fa";

import { useListenedStore } from "../stores/listened_store";

interface SettingsMenuProps {
  mobile?: boolean;
}

export function SettingsMenu({ mobile = false }: SettingsMenuProps) {
  const { t } = useTranslation();
  const clearListened = useListenedStore((s) => s.clearListened);
  const listenedCount = useListenedStore((s) => s.listenedIds.length);

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={t("settings.title", { defaultValue: "Settings" })}
        className={
          mobile
            ? "flex min-h-11 w-full items-center justify-start rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            : "flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        }
      >
        <FaCog size={mobile ? 20 : 18} />
      </MenuButton>
      <MenuItems
        className={
          mobile
            ? "absolute bottom-full left-0 right-0 z-50 mb-2 w-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            : "absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        }
      >
        <MenuItem>
          <button
            onClick={clearListened}
            disabled={listenedCount === 0}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FaTrashAlt size={16} />
            <span className="flex-1 text-left">{t("settings.clearListened")}</span>
            {listenedCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{listenedCount}</span>
            )}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
