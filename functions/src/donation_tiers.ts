/**
 * Server-side mirror of src/constants/donation_tiers.ts.
 *
 * Cloud Functions build as a separate TypeScript project and cannot import
 * from src/, so these values must be kept in sync manually with the client
 * copy whenever donation tiers change.
 */

export const FREE_DAILY_UPLOAD_LIMIT = 30;
export const FREE_MAX_ANALYSIS_SECONDS = 10;

export const DONATION_TIER_AMOUNTS = [3, 5, 10] as const;
export type DonationTierAmount = (typeof DONATION_TIER_AMOUNTS)[number];

export interface DonationTierDef {
  amount: DonationTierAmount;
  dailyUploads: number;
  maxAnalysisSeconds: number;
}

export const DONATION_TIERS: DonationTierDef[] = [
  { amount: 3, dailyUploads: 50, maxAnalysisSeconds: 30 },
  { amount: 5, dailyUploads: 150, maxAnalysisSeconds: 60 },
  { amount: 10, dailyUploads: 300, maxAnalysisSeconds: 300 },
];
