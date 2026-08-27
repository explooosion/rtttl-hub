import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import type { RtttlEntry } from "../utils/rtttl_parser";
import { FIRESTORE_COLLECTIONS } from "../types/firestore_schema";
import type {
  FirestoreUser,
  FirestoreUserCreation,
  FirestoreUserFavorites,
  FirestoreTransaction,
} from "../types/firestore_schema";

// Re-export types for convenience
export type { FirestoreUser, FirestoreUserCreation, FirestoreUserFavorites };

// User operations
export async function createOrUpdateUser(
  uid: string,
  data: Partial<Omit<FirestoreUser, "uid" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(userRef, {
      ...data,
      uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

export async function getUser(uid: string): Promise<FirestoreUser | null> {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? (userDoc.data() as FirestoreUser) : null;
}

export async function deleteUser(uid: string): Promise<void> {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  await deleteDoc(userRef);
}

/**
 * Watches a Polar transaction document by checkout ID.
 *
 * The Cloud Function (polarWebhook) is the authoritative writer of this document.
 * Call this on the /payment page to poll for webhook confirmation instead of
 * performing client-side Firestore writes.
 *
 * @param checkoutId   The Polar checkout session ID from the redirect URL.
 * @param onStatus     Called with "success", "pending", or null (not yet written).
 * @returns Unsubscribe function — call on component unmount.
 */
export function watchTransaction(
  checkoutId: string,
  onStatus: (status: FirestoreTransaction["status"] | null) => void,
): () => void {
  const txRef = doc(db, FIRESTORE_COLLECTIONS.TRANSACTIONS, checkoutId);
  return onSnapshot(txRef, (snap) => {
    if (!snap.exists()) {
      onStatus(null);
      return;
    }
    onStatus((snap.data() as FirestoreTransaction).status);
  });
}

/**
 * Fetches all successful transactions for a user, sorted newest-first.
 * Used on the account page to display donation history.
 */
export async function getUserTransactions(uid: string): Promise<FirestoreTransaction[]> {
  const q = query(collection(db, FIRESTORE_COLLECTIONS.TRANSACTIONS), where("uid", "==", uid));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => d.data() as FirestoreTransaction);
  docs.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
  return docs;
}

// Creation operations
export async function syncCreations(userId: string, creations: RtttlEntry[]): Promise<void> {
  const batch = creations.map((creation) => {
    const creationRef = doc(db, FIRESTORE_COLLECTIONS.USER_CREATIONS, creation.id);
    return setDoc(creationRef, {
      id: creation.id,
      userId,
      title: creation.title,
      artist: creation.artist,
      code: creation.code,
      tracks: creation.tracks || null,
      categories: creation.categories || [],
      isPublic: creation.isPublic ?? false,
      createdAt: creation.createdAt
        ? Timestamp.fromDate(new Date(creation.createdAt))
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await Promise.all(batch);
}

export async function getUserCreations(userId: string): Promise<RtttlEntry[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_CREATIONS),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreUserCreation;
    return {
      id: data.id,
      title: data.title,
      artist: "", // Empty for user creations - display name fetched via userId
      code: data.code,
      tracks: data.tracks,
      categories: data.categories as RtttlEntry["categories"],
      collection: "my-creations" as const,
      firstLetter: data.title[0]?.toUpperCase() || "#",
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      isSynced: true,
      isPublic: data.isPublic ?? false,
      userId: data.userId,
    };
  });
}

export async function deleteCreation(creationId: string): Promise<void> {
  const creationRef = doc(db, FIRESTORE_COLLECTIONS.USER_CREATIONS, creationId);
  await deleteDoc(creationRef);
}

// Get all public creations
export async function getPublicCreations(): Promise<RtttlEntry[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_CREATIONS),
    where("isPublic", "==", true),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreUserCreation;
    return {
      id: data.id,
      title: data.title,
      artist: "", // Empty for user creations - display name fetched via userId
      code: data.code,
      tracks: data.tracks,
      categories: data.categories as RtttlEntry["categories"],
      collection: "community" as const,
      firstLetter: data.title[0]?.toUpperCase() || "#",
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      isSynced: true,
      isPublic: true,
      userId: data.userId,
    };
  });
}

// Update creation visibility
export async function updateCreationVisibility(
  creationId: string,
  isPublic: boolean,
): Promise<void> {
  const creationRef = doc(db, FIRESTORE_COLLECTIONS.USER_CREATIONS, creationId);
  await updateDoc(creationRef, {
    isPublic,
    updatedAt: Timestamp.now(),
  });
}

// Favorites operations
export async function syncFavorites(userId: string, favoriteIds: string[]): Promise<void> {
  const favRef = doc(db, FIRESTORE_COLLECTIONS.USER_FAVORITES, userId);
  await setDoc(favRef, {
    userId,
    favorites: favoriteIds,
    updatedAt: Timestamp.now(),
  });
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  const favRef = doc(db, FIRESTORE_COLLECTIONS.USER_FAVORITES, userId);
  const favDoc = await getDoc(favRef);
  return favDoc.exists() ? (favDoc.data() as FirestoreUserFavorites).favorites : [];
}

// Avatar upload
export async function uploadAvatar(userId: string, file: Blob): Promise<string> {
  const timestamp = Date.now();
  const avatarRef = ref(storage, `user_avatars/${userId}/${timestamp}.jpg`);
  await uploadBytes(avatarRef, file);
  return await getDownloadURL(avatarRef);
}

export async function deleteAvatar(_userId: string, photoURL: string): Promise<void> {
  try {
    const avatarRef = ref(storage, photoURL);
    await deleteObject(avatarRef);
  } catch (error) {
    console.warn("Failed to delete avatar:", error);
  }
}

// Delete all user data
export async function deleteAllUserData(userIdToDelete: string): Promise<void> {
  try {
    // Use batched writes for atomicity (Firestore batch limit is 500 operations)
    const batch = writeBatch(db);
    let operationCount = 0;

    // Delete user document
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userIdToDelete);
    batch.delete(userRef);
    operationCount++;

    // Delete all creations
    const creationsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.USER_CREATIONS),
      where("userId", "==", userIdToDelete),
    );
    const creationsSnapshot = await getDocs(creationsQuery);
    creationsSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
      operationCount++;
    });

    // Delete favorites
    const favRef = doc(db, FIRESTORE_COLLECTIONS.USER_FAVORITES, userIdToDelete);
    batch.delete(favRef);
    operationCount++;

    // Delete transaction records
    const txQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.TRANSACTIONS),
      where("uid", "==", userIdToDelete),
    );
    const txSnapshot = await getDocs(txQuery);
    txSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
      operationCount++;
    });

    // Commit the batch if within limits
    if (operationCount <= 500) {
      await batch.commit();
    } else {
      // If exceeds batch limit, fall back to individual deletes
      console.warn("User data exceeds batch limit, using individual deletes");
      await deleteUser(userIdToDelete);
      await Promise.all(creationsSnapshot.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(favRef);
      await Promise.all(txSnapshot.docs.map((d) => deleteDoc(d.ref)));
    }

    // Note: Avatar deletion should be handled separately in the auth flow
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
}
