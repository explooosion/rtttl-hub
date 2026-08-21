import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import zhCN from "./locales/zh-CN.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import cs from "./locales/cs.json";
import pl from "./locales/pl.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";

const SUPPORTED_LANGUAGES: string[] = [
  "en",
  "zh-TW",
  "zh-CN",
  "ja",
  "ko",
  "de",
  "fr",
  "es",
  "it",
  "cs",
  "pl",
  "ru",
  "uk",
];

function normalizeDetectedLanguage(language: string) {
  const normalized = language.replace("_", "-");
  const lower = normalized.toLowerCase();

  if (lower.startsWith("zh")) {
    if (
      lower.includes("hant") ||
      lower.endsWith("-tw") ||
      lower.endsWith("-hk") ||
      lower.endsWith("-mo")
    ) {
      return "zh-TW";
    }
    return "zh-CN";
  }

  const matchedLang = SUPPORTED_LANGUAGES.find((lang) => lang.toLowerCase() === lower);
  if (matchedLang) {
    return matchedLang;
  }

  const baseLanguage = lower.split("-")[0];
  const matchedBase = SUPPORTED_LANGUAGES.find((lang) => lang.toLowerCase() === baseLanguage);
  if (matchedBase) {
    return matchedBase;
  }

  return "en";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-TW": { translation: zhTW },
      "zh-CN": { translation: zhCN },
      ja: { translation: ja },
      ko: { translation: ko },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      it: { translation: it },
      cs: { translation: cs },
      pl: { translation: pl },
      ru: { translation: ru },
      uk: { translation: uk },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      convertDetectedLanguage: normalizeDetectedLanguage,
    },
  });

export default i18n;
