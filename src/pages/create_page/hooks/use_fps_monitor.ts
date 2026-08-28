import { useEffect, useState } from "react";

/** How often the reported FPS value is refreshed. */
const SAMPLE_WINDOW_MS = 500;

/**
 * Measures the browser's actual rendering frame rate via requestAnimationFrame,
 * exposing a periodically-updated FPS value while `enabled` is true.
 *
 * Sampling only runs when enabled (e.g. during playback) so this never adds
 * overhead while idle, and the reported value is refreshed at most every
 * `SAMPLE_WINDOW_MS` to avoid triggering excess re-renders of its own.
 */
export function useFpsMonitor(enabled: boolean): number | null {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(
    function measureFps() {
      if (!enabled) {
        return;
      }

      let rafId = 0;
      let frameCount = 0;
      let windowStart = performance.now();

      const tick = (now: number) => {
        frameCount += 1;
        const elapsed = now - windowStart;
        if (elapsed >= SAMPLE_WINDOW_MS) {
          setFps(Math.round((frameCount * 1000) / elapsed));
          frameCount = 0;
          windowStart = now;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafId);
        setFps(null);
      };
    },
    [enabled],
  );

  return fps;
}
