import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/breadcrumb";

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in-up mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("legal.privacyTitle") }]}
      />

      <article className="prose prose-gray max-w-none dark:prose-invert">
        <h1>{t("legal.privacyTitle")}</h1>
        <p className="text-sm text-gray-500">{t("legal.lastRevised", { date: "April 7, 2026" })}</p>

        <p>{t("legal.privacy.intro")}</p>

        <h2>{t("legal.privacy.scope")}</h2>
        <ol>
          <li>{t("legal.privacy.scopeA")}</li>
          <li>{t("legal.privacy.scopeB")}</li>
        </ol>

        <h2>{t("legal.privacy.typeOfInfo")}</h2>
        <ol start={3}>
          <li>{t("legal.privacy.typeOfInfoA")}</li>
          <li>
            <strong>Local Storage:</strong> {t("legal.privacy.localStorage")}
          </li>
          <li>
            <strong>Analytics:</strong> {t("legal.privacy.analytics")}
          </li>
        </ol>

        <h2>{t("legal.privacy.howWeUse")}</h2>
        <ol start={6}>
          <li>
            {t("legal.privacy.howWeUseIntro")}
            <ul>
              <li>{t("legal.privacy.howWeUseA")}</li>
              <li>{t("legal.privacy.howWeUseB")}</li>
              <li>{t("legal.privacy.howWeUseC")}</li>
              <li>{t("legal.privacy.howWeUseD")}</li>
            </ul>
          </li>
        </ol>

        <h2>{t("legal.privacy.dataStorage")}</h2>
        <ol start={7}>
          <li>{t("legal.privacy.dataStorageA")}</li>
          <li>{t("legal.privacy.dataStorageB")}</li>
        </ol>

        <h2>{t("legal.privacy.thirdParty")}</h2>
        <ol start={9}>
          <li>{t("legal.privacy.thirdPartyA")}</li>
          <li>{t("legal.privacy.thirdPartyB")}</li>
        </ol>

        <h2>{t("legal.privacy.cookies")}</h2>
        <ol start={11}>
          <li>
            {t("legal.privacy.cookiesDesc")}{" "}
            <Link to="/cookies" className="text-indigo-600 hover:underline dark:text-indigo-400">
              {t("legal.cookieTitle")}
            </Link>
          </li>
        </ol>

        <h2>{t("legal.privacy.childrenPrivacy")}</h2>
        <ol start={12}>
          <li>{t("legal.privacy.childrenPrivacyDesc")}</li>
        </ol>

        <h2>{t("legal.privacy.yourRights")}</h2>
        <ol start={13}>
          <li>
            {t("legal.privacy.yourRightsIntro")}
            <ul>
              <li>{t("legal.privacy.yourRightsA")}</li>
              <li>{t("legal.privacy.yourRightsB")}</li>
              <li>{t("legal.privacy.yourRightsC")}</li>
            </ul>
          </li>
        </ol>

        <h2>{t("legal.privacy.changes")}</h2>
        <ol start={14}>
          <li>{t("legal.privacy.changesDesc")}</li>
        </ol>

        <h2>{t("legal.privacy.contact")}</h2>
        <ol start={15}>
          <li>
            {t("legal.privacy.contactDesc")}{" "}
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
