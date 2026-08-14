/**
 * Track Statistics Utilities
 *
 * Utility functions for formatting and displaying track statistics.
 */

/**
 * Format large numbers with K/M suffix
 *
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2K", "1.5M", "999")
 */
export function formatCount(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}
