import { useRef, useCallback, useEffect } from "react";

export function useInView() {
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
