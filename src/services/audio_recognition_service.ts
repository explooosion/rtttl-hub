import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "../libs/firebase";
import { FIRESTORE_COLLECTIONS } from "../types/firestore_schema";
import type { FirestoreAudioRecognition, FirestoreUsageCounter } from "../types/firestore_schema";

export type { FirestoreAudioRecognition };

export async function saveAudioRecognition(
  data: Omit<FirestoreAudioRecognition, "id" | "createdAt">,
): Promise<string> {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS);
  const docRef = doc(colRef);
  const record: FirestoreAudioRecognition = {
    ...data,
    id: docRef.id,
    createdAt: Timestamp.now(),
  };
  await setDoc(docRef, record);
  return docRef.id;
}

export function sortRecognitionRecordsByNewest<T extends { createdAt?: unknown }>(
  records: T[],
): T[] {
  return [...records].sort((left, right) => {
    const leftTime = toTimestampMs(left.createdAt);
    const rightTime = toTimestampMs(right.createdAt);
    return rightTime - leftTime;
  });
}

function toTimestampMs(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate().getTime();
    }

    if ("seconds" in value && typeof value.seconds === "number") {
      return value.seconds * 1000;
    }

    if (value instanceof Date) {
      return value.getTime();
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export async function getUserRecognitions(userId: string): Promise<FirestoreAudioRecognition[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  const records = snap.docs.map((d) => d.data() as FirestoreAudioRecognition);
  return sortRecognitionRecordsByNewest(records);
}

export async function deleteAudioRecognition(id: string): Promise<void> {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS, id);
  await deleteDoc(docRef);
}

/**
 * Reads the real daily AI recognition usage count from the server-authoritative
 * `usage_counters/{userId}` doc (written by the Cloud Function that gates
 * Replicate API calls — see firebase/functions/src/quota_service.ts). This is NOT
 * derived from the audio_recognitions history collection, so deleting past
 * recognition results never resets the quota.
 */
export async function getUserDailyRecognitionCount(userId: string): Promise<number> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USAGE_COUNTERS, userId));
  if (!snap.exists()) {
    return 0;
  }

  const data = snap.data() as FirestoreUsageCounter;
  const today = new Date().toISOString().slice(0, 10);
  return data.date === today ? data.count : 0;
}
