import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

/**
 * Scheduled Account Cleanup
 *
 * Executes the actual deletion for accounts marked as pendingDeletion
 * whose deletionExecuteAt timestamp has passed.
 *
 * This function should be called by Cloud Scheduler (e.g., daily at 2 AM UTC).
 */
export async function scheduledAccountCleanup(): Promise<void> {
  const db = admin.firestore();
  const auth = admin.auth();
  const storage = admin.storage();

  try {
    const now = admin.firestore.Timestamp.now();

    // Query users pending deletion whose execution time has passed
    const usersSnapshot = await db
      .collection("users")
      .where("pendingDeletion", "==", true)
      .where("deletionExecuteAt", "<=", now)
      .get();

    if (usersSnapshot.empty) {
      logger.info("No accounts pending deletion");
      return;
    }

    logger.info(`Found ${usersSnapshot.size} accounts to delete`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      try {
        logger.info(`Deleting account: ${uid}`);

        // Delete user avatar from Storage if exists
        if (userData.customPhotoURL) {
          try {
            const bucket = storage.bucket();
            const filePath = userData.customPhotoURL.replace(/^https:\/\/[^/]+\/[^/]+\//, "");
            await bucket.file(filePath).delete();
            logger.info(`Deleted avatar for ${uid}`);
          } catch (error) {
            logger.warn(`Failed to delete avatar for ${uid}:`, error);
          }
        }

        // Delete all user data from Firestore using batch
        const batch = db.batch();
        let operationCount = 0;

        // Delete user document
        batch.delete(userDoc.ref);
        operationCount++;

        // Delete creations
        const creationsSnapshot = await db
          .collection("user_creations")
          .where("userId", "==", uid)
          .get();

        creationsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          operationCount++;
        });

        // Delete favorites
        const favRef = db.collection("user_favorites").doc(uid);
        batch.delete(favRef);
        operationCount++;

        // Delete transactions
        const txSnapshot = await db.collection("transactions").where("uid", "==", uid).get();

        txSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          operationCount++;
        });

        // Commit batch if within limits
        if (operationCount <= 500) {
          await batch.commit();
        } else {
          // Fall back to individual deletes
          logger.warn(`User ${uid} exceeds batch limit, using individual deletes`);
          await Promise.all([
            userDoc.ref.delete(),
            ...creationsSnapshot.docs.map((d) => d.ref.delete()),
            favRef.delete(),
            ...txSnapshot.docs.map((d) => d.ref.delete()),
          ]);
        }

        // Delete Firebase Auth user (must be last)
        try {
          await auth.deleteUser(uid);
          logger.info(`Successfully deleted account: ${uid}`);
        } catch (authError) {
          const error = authError as { code?: string };
          if (error.code === "auth/user-not-found") {
            logger.warn(`Auth user ${uid} not found, continuing cleanup`);
          } else {
            throw authError;
          }
        }
      } catch (error) {
        logger.error(`Failed to delete account ${uid}:`, error);
        // Continue with next user even if this one fails
      }
    }

    logger.info("Scheduled account cleanup completed");
  } catch (error) {
    logger.error("Scheduled account cleanup failed:", error);
    throw error;
  }
}
