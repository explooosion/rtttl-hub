import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import type { RtttlEntry } from "../utils/rtttl_parser";
import { FIRESTORE_COLLECTIONS } from "../types/firestore_schema";
import type {
  FirestoreUser,
  FirestoreUserCreation,
  FirestoreUserFavorites,
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
  // Delete user document
  await deleteUser(userIdToDelete);

  // Delete all creations
  const creationsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.USER_CREATIONS),
    where("userId", "==", userIdToDelete),
  );
  const creationsSnapshot = await getDocs(creationsQuery);
  await Promise.all(creationsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

  // Delete favorites
  const favRef = doc(db, FIRESTORE_COLLECTIONS.USER_FAVORITES, userIdToDelete);
  await deleteDoc(favRef);

  // Note: Avatar deletion should be handled separately in the auth flow
}
