import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();

const db = admin.firestore();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface ActivatePremiumParams {
  uid: string;
  amountUsd: number;
  checkoutId: string;
  orderId: string;
}

/**
 * Activates or extends premium access for a user by 30 days.
 * Called exclusively by the webhook handler — never from client code.
 *
 * Accumulation logic:
 *  - If no active premium (or expired): premium_until = now + 30 days
 *  - If still active:                   premium_until = current premium_until + 30 days
 *
 * Also writes to the `transactions` collection (idempotent via orderId as key).
 */
export async function activatePremium(params: ActivatePremiumParams): Promise<void> {
  const { uid, amountUsd, checkoutId, orderId } = params;

  const userRef = db.collection("users").doc(uid);
  const txRef = db.collection("transactions").doc(checkoutId);

  await db.runTransaction(async (tx) => {
    const [userSnap, txSnap] = await Promise.all([tx.get(userRef), tx.get(txRef)]);

    // Idempotency guard — do not process the same checkout twice
    if (txSnap.exists && (txSnap.data() as { status?: string }).status === "success") {
      return;
    }

    const now = Timestamp.now();
    const currentUntil = userSnap.exists
      ? (userSnap.data() as { premium_until?: admin.firestore.Timestamp }).premium_until
      : null;

    const baseMs =
      currentUntil && currentUntil.toMillis() > now.toMillis()
        ? currentUntil.toMillis() // Accumulate from existing expiry
        : now.toMillis(); // Start fresh from now

    const newPremiumUntil = Timestamp.fromMillis(baseMs + THIRTY_DAYS_MS);
    const totalDonated = (userSnap.data()?.["total_donated"] as number | undefined) ?? 0;

    if (userSnap.exists) {
      tx.update(userRef, {
        premium_until: newPremiumUntil,
        total_donated: totalDonated + amountUsd,
        updatedAt: now,
      });
    } else {
      tx.set(userRef, {
        uid,
        premium_until: newPremiumUntil,
        total_donated: amountUsd,
        createdAt: now,
        updatedAt: now,
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
