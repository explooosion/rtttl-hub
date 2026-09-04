import { useTranslation } from "react-i18next";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { FaCog } from "react-icons/fa";

interface SettingsMenuProps {
  mobile?: boolean;
}

export function SettingsMenu({ mobile = false }: SettingsMenuProps) {
  const { t } = useTranslation();

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
      />
    </Menu>
  );
}
