import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/breadcrumb";

export function CookiePolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in-up mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("legal.cookieTitle") }]}
      />

      <article className="prose prose-gray max-w-none dark:prose-invert">
        <h1>{t("legal.cookieTitle")}</h1>
        <p className="text-sm text-gray-500">{t("legal.lastRevised", { date: "April 7, 2026" })}</p>

        <ol>
          <li>{t("legal.cookie.intro")}</li>
          <li>{t("legal.cookie.scope")}</li>
        </ol>

        <h2>{t("legal.cookie.whatAreCookies")}</h2>
        <ol start={3}>
          <li>{t("legal.cookie.whatAreCookiesA")}</li>
          <li>{t("legal.cookie.whatAreCookiesB")}</li>
          <li>{t("legal.cookie.whatAreCookiesC")}</li>
        </ol>

        <h2>{t("legal.cookie.typesTitle")}</h2>
        <p>{t("legal.cookie.typesIntro")}</p>
        <ol start={6}>
          <li>
            <strong>{t("cookie.necessary")}:</strong> {t("legal.cookie.necessary")}
          </li>
          <li>
            <strong>{t("cookie.preferences")}:</strong> {t("legal.cookie.preferences")}
            <ul>
              <li>{t("legal.cookie.prefA")}</li>
              <li>{t("legal.cookie.prefB")}</li>
              <li>{t("legal.cookie.prefC")}</li>
              <li>{t("legal.cookie.prefD")}</li>
            </ul>
          </li>
          <li>
            <strong>{t("cookie.statistics")}:</strong> {t("legal.cookie.statistics")}
          </li>
        </ol>

        <h2>{t("legal.cookie.infoCollected")}</h2>
        <ol start={9}>
          <li>
            {t("legal.cookie.infoCollectedIntro")}
            <ul>
              <li>{t("legal.cookie.infoA")}</li>
              <li>{t("legal.cookie.infoB")}</li>
              <li>{t("legal.cookie.infoC")}</li>
              <li>{t("legal.cookie.infoD")}</li>
              <li>{t("legal.cookie.infoE")}</li>
              <li>{t("legal.cookie.infoF")}</li>
            </ul>
          </li>
        </ol>

        <h2>{t("legal.cookie.managePrefs")}</h2>
        <ol start={10}>
          <li>{t("legal.cookie.managePrefsA")}</li>
          <li>{t("legal.cookie.managePrefsB")}</li>
          <li>{t("legal.cookie.managePrefsC")}</li>
        </ol>

        <h2>{t("legal.cookie.changes")}</h2>
        <ol start={13}>
          <li>{t("legal.cookie.changesDesc")}</li>
        </ol>

        <h2>{t("legal.cookie.furtherInfo")}</h2>
        <ol start={14}>
          <li>
            {t("legal.cookie.furtherInfoDesc")}{" "}
            <Link to="/privacy" className="text-indigo-600 hover:underline dark:text-indigo-400">
              {t("legal.privacyTitle")}
            </Link>
          </li>
        </ol>

        <h2>{t("legal.cookie.contact")}</h2>
        <ol start={15}>
          <li>
            {t("legal.cookie.contactDesc")}{" "}
            <a
              href="https://github.com/explooosion/rtttl-hub/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              GitHub
            </a>
          </li>
        </ol>
      </article>
    </div>
  );
}
