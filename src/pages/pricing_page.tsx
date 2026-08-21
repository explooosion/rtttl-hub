import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaExclamationTriangle, FaGithub } from "react-icons/fa";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  nameKey: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyMonthly: string;
  descKey: string;
  featuresKeys: string[];
  highlighted?: boolean;
  ctaKey: string;
}

const PLANS: Plan[] = [
  {
    nameKey: "pricing.free.name",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlyMonthly: "$0",
    descKey: "pricing.free.desc",
    featuresKeys: [
      "pricing.free.f1",
      "pricing.free.f2",
      "pricing.free.f3",
      "pricing.free.f4",
      "pricing.free.f5",
    ],
    ctaKey: "pricing.free.cta",
  },
  {
    nameKey: "pricing.pro.name",
    monthlyPrice: "$9.99",
    yearlyPrice: "$95.88",
    yearlyMonthly: "$7.99",
    descKey: "pricing.pro.desc",
    featuresKeys: [
      "pricing.pro.f1",
      "pricing.pro.f2",
      "pricing.pro.f3",
      "pricing.pro.f4",
      "pricing.pro.f5",
      "pricing.pro.f6",
    ],
    highlighted: true,
    ctaKey: "pricing.pro.cta",
  },
  {
    nameKey: "pricing.team.name",
    monthlyPrice: "$29.99",
    yearlyPrice: "$287.88",
    yearlyMonthly: "$23.99",
    descKey: "pricing.team.desc",
    featuresKeys: [
      "pricing.team.f1",
      "pricing.team.f2",
      "pricing.team.f3",
      "pricing.team.f4",
      "pricing.team.f5",
      "pricing.team.f6",
      "pricing.team.f7",
    ],
    ctaKey: "pricing.team.cta",
  },
];

export function PricingPage() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* WIP Banner */}
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <FaExclamationTriangle className="shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {t("pricing.wip", {
              defaultValue:
                "This page is under construction (WIP). Pricing and plans are subject to change.",
            })}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          {t("pricing.title", { defaultValue: "Pricing" })}
        </h1>
        <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400">
          {t("pricing.subtitle", {
            defaultValue:
              "Choose a plan that fits your needs. Our AI audio recognition service provides cloud-based computing power for melody extraction.",
          })}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            billing === "monthly"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          {t("pricing.monthly", { defaultValue: "Monthly" })}
        </button>
        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            billing === "yearly"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          {t("pricing.yearly", { defaultValue: "Yearly" })}
          <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
            {t("pricing.savePercent", { defaultValue: "Save 20%" })}
          </span>
        </button>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.nameKey}
            className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
              plan.highlighted
                ? "border-indigo-500 shadow-lg shadow-indigo-100 dark:border-indigo-400 dark:shadow-indigo-950"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                {t("pricing.popular", { defaultValue: "Most Popular" })}
              </span>
            )}

            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              {t(plan.nameKey)}
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t(plan.descKey)}</p>

            <div className="mb-6">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {billing === "monthly" ? plan.monthlyPrice : plan.yearlyMonthly}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("pricing.perMonth", { defaultValue: " /mo" })}
              </span>
              {billing === "yearly" && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {t("pricing.billedYearly", {
                    defaultValue: "Billed {{price}} / year",
                    price: plan.yearlyPrice,
                  })}
                </p>
              )}
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
              {plan.featuresKeys.map((fk) => (
                <li
                  key={fk}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  <FaCheck size={12} className="mt-0.5 shrink-0 text-green-500" />
                  <span>{t(fk)}</span>
                </li>
              ))}
            </ul>

            {/* TODO: Payment integration pending */}
            <button
              type="button"
              disabled
              className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                plan.highlighted
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              }`}
            >
              {t(plan.ctaKey)}
            </button>
          </div>
        ))}
      </div>

      {/* Open source notice */}
      <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/50">
        <div className="mb-3 flex justify-center">
          <FaGithub size={28} className="text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("pricing.ossTitle", { defaultValue: "Open Source Models" })}
        </h3>
        <p className="mx-auto max-w-xl text-sm text-gray-500 dark:text-gray-400">
          {t("pricing.ossDesc", {
            defaultValue:
              "Our audio recognition models are fully open source. Paid plans provide cloud computing power so you don't need to run models locally. You can also run them on your own hardware for free.",
          })}
        </p>
        <a
          href="https://github.com/explooosion/rtttl-hub"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaGithub size={14} />
          {t("pricing.viewSource", { defaultValue: "View on GitHub" })}
        </a>
      </div>
    </div>
  );
}
