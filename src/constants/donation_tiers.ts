/**
 * Shared donation tier definitions for the AI recognition feature.
 * Used by the donate page, account page (premium status), and the audio
 * stem extractor (quota enforcement) so the numbers never drift apart.
 */

/** Daily AI recognition upload allowance for users with no active donation. */
export const FREE_DAILY_UPLOAD_LIMIT = 30;

/** Max AI recognition duration (seconds) per upload for the free tier. */
export const FREE_MAX_ANALYSIS_SECONDS = 10;

export const DONATION_TIER_AMOUNTS = [3, 5, 10] as const;
export type DonationTierAmount = (typeof DONATION_TIER_AMOUNTS)[number];

export interface DonationTierDef {
  amount: DonationTierAmount;
  /** Daily AI recognition upload allowance while this tier is active. */
  dailyUploads: number;
  /** Max AI recognition duration (seconds) per upload while this tier is active. */
  maxAnalysisSeconds: number;
  popular?: boolean;
}

export const DONATION_TIERS: DonationTierDef[] = [
  { amount: 3, dailyUploads: 50, maxAnalysisSeconds: 30 },
  { amount: 5, dailyUploads: 150, maxAnalysisSeconds: 60, popular: true },
  { amount: 10, dailyUploads: 300, maxAnalysisSeconds: 300 },
];
