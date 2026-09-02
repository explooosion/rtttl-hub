import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronDown, FaSignOutAlt, FaCog, FaSignInAlt } from "react-icons/fa";

import { useAuthStore } from "../stores/auth_store";

const fallbackAvatarSrc = "/icons/favicon-32x32.png";

function handleAvatarError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackAvatarSrc;
}

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        aria-label={t("auth.signIn")}
      >
        <FaSignInAlt size={16} />
        <span className="hidden sm:inline">{t("auth.signIn")}</span>
      </Link>
    );
  }

  const currentAvatar = user.customPhotoURL || user.photoURL;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
        {currentAvatar ? (
          <div className="h-7 w-7 overflow-hidden rounded-[9999px] border-2 border-gray-200 dark:border-gray-700">
            <img
              src={currentAvatar}
              alt={user.displayName}
              onError={handleAvatarError}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-7 w-7 overflow-hidden rounded-[9999px] border-2 border-gray-200 bg-indigo-100 dark:border-gray-700 dark:bg-indigo-900">
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
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
            onClick={handleSignOut}
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
