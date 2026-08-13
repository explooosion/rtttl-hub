import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaChevronDown, FaSignOutAlt, FaCog } from "react-icons/fa";

import { useAuthStore } from "../stores/auth_store";

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <FaUser size={18} />
      </Link>
    );
  }

  const currentAvatar = user.customPhotoURL || user.photoURL;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={user.displayName}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline">{user.displayName}</span>
        <FaChevronDown size={10} />
      </MenuButton>
      <MenuItems className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <MenuItem>
          <Link
            to="/account"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FaCog size={14} />
            {t("account.title")}
          </Link>
        </MenuItem>
        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
        <MenuItem>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FaSignOutAlt size={14} />
            {t("auth.signOut")}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
