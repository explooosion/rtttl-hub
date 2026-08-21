import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaStar } from "react-icons/fa";

import { useAuthStore } from "../stores/auth_store";
import { watchTransaction } from "../services/firestore_service";

type PaymentState = "processing" | "success" | "pending" | "error";

/** Deterministic confetti piece data so renders are stable. */
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 7 + 3) % 100}%`,
  delay: `${(i * 137) % 1800}ms`,
  duration: `${1200 + ((i * 317) % 1000)}ms`,
  color: ["#f43f5e", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"][i % 6],
  size: `${6 + (i % 4) * 3}px`,
  rotate: `${(i * 47) % 360}deg`,
}));

/** How long to wait for webhook confirmation before showing the pending fallback. */
const WEBHOOK_TIMEOUT_MS = 30_000;

export function PaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const result = searchParams.get("result");
  const checkoutId = searchParams.get("checkout_id") ?? "";

  const isValidRequest = result === "success" && Boolean(checkoutId) && Boolean(user);

  const [paymentState, setPaymentState] = useState<PaymentState>(
    isValidRequest ? "processing" : "error",
  );

  useEffect(
    function listenForWebhookConfirmation() {
      if (!isValidRequest) {
        return;
      }

      // Show pending fallback if the webhook doesn't arrive within 30 s.
      // Polar retries up to 10 times — premium will still be activated eventually.
      timeoutRef.current = setTimeout(() => {
        setPaymentState((prev) => (prev === "processing" ? "pending" : prev));
      }, WEBHOOK_TIMEOUT_MS);

      // Poll Firestore: the Cloud Function writes transactions/{checkoutId} after
      // validating the Polar webhook signature. No client-side premium write needed.
      const unsubscribe = watchTransaction(checkoutId, (status) => {
        if (status === "success") {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setPaymentState("success");
        }
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        unsubscribe();
      };
    },
    [isValidRequest, checkoutId],
  );

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* CSS confetti particles — only shown on success */}
      {paymentState === "success" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {CONFETTI.map((piece) => (
            <span
              key={piece.id}
              className="absolute animate-confetti-fall rounded-sm"
              style={{
                left: piece.left,
                top: "-12px",
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                transform: `rotate(${piece.rotate})`,
              }}
            />
          ))}
        </div>
      )}

      <div className="animate-fade-in-up relative z-10 mx-auto max-w-md text-center">
        {paymentState === "processing" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              {t("payment.processing")}
            </h1>
          </>
        )}

        {paymentState === "success" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40">
                <FaCheckCircle className="text-rose-500" size={52} />
                <FaStar
                  className="absolute -right-2 -top-2 animate-float text-amber-400"
                  size={20}
                />
                <FaStar
                  className="absolute -bottom-1 -left-2 animate-float-slow text-amber-300"
                  size={14}
                />
              </div>
            </div>

            <h1 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-white">
              {t("payment.title")}
            </h1>

            <p className="mb-2 text-lg font-semibold text-rose-500 dark:text-rose-400">
              {t("payment.premiumUnlocked")}
            </p>

            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">{t("payment.thankyou")}</p>

            {checkoutId && (
              <p className="mb-8 text-xs text-gray-400 dark:text-gray-600">
                {t("payment.checkoutId", { id: checkoutId })}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-rose-600 hover:shadow-rose-300 active:scale-95 dark:shadow-rose-950"
            >
              <FaStar size={16} />
              {t("payment.startCreating")}
            </button>
          </>
        )}

        {paymentState === "pending" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                <span className="text-4xl">⏳</span>
              </div>
            </div>

            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              {t("payment.pending")}
            </h1>

            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              {t("payment.pendingDesc")}
            </p>

            {checkoutId && (
              <p className="mb-4 text-xs text-gray-400 dark:text-gray-600">
                {t("payment.checkoutId", { id: checkoutId })}
              </p>
            )}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {t("payment.refresh")}
            </button>
          </>
        )}

        {paymentState === "error" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <span className="text-4xl">😢</span>
              </div>
            </div>

            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              {t("payment.error")}
            </h1>

            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              {t("payment.errorDesc")}
            </p>

            <button
              type="button"
              onClick={() => navigate("/donate")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("payment.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
