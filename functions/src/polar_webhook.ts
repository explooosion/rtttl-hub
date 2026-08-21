import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/dist/commonjs/webhooks";

import { activatePremium } from "./premium_service";

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
    event = validateEvent(
      req.rawBody,
      req.headers as Record<string, string>,
      secret,
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("Polar webhook: invalid signature");
      res.status(403).send("Invalid signature");
      return;
    }
    throw err;
  }

  // Only act on confirmed payment events
  if (event.type !== "order.paid") {
    res.status(202).send("OK");
    return;
  }

  const order = event.data;

  // Primary: uid injected server-side via metadata when creating the checkout session.
  // Fallback: uid from the Custom Field (for direct checkout link payments).
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  const customFields = (order.customFieldData ?? {}) as Record<string, unknown>;

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

  const checkoutId = order.checkoutId ?? order.id;

  // Amount: prefer metadata (set by us), fall back to netAmount (in cents)
  const metaAmount =
    typeof metadata["amount"] === "string" ? parseInt(metadata["amount"], 10) : null;
  const amountUsd =
    metaAmount !== null && !isNaN(metaAmount)
      ? metaAmount
      : Math.round(order.netAmount / 100);

  try {
    await activatePremium({
      uid,
      amountUsd,
      checkoutId,
      orderId: order.id,
    });
    console.info(`Premium activated: uid=${uid}, checkout=${checkoutId}, amount=$${amountUsd}`);
  } catch (err) {
    console.error("activatePremium failed:", err);
    res.status(500).send("Internal error");
    return;
  }

  res.status(202).send("OK");
}
