import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMusic,
  FaPlay,
  FaPlusCircle,
  FaGithub,
  FaDatabase,
  FaUsers,
  FaHeadphones,
  FaGuitar,
  FaFilm,
  FaGamepad,
  FaSnowflake,
  FaGlobe,
  FaBaby,
  FaBell,
  FaStar,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { COLLECTIONS } from "@/constants/collections";
import { HeroBannerAnimation } from "@/components/HeroBannerAnimation";

function useInView() {
  const ref = useRef<HTMLDivElement>(null);

  const observe = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    const children = el.querySelectorAll(".fly-in");
    for (const child of children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = observe();
    return cleanup;
  }, [observe]);

  return ref;
}

const COLLECTION_ILLUSTRATIONS: Record<
  string,
  { icon: React.ComponentType<{ size: number; className?: string }>; gradient: string }
> = {
  picaxe: { icon: FaDatabase, gradient: "from-indigo-600 via-purple-600 to-pink-500" },
  community: { icon: FaUsers, gradient: "from-emerald-500 via-teal-500 to-cyan-500" },
};

function CollectionCard({
  slug,
  nameKey,
  descriptionKey,
  source,
}: {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  source?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const illustration = COLLECTION_ILLUSTRATIONS[slug] ?? {
    icon: FaMusic,
    gradient: "from-gray-500 to-gray-600",
  };
  const Icon = illustration.icon;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/collections/${slug}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/collections/${slug}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900"
    >
      {/* Illustration banner */}
      <div
        className={`flex h-36 items-center justify-center bg-linear-to-br ${illustration.gradient}`}
      >
        <Icon size={48} className="text-white/80 transition-transform group-hover:scale-110" />
      </div>
      {/* Content */}
      <div className="p-5">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{t(nameKey)}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {t(descriptionKey)}
        </p>
        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FaExternalLinkAlt size={10} />
            {t("collections.officialSource")}
          </a>
        )}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: FaMusic,
    titleKey: "landing.features.browse.title",
    descKey: "landing.features.browse.description",
  },
  {
    icon: FaPlay,
    titleKey: "landing.features.play.title",
    descKey: "landing.features.play.description",
  },
  {
    icon: FaPlusCircle,
    titleKey: "landing.features.create.title",
    descKey: "landing.features.create.description",
  },
  {
    icon: FaGithub,
    titleKey: "landing.features.openSource.title",
    descKey: "landing.features.openSource.description",
  },
] as const;

const CATEGORY_ITEMS = [
  { id: "pop", icon: FaHeadphones, gradient: "from-pink-500 to-rose-500" },
  { id: "rock", icon: FaGuitar, gradient: "from-red-500 to-orange-500" },
  { id: "classical", icon: FaMusic, gradient: "from-amber-500 to-yellow-500" },
  { id: "movie-tv", icon: FaFilm, gradient: "from-purple-500 to-indigo-500" },
  { id: "game", icon: FaGamepad, gradient: "from-emerald-500 to-teal-500" },
  { id: "holiday", icon: FaSnowflake, gradient: "from-cyan-500 to-blue-500" },
  { id: "folk", icon: FaGlobe, gradient: "from-lime-500 to-green-500" },
  { id: "nursery", icon: FaBaby, gradient: "from-violet-500 to-purple-500" },
  { id: "alert", icon: FaBell, gradient: "from-orange-500 to-amber-500" },
  { id: "original", icon: FaStar, gradient: "from-indigo-500 to-blue-500" },
] as const;

function CategorySlider() {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Duplicate items 3x for seamless loop
  const items = [...CATEGORY_ITEMS, ...CATEGORY_ITEMS, ...CATEGORY_ITEMS];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let animId = 0;
    let offset = 0;
    // Width of one set of items
    const getSetWidth = () => track.scrollWidth / 3;

    const step = () => {
      if (!pausedRef.current) {
        offset += 0.5;
        const setW = getSetWidth();
        if (offset >= setW) offset -= setW;
        track.style.transform = `translateX(-${offset}px)`;
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div ref={trackRef} className="flex gap-4 px-4 py-2 will-change-transform">
        {items.map(({ id, icon: Icon, gradient }, i) => (
          <Link
            key={`${id}-${i}`}
            to={`/collections/picaxe?category=${id}`}
            className="group flex shrink-0 flex-col items-center gap-2"
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:h-24 sm:w-24`}
            >
              <Icon size={28} className="text-white/90" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t(`categories.${id}`)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  const flyInRef = useInView();
  const [ctaHovered, setCtaHovered] = useState(false);
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
          <HeroBannerAnimation boosted={ctaHovered} />
        </div>
        {/* Foreground content */}
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center lg:py-28">
          <h2 className="font-brand mb-4 text-4xl font-extrabold tracking-[0.12em] text-white lg:text-6xl">
            {t("landing.hero.title")}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-indigo-100/90 lg:text-xl">
            {t("landing.hero.subtitle")}
          </p>
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-700 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-2xl"
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
          >
            {t("landing.hero.cta")}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Features */}
        <section className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-6 sm:grid-cols-2">
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
