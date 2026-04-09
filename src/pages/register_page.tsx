import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth_store";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState<"google" | "password">("google");
  const [googleEmail, setGoogleEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleGoogleSignup() {
    // Mock: simulate Google OAuth returning email
    const mockEmail = "user@gmail.com";
    setGoogleEmail(mockEmail);
    setStep("password");
  }

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    // Mock: create account with Google email + password
    login({
      displayName: googleEmail.split("@")[0] || "User",
      email: googleEmail,
      hasPassword: true,
    });
    navigate("/account");
  }

  function handleSkipPassword() {
    // Allow user to skip password setup
    login({
      displayName: googleEmail.split("@")[0] || "User",
      email: googleEmail,
      hasPassword: false,
    });
    navigate("/account");
  }

  return (
    <div className="animate-fade-in-up mx-auto flex min-h-[70vh] max-w-4xl items-center px-4 py-12">
      <div className="grid w-full gap-12 lg:grid-cols-2">
        {/* Left: branding */}
        <div className="hidden flex-col justify-center lg:flex">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t("auth.createAccountTitle")}
          </h1>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="RTTTL Hub" width={32} height={32} className="rounded" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">RTTTL Hub</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("auth.createAccountDescription")}
            </p>
          </div>
        </div>

        {/* Right: registration form */}
        <div className="w-full max-w-sm justify-self-center lg:justify-self-end">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={logoSrc} alt="RTTTL Hub" width={28} height={28} className="rounded" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">RTTTL Hub</span>
          </div>

          {step === "google" && (
            <>
              <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white lg:hidden">
                {t("auth.createAccountTitle")}
              </h2>

              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t("auth.registerWithGoogle")}
              </p>

              {/* Google signup */}
              <button
                onClick={handleGoogleSignup}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <GoogleIcon size={18} />
                {t("auth.continueWithGoogle")}
              </button>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("auth.haveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  {t("auth.signIn")}
                </Link>
              </p>
            </>
          )}

          {step === "password" && (
            <>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                {t("auth.setPasswordTitle")}
              </h2>
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                {t("auth.registeredAs")}
              </p>
              <p className="mb-6 text-sm font-medium text-gray-900 dark:text-white">
                {googleEmail}
              </p>

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("auth.newPassword")}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("auth.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  {t("auth.setPassword")}
                </button>
              </form>

              <button
                onClick={handleSkipPassword}
                className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("auth.skipForNow")}
              </button>
            </>
          )}

          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            {t("auth.termsNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
