import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaChevronRight,
  FaQuestionCircle,
  FaExternalLinkAlt,
  FaLock,
} from "react-icons/fa";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("breadcrumb.account") }]}
      />
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        {t("account.title")}
      </h1>

      <div className="space-y-6">
        {/* Account settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t("account.settings")}
              </h2>
              <div className="space-y-1">
                <Link
                  to="/account/profile"
                  className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <FaUser size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("account.editProfile")}
                    </span>
                  </div>
                  <FaChevronRight size={12} className="text-gray-400" />
                </Link>
                <Link
                  to="/account/password"
                  className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <FaLock size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.hasPassword ? t("account.changePassword") : t("account.setPassword")}
                    </span>
                  </div>
                  <FaChevronRight size={12} className="text-gray-400" />
                </Link>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t("account.information")}
              </h2>
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-lg px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("account.email")}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <a
            href="https://github.com/explooosion/rtttl-hub/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FaQuestionCircle size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("account.helpCenter")}
              </span>
            </div>
            <FaExternalLinkAlt size={12} className="text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
