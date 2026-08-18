import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaTrash, FaHeart, FaMusic } from "react-icons/fa";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "../stores/auth_store";
import { useCollectionStore } from "../stores/collection_store";
import { useFavoritesStore } from "../stores/favorites_store";
import { Breadcrumb } from "../components/breadcrumb";
import { ConfirmDialog } from "../components/confirm_dialog";
import { PageLoader } from "../components/page_loader";

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const userItems = useCollectionStore((s) => s.userItems);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const creationsCount = userItems.length;
  const favoritesCount = favoriteIds.length;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success(t("account.accountDeleted"));
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(t("account.deleteFailed"));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  function handleOpenDeleteConfirm() {
    setDeleteConfirmOpen(true);
  }

  function handleCloseDeleteConfirm() {
    setDeleteConfirmOpen(false);
  }

  if (isLoading || !user) {
    return <PageLoader message={t("common.loadingAccount")} />;
  }

  const currentAvatar = user.customPhotoURL || user.photoURL;

  return (
    <>
      <div className="animate-fade-in-up mx-auto max-w-3xl px-4 py-8">
        <Breadcrumb
          items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("account.title") }]}
        />
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          {t("account.title")}
        </h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={user.displayName}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 ring-2 ring-gray-200 dark:bg-indigo-900 dark:text-indigo-400 dark:ring-gray-700">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.displayName}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

                <Link
                  to="/account/profile"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <FaUser size={14} />
                  {t("account.editProfile")}
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t("account.statistics")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <FaMusic size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {creationsCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("account.creationsCount")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900">
                  <FaHeart size={18} className="text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {favoritesCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("account.favoritesCount")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <h2 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-400">
              {t("account.dangerZone")}
            </h2>
            <button
              onClick={handleOpenDeleteConfirm}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <FaTrash size={14} />
              {t("account.deleteAccount")}
            </button>
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {t("account.deleteAccountWarning")}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={t("account.deleteAccountConfirmTitle")}
        message={t("account.deleteAccountConfirmMessage")}
        confirmText={user.displayName}
        confirmPlaceholder={t("account.deleteAccountInputPlaceholder", { name: user.displayName })}
        confirmLabel={t("account.deleteAccount")}
        cancelLabel={t("actions.cancel")}
        onConfirm={handleDeleteAccount}
        onCancel={handleCloseDeleteConfirm}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
