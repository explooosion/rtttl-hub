import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaCheck, FaLock, FaSpinner } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";

import { functions } from "../libs/firebase";
import { useAuthStore } from "../stores/auth_store";
import {
  DONATION_TIERS,
  FREE_DAILY_UPLOAD_LIMIT,
  FREE_MAX_ANALYSIS_SECONDS,
} from "../constants/donation_tiers";

/**
 * Cloud Function that creates a Polar Checkout Session server-side,
 * embedding the uid in metadata (not visible to the user).
 */
const createCheckout = httpsCallable<{ amount: number }, { url: string }>(
  functions,
  "polarCreateCheckout",
);

export function DonatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  async function handleDonate(amount: number) {
    if (!user) {
      navigate("/login?redirect=/donate");
      return;
    }

    setLoadingAmount(amount);
    try {
      const result = await createCheckout({ amount });
      window.open(result.data.url, "_self");
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setLoadingAmount(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <FaHeart size={48} className="text-rose-500" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          {t("donate.title", { defaultValue: "Support RTTTL Hub" })}
        </h1>
        <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
          {t("donate.subtitle", {
            defaultValue:
              "RTTTL Hub is free and open source. This is a one-time donation — not a subscription. Your support helps cover AI computing costs, and in return you'll receive AI recognition credits valid for 30 days.",
          })}
        </p>
      </div>

      {/* Login required notice for unauthenticated users */}
      {!user && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <FaLock className="mt-0.5 shrink-0 text-amber-500" size={16} />
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("donate.loginRequired")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login?redirect=/donate")}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            {t("donate.loginBtn")}
          </button>
        </div>
      )}

      {/* Tiers: Free + 3 donation tiers */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Free tier */}
        <div className="relative flex flex-col rounded-2xl border border-gray-200 p-6 dark:border-gray-700">
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {t("donate.freeTitle", { defaultValue: "Free" })}
            </span>
          </div>

          <div className="mb-6 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <FaCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.uploads", {
                  defaultValue: "{{count}} AI recognition uploads per day",
                  count: FREE_DAILY_UPLOAD_LIMIT,
                })}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FaCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.seconds", {
                  defaultValue: "Up to {{count}} seconds per AI recognition",
                  count: FREE_MAX_ANALYSIS_SECONDS,
                })}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FaCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t("donate.freeNote", {
                  defaultValue: "No donation required — available to everyone",
                })}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
            {t("donate.freeCta", { defaultValue: "Always Free" })}
          </div>
        </div>

        {/* Donation tiers */}
        {DONATION_TIERS.map((tier) => (
          <div
            key={tier.amount}
            className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
              tier.popular
                ? "border-rose-500 shadow-lg shadow-rose-100 dark:border-rose-400 dark:shadow-rose-950"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
                {t("donate.popular", { defaultValue: "Most Popular" })}
              </span>
            )}

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                ${tier.amount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400"> USD</span>
            </div>

            <div className="mb-6 flex-1 space-y-3">
              <div className="flex items-start gap-2">
                <FaCheck size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("donate.uploads", {
                    defaultValue: "{{count}} AI recognition uploads per day",
                    count: tier.dailyUploads,
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FaCheck size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("donate.seconds", {
                    defaultValue: "Up to {{count}} seconds per AI recognition",
                    count: tier.maxAnalysisSeconds,
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FaCheck size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("donate.validity", {
                    defaultValue: "30-day benefit — no renewal, no recurring charge",
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FaCheck size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("donate.support", {
                    defaultValue: "Support open source development",
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleDonate(tier.amount)}
              disabled={loadingAmount !== null}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                tier.popular
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {loadingAmount === tier.amount ? (
                <FaSpinner size={12} className="animate-spin" />
              ) : (
                <FaHeart size={12} />
              )}
              {t("donate.cta", { defaultValue: "Donate ${{amount}}", amount: tier.amount })}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
