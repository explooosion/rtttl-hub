import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { auth, googleProvider } from "../libs/firebase";
import {
  createOrUpdateUser,
  getUser,
  deleteAllUserData,
  deleteAvatar,
  getUserCreations,
  getUserFavorites,
  scheduleAccountDeletion,
  cancelAccountDeletion,
} from "../services/firestore_service";
import { setCachedUserDisplayName } from "../services/user_profile_service";

interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  customPhotoURL?: string;
  pendingDeletion?: boolean;
  deletionScheduledAt?: Timestamp | null;
  deletionExecuteAt?: Timestamp | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; customPhotoURL?: string }) => Promise<void>;
  scheduleAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  initAuth: VoidFunction;
  loadUserData: (uid: string) => Promise<void>;
}

async function loadUserDataHelper(uid: string) {
  try {
    const [creations, favorites] = await Promise.all([
      getUserCreations(uid),
      getUserFavorites(uid),
    ]);

    const { useCollectionStore } = await import("./collection_store");
    const { useFavoritesStore } = await import("./favorites_store");

    creations.forEach((creation) => {
      useCollectionStore.getState().addUserItem(creation);
    });

    useFavoritesStore.setState({ favoriteIds: favorites });
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      loadUserData: async (uid: string) => {
        await loadUserDataHelper(uid);
      },

      initAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const firestoreUser = await getUser(firebaseUser.uid);
            const persistedCustomPhotoURL = get().user?.customPhotoURL;
            const customPhotoURL =
              firestoreUser?.customPhotoURL ??
              (firestoreUser === null ? persistedCustomPhotoURL : undefined);
            set({
              user: {
                uid: firebaseUser.uid,
                displayName: firestoreUser?.displayName || firebaseUser.displayName || "User",
                email: firebaseUser.email || "",
                photoURL: firebaseUser.photoURL || undefined,
                customPhotoURL: customPhotoURL || undefined,
                pendingDeletion: firestoreUser?.pendingDeletion,
                deletionScheduledAt: firestoreUser?.deletionScheduledAt,
                deletionExecuteAt: firestoreUser?.deletionExecuteAt,
              },
              isAuthenticated: true,
              isLoading: false,
            });

            await loadUserDataHelper(firebaseUser.uid);
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });
      },

      signInWithGoogle: async () => {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;

          await createOrUpdateUser(user.uid, {
            displayName: user.displayName || "User",
            email: user.email || "",
            photoURL: user.photoURL,
            customPhotoURL: null,
          });

          const firestoreUser = await getUser(user.uid);

          set({
            user: {
              uid: user.uid,
              displayName: firestoreUser?.displayName || user.displayName || "User",
              email: user.email || "",
              photoURL: user.photoURL || undefined,
              customPhotoURL: firestoreUser?.customPhotoURL || undefined,
              pendingDeletion: firestoreUser?.pendingDeletion,
              deletionScheduledAt: firestoreUser?.deletionScheduledAt,
              deletionExecuteAt: firestoreUser?.deletionExecuteAt,
            },
            isAuthenticated: true,
          });

          await loadUserDataHelper(user.uid);
        } catch (error) {
          console.error("Google sign in error:", error);
          throw error;
        }
      },

      signOut: async () => {
        try {
          await firebaseSignOut(auth);
          set({ user: null, isAuthenticated: false });

          const { useCollectionStore } = await import("./collection_store");
          const { useFavoritesStore } = await import("./favorites_store");

          useCollectionStore.setState({ userItems: [] });
          useFavoritesStore.setState({ favoriteIds: [] });
        } catch (error) {
          console.error("Sign out error:", error);
          throw error;
        }
      },

      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) {
          return;
        }

        await createOrUpdateUser(currentUser.uid, data);

        if (data.displayName) {
          setCachedUserDisplayName(currentUser.uid, data.displayName);
        }

        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      scheduleAccountDeletion: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          return;
        }

        try {
          await scheduleAccountDeletion(currentUser.uid);

          // Update local state
          const updatedUser = await getUser(currentUser.uid);
          if (updatedUser) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    pendingDeletion: updatedUser.pendingDeletion,
                    deletionScheduledAt: updatedUser.deletionScheduledAt,
                    deletionExecuteAt: updatedUser.deletionExecuteAt,
                  }
                : null,
            }));
          }
        } catch (error) {
          console.error("Schedule account deletion error:", error);
          throw error;
        }
      },

      cancelAccountDeletion: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          return;
        }

        try {
          await cancelAccountDeletion(currentUser.uid);

          // Update local state
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  pendingDeletion: false,
                  deletionScheduledAt: null,
                  deletionExecuteAt: null,
                }
              : null,
          }));
        } catch (error) {
          console.error("Cancel account deletion error:", error);
          throw error;
        }
      },

      deleteAccount: async () => {
        const currentUser = get().user;
        const firebaseUser = auth.currentUser;

        if (!currentUser || !firebaseUser) {
          return;
        }

        try {
          // Delete custom avatar if exists
          if (currentUser.customPhotoURL) {
            await deleteAvatar(currentUser.uid, currentUser.customPhotoURL);
          }

          // Delete all user data from Firestore
          await deleteAllUserData(currentUser.uid);

          // Delete Firebase Auth user
          await firebaseDeleteUser(firebaseUser);

          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error("Delete account error:", error);
          throw error;
        }
      },
    }),
    {
      name: "rtttl-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
