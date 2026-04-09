import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CATEGORY_ITEMS } from "./landing_constants";

export function CategorySlider() {
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
