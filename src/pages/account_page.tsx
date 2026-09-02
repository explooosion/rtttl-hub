import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaTrash, FaHeart, FaMusic, FaCrown, FaCheck } from "react-icons/fa";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "../stores/auth_store";
import { useCollectionStore } from "../stores/collection_store";
import { useFavoritesStore } from "../stores/favorites_store";
import { Breadcrumb } from "../components/breadcrumb";
import { ConfirmDialog } from "../components/confirm_dialog";
import { PageLoader } from "../components/page_loader";
import { getUser, getUserTransactions } from "../services/firestore_service";
import type { FirestoreTransaction } from "../types/firestore_schema";
import { DONATION_TIERS, type DonationTierAmount } from "../constants/donation_tiers";

const fallbackAvatarSrc = "/icons/favicon-32x32.png";

function handleAvatarError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackAvatarSrc;
}

interface TierStatus {
  active: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
}

type PremiumStatus = Record<DonationTierAmount, TierStatus>;

const INACTIVE_TIER: TierStatus = { active: false, daysRemaining: 0, expiresAt: null };

const INACTIVE_PREMIUM: PremiumStatus = { 3: INACTIVE_TIER, 5: INACTIVE_TIER, 10: INACTIVE_TIER };

function formatTierDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const scheduleAccountDeletion = useAuthStore((s) => s.scheduleAccountDeletion);
  const cancelAccountDeletion = useAuthStore((s) => s.cancelAccountDeletion);
  const userItems = useCollectionStore((s) => s.userItems);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [transactions, setTransactions] = useState<FirestoreTransaction[]>([]);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>(INACTIVE_PREMIUM);
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  const creationsCount = userItems.length;
  const favoritesCount = favoriteIds.length;
  const premiumLoading = !!user?.uid && !premiumLoaded;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    let cancelled = false;
    const nowMs = Date.now();
    const makeTierStatus = (until: Date | null): TierStatus => {
      const active = until !== null && until.getTime() > nowMs;
      return {
        active,
        daysRemaining: active ? Math.ceil((until!.getTime() - nowMs) / 86_400_000) : 0,
        expiresAt: active ? until : null,
      };
    };
    Promise.all([getUser(user.uid), getUserTransactions(user.uid)])
      .then(([fsUser, txList]) => {
        if (cancelled) {
          return;
        }
        setTransactions(txList);
        setPremiumStatus({
          3: makeTierStatus(fsUser?.premium_tier_3_until?.toDate() ?? null),
          5: makeTierStatus(fsUser?.premium_tier_5_until?.toDate() ?? null),
          10: makeTierStatus(fsUser?.premium_tier_10_until?.toDate() ?? null),
        });
        setPremiumLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load premium data:", err);
        if (!cancelled) {
          setPremiumLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await scheduleAccountDeletion();
      toast.success(t("account.deletionScheduled"));
    } catch (error) {
      console.error("Schedule deletion error:", error);
      toast.error(t("account.deletionScheduleFailed"));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    try {
      await cancelAccountDeletion();
      toast.success(t("account.deletionCancelled"));
    } catch (error) {
      console.error("Cancel deletion error:", error);
      toast.error(t("account.deletionCancelFailed"));
    } finally {
      setIsCancelling(false);
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
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[9999px] border-2 border-gray-200 dark:border-gray-700">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={user.displayName}
                    onError={handleAvatarError}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
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

          {/* Premium Plans */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
              {t("account.premiumStatus")}
            </h2>
            {premiumLoading ? (
              <p className="text-sm text-gray-400">{t("common.loading")}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {DONATION_TIERS.map((tier) => {
                  const status = premiumStatus[tier.amount];
                  const tierBorderClass = status.active
                    ? tier.amount === 10
                      ? "border-yellow-400 shadow-md shadow-yellow-100 dark:border-yellow-500 dark:shadow-yellow-950/40"
                      : tier.amount === 5
                        ? "border-blue-400 shadow-md shadow-blue-100 dark:border-blue-500 dark:shadow-blue-950/40"
                        : "border-amber-400 shadow-md shadow-amber-100 dark:border-amber-500 dark:shadow-amber-950/40"
                    : "border-gray-200 opacity-60 dark:border-gray-700";

                  return (
                    <div
                      key={tier.amount}
                      className={`relative flex flex-col rounded-xl border p-5 transition-shadow ${tierBorderClass}`}
                    >
                      {tier.popular && status.active && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                          {t("donate.popular")}
                        </span>
                      )}

                      {/* Price + active badge */}
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div>
                          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            ${tier.amount}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400"> USD</span>
                        </div>
                        {status.active && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <FaCrown size={9} />
                            {t("account.tierActive")}
                          </span>
                        )}
                      </div>

                      {/* Days remaining (active only) */}
                      {status.active && status.expiresAt && (
                        <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                            {t("account.daysRemaining", { count: status.daysRemaining })}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {t("account.expiresOn", { date: formatTierDate(status.expiresAt) })}
                          </p>
                        </div>
                      )}

                      {/* Feature list */}
                      <div className="mb-5 flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <FaCheck size={11} className="mt-0.5 shrink-0 text-rose-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t("donate.uploads", { count: tier.dailyUploads })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaCheck size={11} className="mt-0.5 shrink-0 text-rose-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t("donate.seconds", { count: tier.maxAnalysisSeconds })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaCheck size={11} className="mt-0.5 shrink-0 text-rose-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t("donate.validity")}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        to="/donate"
                        className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                          status.active
                            ? "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                      >
                        <FaHeart size={10} />
                        {status.active ? t("account.tierExtend") : t("account.upgradeCta")}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Donation History */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t("account.donationHistory")}
            </h2>
            {premiumLoading ? (
              <p className="text-sm text-gray-400">{t("common.loading")}</p>
            ) : transactions.length === 0 ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("account.noDonationsYet")}
                </p>
                <Link
                  to="/donate"
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {t("account.upgradeCta")} →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-2 pr-6">{t("account.colDate")}</th>
                      <th className="pb-2">{t("account.colAmount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {transactions.map((tx) => (
                      <tr key={tx.checkout_id}>
                        <td className="py-2.5 pr-6 text-gray-600 dark:text-gray-300">
                          {tx.created_at.toDate().toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                          ${tx.amount ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <h2 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-400">
              {t("account.dangerZone")}
            </h2>

            {user.pendingDeletion ? (
              <>
                <div className="mb-4 rounded-lg border border-red-300 bg-white p-4 dark:border-red-800 dark:bg-gray-900">
                  <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
                    {t("account.deletionScheduledNotice")}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {t("account.deletionDate", {
                      date: user.deletionExecuteAt?.toDate
                        ? new Date(user.deletionExecuteAt.toDate()).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A",
                    })}
                  </p>
                </div>
                <button
                  onClick={handleCancelDeletion}
                  disabled={isCancelling}
                  className="flex items-center gap-2 rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-800 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-green-950/30"
                >
                  <FaCheck size={14} />
                  {isCancelling ? t("common.loading") : t("account.cancelDeletion")}
                </button>
                <p className="mt-3 text-sm leading-relaxed text-red-600 dark:text-red-400">
                  {t("account.cancelDeletionInfo")}
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenDeleteConfirm}
                  className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <FaTrash size={14} />
                  {t("account.deleteAccount")}
                </button>
                <p className="mt-3 text-sm leading-relaxed text-red-600 dark:text-red-400">
                  {t("account.deleteAccountWarning")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={t("account.deleteAccountConfirmTitle")}
        message={t("account.scheduleDeleteConfirmMessage")}
        confirmText={user.displayName}
        confirmPlaceholder={t("account.deleteAccountInputPlaceholder", { name: user.displayName })}
        confirmLabel={t("account.scheduleDelete")}
        cancelLabel={t("actions.cancel")}
        onConfirm={handleDeleteAccount}
        onCancel={handleCloseDeleteConfirm}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
