import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaGithub, FaInstagram, FaYoutube } from "react-icons/fa";

import { Breadcrumb } from "../components/breadcrumb";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in-up mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb items={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("about.title") }]} />

      <article className="prose prose-gray max-w-none dark:prose-invert">
        <h1>{t("about.title")}</h1>

        <h2>{t("about.originTitle")}</h2>
        <p>{t("about.originP1")}</p>
        <p>{t("about.originP2")}</p>

        <h2>{t("about.purposeTitle")}</h2>
        <p>{t("about.purposeP1")}</p>
        <p>{t("about.purposeP2")}</p>

        <h2>{t("about.techTitle")}</h2>
        <p>{t("about.techP1")}</p>
        <p>{t("about.techP2")}</p>

        <h2>{t("about.communityTitle")}</h2>
        <p>
          {t("about.communityP1")}{" "}
          <a
            href="https://github.com/explooosion/rtttl-hub/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <FaGithub size={16} />
            {t("about.githubIssues")}
          </a>
          {t("about.communityP2")}
        </p>
        <p>
          {t("about.communityP3")}{" "}
          <Link to="/contribute" className="text-indigo-600 hover:underline dark:text-indigo-400">
            {t("about.contributePage")}
          </Link>
          {t("about.communityP4")}
        </p>

        <h2>{t("about.creatorTitle")}</h2>
        <p>{t("about.creatorP1")}</p>
        <div className="not-prose my-4 flex flex-wrap gap-3">
          <a
            href="https://www.instagram.com/robby.570.drone/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <FaInstagram size={18} />
            {t("about.followInstagram")}
          </a>
          <a
            href="https://www.youtube.com/@robbywu570"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <FaYoutube size={18} />
            {t("about.subscribeYoutube")}
          </a>
        </div>
        <p className="text-sm text-gray-500">{t("about.creatorP2")}</p>
      </article>
    </div>
  );
}
