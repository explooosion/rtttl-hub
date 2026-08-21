import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();

const db = admin.firestore();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Supported donation tier amounts in USD. */
const TIER_AMOUNTS = [3, 5, 10] as const;
type TierAmount = (typeof TIER_AMOUNTS)[number];

/** Returns the Firestore field name for a given tier amount. */
function tierField(amount: TierAmount): string {
  return `premium_tier_${amount}_until`;
}

interface ActivatePremiumParams {
  uid: string;
  amountUsd: number;
  checkoutId: string;
  orderId: string;
}

/**
 * Activates or extends tier-specific premium access for a user by 30 days.
 * Called exclusively by the webhook handler — never from client code.
 *
 * Tier logic:
 *  - Each tier ($3 / $5 / $10) has its own independent 30-day expiry window.
 *  - Same tier: accumulate (add 30 days to existing tier expiry if still active).
 *  - Different tiers: each tier's expiry is tracked independently.
 *
 * Cascade examples handled purely by UI reading per-tier fields:
 *  - Lower then Higher: user is on higher tier; lower tier expires earlier or same time.
 *  - Higher then Lower: higher tier active until it expires, then lower tier kicks in
 *    if its independent 30-day window is still active.
 *
 * premium_until: kept as max across all tiers for general "is user premium" checks.
 */
export async function activatePremium(params: ActivatePremiumParams): Promise<void> {
  const { uid, amountUsd, checkoutId, orderId } = params;

  if (!(TIER_AMOUNTS as readonly number[]).includes(amountUsd)) {
    throw new Error(`Invalid tier amount: ${amountUsd}. Must be one of ${TIER_AMOUNTS.join(", ")}`);
  }

  const tier = amountUsd as TierAmount;
  const field = tierField(tier);

  const userRef = db.collection("users").doc(uid);
  const txRef = db.collection("transactions").doc(checkoutId);

  await db.runTransaction(async (tx) => {
    const [userSnap, txSnap] = await Promise.all([tx.get(userRef), tx.get(txRef)]);

    // Idempotency guard — do not process the same checkout twice
    if (txSnap.exists && (txSnap.data() as { status?: string }).status === "success") {
      return;
    }

    const now = Timestamp.now();
    const userData = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {};

    // Compute new expiry for the donated tier (accumulate if still active, else fresh start)
    const currentTierUntil = userData[field] as admin.firestore.Timestamp | null | undefined;
    const tierBaseMs =
      currentTierUntil && currentTierUntil.toMillis() > now.toMillis()
        ? currentTierUntil.toMillis()
        : now.toMillis();
    const newTierUntil = Timestamp.fromMillis(tierBaseMs + THIRTY_DAYS_MS);

    // Compute premium_until = max expiry across all tiers
    const allExpiryMs: number[] = TIER_AMOUNTS.map((t) => {
      if (t === tier) {
        return newTierUntil.toMillis();
      }
      const existing = userData[tierField(t)] as admin.firestore.Timestamp | null | undefined;
      return existing && existing.toMillis() > now.toMillis() ? existing.toMillis() : 0;
    });
    const newPremiumUntil = Timestamp.fromMillis(Math.max(...allExpiryMs));

    const totalDonated = (userData["total_donated"] as number | undefined) ?? 0;

    const updates: Record<string, unknown> = {
      [field]: newTierUntil,
      premium_until: newPremiumUntil,
      total_donated: totalDonated + amountUsd,
      updatedAt: now,
    };

    if (userSnap.exists) {
      tx.update(userRef, updates);
    } else {
      tx.set(userRef, {
        uid,
        ...updates,
        createdAt: now,
      });
    }

    tx.set(txRef, {
      checkout_id: checkoutId,
      order_id: orderId,
      uid,
      amount: amountUsd,
      status: "success",
      created_at: now,
    });
  });
}
