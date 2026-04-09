import { useMemo } from "react";

interface TimeRulerProps {
  totalMs: number;
  timelineWidthPx: number;
  pxPerSec: number;
}

/** Major tick interval in seconds, based on pixels-per-second. */
function getMajorInterval(pxPerSec: number): number {
  // Keep at least 50px between labeled ticks
  if (pxPerSec >= 400) return 0.5;
  if (pxPerSec >= 160) return 1;
  if (pxPerSec >= 80) return 2;
  if (pxPerSec >= 30) return 5;
  if (pxPerSec >= 12) return 10;
  return 30;
}

/** Minor tick interval between major ticks (null = none). */
function getMinorInterval(majorInterval: number): number | null {
  if (majorInterval <= 0.5) return 0.1;
  if (majorInterval <= 1) return 0.2;
  if (majorInterval <= 2) return 0.5;
  if (majorInterval <= 5) return 1;
  return null;
}

function formatSec(s: number): string {
  // Show one decimal if not a whole number
  return Number.isInteger(s) ? `${s}s` : `${s.toFixed(1)}s`;
}

export function TimeRuler({ totalMs, timelineWidthPx, pxPerSec }: TimeRulerProps) {
  const totalSec = totalMs / 1000;
  const majorInterval = getMajorInterval(pxPerSec);
  const minorInterval = getMinorInterval(majorInterval);

  const majorTicks = useMemo<number[]>(() => {
    if (totalSec <= 0) return [];
    const result: number[] = [];
    // Round to avoid floating-point drift
    for (let s = 0; s <= totalSec + majorInterval * 0.01; s = +(s + majorInterval).toFixed(6)) {
      if (s > totalSec + majorInterval * 0.01) break;
      result.push(+s.toFixed(4));
    }
    return result;
  }, [totalSec, majorInterval]);

  const minorTicks = useMemo<number[]>(() => {
    if (!minorInterval || totalSec <= 0) return [];
    const result: number[] = [];
    for (let s = 0; s <= totalSec + minorInterval * 0.01; s = +(s + minorInterval).toFixed(6)) {
      const rounded = +s.toFixed(4);
      // Skip positions that coincide with a major tick
      const isMajor =
        Math.abs(rounded % majorInterval) < minorInterval * 0.01 ||
        Math.abs((rounded % majorInterval) - majorInterval) < minorInterval * 0.01;
      if (!isMajor) result.push(rounded);
    }
    return result;
  }, [totalSec, minorInterval, majorInterval]);

  if (totalMs <= 0) return null;

  return (
    <div className="sticky top-0 z-20 flex h-7 shrink-0 select-none border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      {/* Header spacer — sticky left so it stays visible during horizontal scroll */}
      <div className="sticky left-0 z-30 w-44 shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900" />
      {/* Ruler at fixed pixel width matching the timeline canvas */}
      <div className="relative shrink-0" style={{ width: timelineWidthPx }}>
        {/* Minor ticks */}
        {minorTicks.map((sec) => (
          <div
            key={`m${sec}`}
            className="absolute top-0 w-px bg-gray-400 dark:bg-gray-600"
            style={{ left: `${(sec / totalSec) * 100}%`, height: 5 }}
          />
        ))}
        {/* Major ticks with labels */}
        {majorTicks.map((sec) => (
          <div
            key={sec}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${(sec / totalSec) * 100}%` }}
          >
            <div className="h-2.5 w-px bg-gray-500 dark:bg-gray-500" />
            <span className="mt-0.5 text-[9px] leading-none text-gray-600 dark:text-gray-400">
              {formatSec(sec)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
