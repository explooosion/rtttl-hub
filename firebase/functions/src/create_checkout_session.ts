import { Polar } from "@polar-sh/sdk";

/**
 * Polar product ID lookup.
 * Secrets to set before deploying:
 *   firebase functions:secrets:set POLAR_ACCESS_TOKEN
 *   firebase functions:secrets:set POLAR_PRODUCT_ID_3
 *   firebase functions:secrets:set POLAR_PRODUCT_ID_5
 *   firebase functions:secrets:set POLAR_PRODUCT_ID_10
 */
function getProductId(amountUsd: number): string {
  const map: Record<number, string> = {
    3: process.env["POLAR_PRODUCT_ID_3"] ?? "",
    5: process.env["POLAR_PRODUCT_ID_5"] ?? "",
    10: process.env["POLAR_PRODUCT_ID_10"] ?? "",
  };
  return map[amountUsd] ?? "";
}

const SUCCESS_URL = "https://rtttl-hub.io/payment?result=success&checkout_id={CHECKOUT_ID}";

/**
 * Creates a Polar Checkout Session with the user's UID embedded server-side in
 * `metadata`. The uid is never visible to the user and cannot be tampered with.
 *
 * @param uid       Firebase Auth UID of the authenticated user
 * @param amountUsd Donation amount (3 | 5 | 10)
 * @returns         One-time Polar checkout URL to redirect the user to
 */
export async function createCheckoutSession(uid: string, amountUsd: number): Promise<string> {
  const accessToken = process.env["POLAR_ACCESS_TOKEN"] ?? "";
  const productId = getProductId(amountUsd);

  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }
  if (!productId) {
    throw new Error(`No product ID configured for amount $${amountUsd}`);
  }

  const polar = new Polar({ accessToken });

  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: SUCCESS_URL,
    metadata: {
      user_id: uid,
      amount: amountUsd,
    },
  });

  return checkout.url;
}
