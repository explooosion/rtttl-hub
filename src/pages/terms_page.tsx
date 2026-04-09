import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/breadcrumb";

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in-up mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("legal.termsTitle") }]}
      />

      <article className="prose prose-gray max-w-none dark:prose-invert">
        <h1>{t("legal.termsTitle")}</h1>
        <p className="text-sm text-gray-500">{t("legal.lastRevised", { date: "April 7, 2026" })}</p>

        <h2>{t("legal.terms.aboutUs")}</h2>
        <ol>
          <li>{t("legal.terms.welcome")}</li>
          <li>{t("legal.terms.aboutUsDesc")}</li>
          <li>
            {t("legal.terms.userTermsIntro")}
            <ol type="a">
              <li>{t("legal.terms.userTermsA")}</li>
              <li>
                <Link
                  to="/privacy"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {t("legal.terms.userTermsB")}
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {t("legal.terms.userTermsC")}
                </Link>
              </li>
              <li>{t("legal.terms.userTermsD")}</li>
            </ol>
          </li>
          <li>{t("legal.terms.yourPrivacy")}</li>
        </ol>

        <h2>{t("legal.terms.yourAccount")}</h2>
        <ol start={5}>
          <li>{t("legal.terms.noAccount")}</li>
          <li>{t("legal.terms.futureAccount")}</li>
        </ol>

        <h2>{t("legal.terms.accessAndRestrictions")}</h2>
        <ol start={7}>
          <li>{t("legal.terms.access")}</li>
          <li>
            {t("legal.terms.restrictionsIntro")}
            <ol type="a">
              <li>{t("legal.terms.restrictionA")}</li>
              <li>{t("legal.terms.restrictionB")}</li>
              <li>{t("legal.terms.restrictionC")}</li>
              <li>{t("legal.terms.restrictionD")}</li>
              <li>{t("legal.terms.restrictionE")}</li>
            </ol>
          </li>
        </ol>

        <h2>{t("legal.terms.contentAndIP")}</h2>
        <ol start={9}>
          <li>{t("legal.terms.rtttlData")}</li>
          <li>{t("legal.terms.userCreated")}</li>
          <li>{t("legal.terms.platform")}</li>
        </ol>

        <h2>{t("legal.terms.disclaimer")}</h2>
        <ol start={12}>
          <li>
            {t("legal.terms.disclaimerDesc")}
            <ol type="a">
              <li>{t("legal.terms.disclaimerA")}</li>
              <li>{t("legal.terms.disclaimerB")}</li>
              <li>{t("legal.terms.disclaimerC")}</li>
              <li>{t("legal.terms.disclaimerD")}</li>
            </ol>
          </li>
        </ol>

        <h2>{t("legal.terms.limitation")}</h2>
        <ol start={13}>
          <li>{t("legal.terms.limitationDesc")}</li>
        </ol>

        <h2>{t("legal.terms.changesToPlatform")}</h2>
        <ol start={14}>
          <li>{t("legal.terms.changesToPlatformDesc")}</li>
        </ol>

        <h2>{t("legal.terms.changesToTerms")}</h2>
        <ol start={15}>
          <li>{t("legal.terms.changesToTermsDesc")}</li>
        </ol>

        <h2>{t("legal.terms.governingLaw")}</h2>
        <ol start={16}>
          <li>{t("legal.terms.governingLawDesc")}</li>
        </ol>

        <h2>{t("legal.terms.contact")}</h2>
        <ol start={17}>
          <li>
            {t("legal.terms.contactDesc")}{" "}
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
