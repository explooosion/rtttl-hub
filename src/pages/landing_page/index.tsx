import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { COLLECTIONS } from "../../constants/collections";
import { HeroBannerAnimation } from "../../components/hero_banner_animation";
import { useInView } from "../../hooks/use_in_view";
import { CollectionCard } from "./collection_card";
import { CategorySlider } from "./category_slider";
import { FEATURES } from "./landing_constants";

export function LandingPage() {
  const { t } = useTranslation();
  const flyInRef = useInView();
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const bgParallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (bgParallaxRef.current) {
        bgParallaxRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={flyInRef}>
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        {/* Parallax background layer */}
        <div
          ref={bgParallaxRef}
          className="absolute inset-x-0 bg-linear-to-br from-indigo-700 via-purple-700 to-pink-600 will-change-transform"
          style={{ top: "-25%", bottom: "-25%" }}
        >
          <HeroBannerAnimation targetRef={ctaRef} />
        </div>
        {/* Foreground content */}
        <div className="relative mx-auto max-w-7xl px-4 py-12 text-center sm:py-16 md:py-20 lg:py-28">
          <h2 className="font-brand mb-4 text-3xl font-extrabold tracking-[0.12em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t("landing.hero.title")}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-indigo-100/90 lg:text-xl">
            {t("landing.hero.subtitle")}
          </p>
          <Link
            ref={ctaRef}
            to="/collections"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-700 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-2xl"
          >
            {t("landing.hero.cta")}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Features */}
        <section className="grid gap-6 py-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }, i) => (
            <div
              key={titleKey}
              className={`fly-in fly-in-delay-${i % 4} group rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-gray-900`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-900/50 dark:text-indigo-400">
                <Icon size={22} />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">{t(titleKey)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t(descKey)}</p>
            </div>
          ))}
        </section>

        {/* Collection cards */}
        <section className="py-8">
          <h3 className="fly-in mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            {t("collections.title")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {COLLECTIONS.map((col, i) => (
              <div key={col.slug} className={`fly-in fly-in-delay-${i + 1}`}>
                <CollectionCard
                  slug={col.slug}
                  nameKey={col.nameKey}
                  descriptionKey={col.descriptionKey}
                  source={col.source}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Fullwidth category slider */}
      <section className="bg-gray-50 py-10 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl">
          <h3 className="mb-6 px-4 text-2xl font-bold text-gray-900 dark:text-white">
            {t("landing.categories.title")}
          </h3>
          <CategorySlider />
        </div>
      </section>
    </div>
  );
}
