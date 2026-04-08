import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Breadcrumb } from "@/components/Breadcrumb";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email] = useState(user?.email ?? "");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ displayName });
    navigate("/account");
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.home"), to: "/" },
          { label: t("breadcrumb.account"), to: "/account" },
          { label: t("breadcrumb.profile") },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t("account.profileDetails")}
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
          {t("account.profileNotice")}
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
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {t("account.saveChanges")}
            </button>
            <Link
              to="/account"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
