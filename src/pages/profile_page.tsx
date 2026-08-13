import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import toast from "react-hot-toast";

import { useAuthStore } from "../stores/auth_store";
import { Breadcrumb } from "../components/breadcrumb";
import { AvatarUpload } from "../components/avatar_upload";
import { uploadAvatar, deleteAvatar } from "../services/firestore_service";
import { PageLoader } from "../components/page_loader";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email] = useState(user?.email ?? "");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !user) {
    return <PageLoader message={t("common.loadingProfile")} />;
  }

  const currentAvatar = user.customPhotoURL || user.photoURL;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
      toast.success(t("account.profileUpdated"));
      navigate("/account");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("account.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(blob: Blob) {
    if (!user) {
      return;
    }

    try {
      // Delete old custom avatar if exists
      if (user.customPhotoURL) {
        await deleteAvatar(user.uid, user.customPhotoURL);
      }

      // Upload new avatar
      const photoURL = await uploadAvatar(user.uid, blob);
      await updateProfile({ customPhotoURL: photoURL });

      setShowAvatarUpload(false);
    } catch (error) {
      console.error("Avatar upload error:", error);
      throw error;
    }
  }

  return (
    <>
      <div className="animate-fade-in-up mx-auto max-w-xl px-4 py-8">
        <Breadcrumb
          items={[
            { label: t("breadcrumb.home"), to: "/" },
            { label: t("account.title"), to: "/account" },
            { label: t("breadcrumb.profile") },
          ]}
        />

        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("account.profileDetails")}
        </h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-6">
            <div className="relative">
              <img
                src={currentAvatar || "/icons/favicon-32x32.png"}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover"
              />
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700"
              >
                <FaCamera size={14} />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("account.displayName")}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("account.email")}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("account.emailNotEditable")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? t("account.saving") : t("account.saveChanges")}
              </button>
              <Link
                to="/account"
                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("actions.cancel")}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {showAvatarUpload && (
        <AvatarUpload
          currentAvatar={currentAvatar}
          onUpload={handleAvatarUpload}
          onCancel={() => setShowAvatarUpload(false)}
        />
      )}
    </>
  );
}
