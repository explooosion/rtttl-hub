import { createHmac, timingSafeEqual } from "crypto";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

import { activatePremium } from "./premium_service";

/**
 * Verifies a Standard Webhooks (https://www.standardwebhooks.com) HMAC-SHA256
 * signature without depending on any external SDK.
 *
 * The secret is expected to be in Polar's "whsec_<base64>" format.
 * Throws if the signature is invalid or the timestamp is outside the tolerance.
 */
function verifyStandardWebhook(
  body: Buffer | string,
  headers: Record<string, string>,
  secret: string,
  toleranceSec = 604800, // 7 days — Polar retries use the original timestamp; idempotency is handled by Firestore
): { type: string; data: Record<string, unknown> } {
  const msgId = headers["webhook-id"];
  const msgTs = headers["webhook-timestamp"];
  const msgSig = headers["webhook-signature"];

  if (!msgId || !msgTs || !msgSig) {
    throw new Error("Missing required webhook headers");
  }

  const ts = parseInt(msgTs, 10);
  if (isNaN(ts)) {
    throw new Error("Invalid webhook-timestamp");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) {
    throw new Error(`Webhook timestamp out of tolerance: ${Math.abs(nowSec - ts)}s`);
  }

  // Decode the secret — strip "whsec_" prefix then base64-decode
  const rawSecret = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const bodyStr = Buffer.isBuffer(body) ? body.toString("utf8") : body;
  const toSign = `${msgId}.${msgTs}.${bodyStr}`;
  const expected = createHmac("sha256", rawSecret).update(toSign).digest("base64");
  const expectedFull = `v1,${expected}`;

  // webhook-signature may contain multiple space-separated entries like "v1,sig1 v1,sig2"
  const providedSigs = msgSig.split(/\s+/);
  const match = providedSigs.some((s) => {
    try {
      return timingSafeEqual(Buffer.from(s), Buffer.from(expectedFull));
    } catch {
      return false;
    }
  });

  if (!match) {
    throw new Error("Webhook signature mismatch");
  }

  return JSON.parse(bodyStr) as { type: string; data: Record<string, unknown> };
}

export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const secret = process.env["POLAR_WEBHOOK_SECRET"] ?? "";
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    res.status(500).send("Server configuration error");
    return;
  }

  let event;
  try {
    event = verifyStandardWebhook(
      req.rawBody,
      req.headers as Record<string, string>,
      secret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Polar webhook: verification failed —", msg);
    res.status(403).send("Invalid signature");
    return;
  }

  // Only act on confirmed payment events
  if (event.type !== "order.paid") {
    res.status(202).send("OK");
    return;
  }

  const order = event.data as Record<string, unknown>;

  // Primary: uid injected server-side via metadata when creating the checkout session.
  // Fallback: uid from the Custom Field (for direct checkout link payments).
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  const customFields = (order.custom_field_data ?? order.customFieldData ?? {}) as Record<string, unknown>;

  const uid =
    typeof metadata["user_id"] === "string"
      ? metadata["user_id"]
      : typeof customFields["user_id"] === "string"
        ? customFields["user_id"]
        : null;

  if (!uid) {
    console.warn("order.paid: missing user_id in metadata/customFieldData — order:", order.id);
    res.status(202).send("OK");
    return;
  }

  const checkoutId = String(order["checkout_id"] ?? order["checkoutId"] ?? order["id"] ?? "");

  // Amount: prefer metadata (set by us), fall back to netAmount (in cents)
  const metaAmount =
    typeof metadata["amount"] === "number"
      ? metadata["amount"]
      : typeof metadata["amount"] === "string"
        ? parseInt(metadata["amount"], 10)
        : null;
  const netAmount = typeof order["netAmount"] === "number" ? order["netAmount"] : 0;
  const amountUsd =
    metaAmount !== null && !isNaN(metaAmount) ? metaAmount : Math.round(netAmount / 100);

  try {
    await activatePremium({
      uid,
      amountUsd,
      checkoutId,
      orderId: String(order["id"] ?? ""),
    });
    console.info(`Premium activated: uid=${uid}, checkout=${checkoutId}, amount=$${amountUsd}`);
  } catch (err) {
    console.error("activatePremium failed:", err);
    res.status(500).send("Internal error");
    return;
  }

  res.status(202).send("OK");
}
