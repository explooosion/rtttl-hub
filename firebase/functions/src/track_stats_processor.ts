import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

const PENDING_STATS_UPDATES = "pending_stats_updates";
const TRACK_STATS = "track_stats";

interface PendingStatsUpdate {
  trackId: string;
  type: "play";
}

export const processPendingStatsUpdate = onDocumentCreated(
  `${PENDING_STATS_UPDATES}/{updateId}`,
  async (event) => {
    const pendingSnapshot = event.data;
    if (!pendingSnapshot) {
      return;
    }

    const update = pendingSnapshot.data() as PendingStatsUpdate;
    if (update.type !== "play" || !update.trackId) {
      await pendingSnapshot.ref.delete();
      return;
    }

    const db = admin.firestore();
    const statsRef = db.collection(TRACK_STATS).doc(update.trackId);

    await db.runTransaction(async (transaction) => {
      // The transaction makes retries idempotent: a previously processed queue
      // document has already been deleted and must not increment twice.
      const currentPendingSnapshot = await transaction.get(pendingSnapshot.ref);
      if (!currentPendingSnapshot.exists) {
        return;
      }

      const statsSnapshot = await transaction.get(statsRef);
      const now = admin.firestore.Timestamp.now();
      const currentStats = statsSnapshot.data();

      if (statsSnapshot.exists) {
        transaction.update(statsRef, {
          playCount: (currentStats?.playCount ?? 0) + 1,
          lastPlayedAt: now,
          updatedAt: now,
        });
      } else {
        transaction.set(statsRef, {
          trackId: update.trackId,
          playCount: 1,
          lastPlayedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      transaction.delete(pendingSnapshot.ref);
    });
  },
);
