import * as admin from "firebase-admin";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

// Initialize Firebase Admin SDK once (shared across all functions)
admin.initializeApp();

const polarWebhookSecret = defineSecret("POLAR_WEBHOOK_SECRET");
const polarAccessToken = defineSecret("POLAR_ACCESS_TOKEN");
const polarProductId3 = defineSecret("POLAR_PRODUCT_ID_3");
const polarProductId5 = defineSecret("POLAR_PRODUCT_ID_5");
const polarProductId10 = defineSecret("POLAR_PRODUCT_ID_10");
const replicateApiToken = defineSecret("REPLICATE_API_TOKEN");

/**
 * polarWebhook
 *
 * Receives Polar order.paid events, verifies the HMAC signature,
 * then writes premium_until to Firestore via Admin SDK.
 *
 * Register in Polar Dashboard → Settings → Webhooks:
 *   URL:    https://us-central1-rtttl-hub.cloudfunctions.net/polarWebhook
 *   Events: order.paid
 *   Secret: value of POLAR_WEBHOOK_SECRET
 */
export const polarWebhook = onRequest(
  {
    secrets: [polarWebhookSecret],
    cors: false,
    invoker: "public",
    region: "us-central1",
  },
  async (req, res) => {
    const { handlePolarWebhook } = await import("./polar_webhook");
    await handlePolarWebhook(req, res);
  },
);

/**
 * polarCreateCheckout
 *
 * Called by the frontend (Firebase SDK onCall) to create a Polar Checkout
 * Session with the uid securely embedded in metadata — users cannot see or
 * tamper with it.
 *
 * Request body: { amount: 3 | 5 | 10 }
 * Response:     { url: string }
 *
 * Requires the caller to be authenticated via Firebase Auth.
 */
export const polarCreateCheckout = onCall(
  {
    secrets: [polarAccessToken, polarProductId3, polarProductId5, polarProductId10],
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to donate.");
    }

    const uid = request.auth.uid;
    const amount = request.data.amount as number;

    if (![3, 5, 10].includes(amount)) {
      throw new HttpsError("invalid-argument", "Amount must be 3, 5, or 10.");
    }

    const { createCheckoutSession } = await import("./create_checkout_session");
    const url = await createCheckoutSession(uid, amount);
    return { url };
  },
);

/**
 * replicateCreatePrediction
 *
 * Proxies the Replicate "create prediction" call server-side so that
 * REPLICATE_API_TOKEN never appears in the browser bundle and the CORS
 * restriction on api.replicate.com is bypassed.
 *
 * Request:  { audioDataUri, startTime, endTime, stems }
 * Response: { id, status }
 *
 * Requires Firebase Auth.
 */
export const replicateCreatePrediction = onCall(
  {
    secrets: [replicateApiToken],
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { audioDataUri, startTime, endTime, stems } = request.data as {
      audioDataUri: string;
      startTime: number;
      endTime: number;
      stems: string;
    };

    if (!audioDataUri || typeof startTime !== "number" || typeof endTime !== "number" || !stems) {
      throw new HttpsError("invalid-argument", "Missing required fields.");
    }

    if (startTime < 0 || endTime <= startTime) {
      throw new HttpsError("invalid-argument", "Invalid time range.");
    }

    // Server-side enforcement of donate-tier limits (never trust the client —
    // this gates paid Replicate API usage). See quota_service.ts.
    const { checkAndConsumeQuota } = await import("./quota_service");
    await checkAndConsumeQuota(request.auth.uid, endTime - startTime);

    const { createReplicatePrediction } = await import("./replicate_proxy");
    return createReplicatePrediction({ audioDataUri, startTime, endTime, stems });
  },
);

/**
 * replicateGetPrediction
 *
 * Proxies the Replicate "get prediction" polling call server-side.
 *
 * Request:  { id: string }
 * Response: ReplicatePrediction object
 *
 * Requires Firebase Auth.
 */
export const replicateGetPrediction = onCall(
  {
    secrets: [replicateApiToken],
    region: "us-central1",
    timeoutSeconds: 30,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { id } = request.data as { id: string };
    if (!id || typeof id !== "string") {
      throw new HttpsError("invalid-argument", "Missing prediction id.");
    }

    const { getReplicatePrediction } = await import("./replicate_proxy");
    return getReplicatePrediction(id);
  },
);

/**
 * scheduledAccountCleanup
 *
 * Runs daily at 2 AM UTC to delete accounts that are marked as pendingDeletion
 * and whose deletionExecuteAt timestamp has passed (3 days after user requested deletion).
 *
 * Schedule: 0 2 * * * (2 AM UTC daily)
 */
export const scheduledAccountCleanup = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
    region: "us-central1",
    retryCount: 3,
    timeoutSeconds: 540,
  },
  async () => {
    const { scheduledAccountCleanup: cleanup } = await import("./scheduled_account_cleanup");
    await cleanup();
  },
);
