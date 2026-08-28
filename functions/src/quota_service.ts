/**
 * quota_service.ts
 *
 * Server-side enforcement of donate-tier AI recognition limits. This is the
 * single source of truth for these rules — the client-side checks in
 * audio_stem_extractor.tsx are UX conveniences only and must never be
 * trusted, since replicateCreatePrediction consumes paid Replicate API
 * quota.
 *
 * Daily usage is tracked in `usage_counters/{uid}` (server-write-only, see
 * firestore.rules) rather than the client-manageable `audio_recognitions`
 * history collection, so that deleting recognition history (a legitimate
 * user-facing feature) can never reset a user's daily quota.
 */
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

import {
  DONATION_TIERS,
  FREE_DAILY_UPLOAD_LIMIT,
  FREE_MAX_ANALYSIS_SECONDS,
} from "./donation_tiers";

/** Tolerance for floating point / client rounding when comparing durations. */
const ANALYSIS_DURATION_EPSILON_SEC = 0.5;

interface EffectiveLimits {
  dailyLimit: number;
  maxAnalysisSeconds: number;
}

const FREE_LIMITS: EffectiveLimits = {
  dailyLimit: FREE_DAILY_UPLOAD_LIMIT,
  maxAnalysisSeconds: FREE_MAX_ANALYSIS_SECONDS,
};

/**
 * Resolves a user's effective daily upload limit and max analysis duration
 * from their highest active donation tier, falling back to the free-tier
 * defaults when no donation is currently active.
 */
async function resolveEffectiveLimits(uid: string): Promise<EffectiveLimits> {
  const userSnap = await admin.firestore().collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return FREE_LIMITS;
  }

  const data = userSnap.data() ?? {};
  const nowMs = Date.now();
  const activeAmounts = new Set<number>();
  for (const tier of DONATION_TIERS) {
    const until = data[`premium_tier_${tier.amount}_until`] as
      | admin.firestore.Timestamp
      | undefined
      | null;
    if (until && until.toMillis() > nowMs) {
      activeAmounts.add(tier.amount);
    }
  }

  if (activeAmounts.size === 0) {
    return FREE_LIMITS;
  }

  const bestTier = [...DONATION_TIERS]
    .filter((tier) => activeAmounts.has(tier.amount))
    .sort((a, b) => b.maxAnalysisSeconds - a.maxAnalysisSeconds)[0];

  return { dailyLimit: bestTier.dailyUploads, maxAnalysisSeconds: bestTier.maxAnalysisSeconds };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validates the requested AI-recognition duration against the caller's tier
 * limit, then atomically checks and increments today's usage counter.
 * Throws HttpsError ("invalid-argument" or "resource-exhausted") if either
 * limit would be exceeded. Must be called before any Replicate API request.
 */
export async function checkAndConsumeQuota(uid: string, requestedSeconds: number): Promise<void> {
  const limits = await resolveEffectiveLimits(uid);

  if (requestedSeconds > limits.maxAnalysisSeconds + ANALYSIS_DURATION_EPSILON_SEC) {
    throw new HttpsError(
      "invalid-argument",
      `Selected duration exceeds the ${limits.maxAnalysisSeconds}s limit for your plan.`,
    );
  }

  const counterRef = admin.firestore().collection("usage_counters").doc(uid);
  const today = todayUtc();

  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.exists ? (snap.data() as { date?: string; count?: number }) : {};
    const currentCount = data.date === today ? (data.count ?? 0) : 0;

    if (currentCount >= limits.dailyLimit) {
      throw new HttpsError(
        "resource-exhausted",
        `Daily AI recognition limit reached (${limits.dailyLimit}/day).`,
      );
    }

    tx.set(counterRef, {
      date: today,
      count: currentCount + 1,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });
}
