import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { FIRESTORE_COLLECTIONS } from "../types/firestore_schema";
import type { FirestoreAudioRecognition } from "../types/firestore_schema";

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

export async function getUserRecognitions(userId: string): Promise<FirestoreAudioRecognition[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FirestoreAudioRecognition);
}

export async function deleteAudioRecognition(id: string): Promise<void> {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS, id);
  await deleteDoc(docRef);
}

export async function getUserDailyRecognitionCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.AUDIO_RECOGNITIONS),
    where("userId", "==", userId),
    where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
  );
  const snap = await getDocs(q);
  return snap.size;
}
