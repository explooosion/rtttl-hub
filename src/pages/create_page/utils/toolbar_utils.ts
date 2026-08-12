/** Format milliseconds as mm:ss.xxx (ms precision). */
export function formatMs(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

/**
 * Generates the next available "Untitled Project" name that does not
 * already exist in `existingTitles` (comparison is case-insensitive).
 */
export function nextProjectName(existingTitles: string[]): string {
  const lower = existingTitles.map((s) => s.toLowerCase());
  const base = "untitled project";
  if (!lower.includes(base)) {
    return "Untitled Project";
  }
  let n = 2;
  while (lower.includes(`${base} ${n}`)) {
    n++;
  }
  return `Untitled Project ${n}`;
}
