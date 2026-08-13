import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import {
  createOrUpdateUser,
  getUser,
  deleteAllUserData,
  deleteAvatar,
} from "../services/firestore_service";

interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  customPhotoURL?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; customPhotoURL?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      initAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const firestoreUser = await getUser(firebaseUser.uid);
            set({
              user: {
                uid: firebaseUser.uid,
                displayName: firestoreUser?.displayName || firebaseUser.displayName || "User",
                email: firebaseUser.email || "",
                photoURL: firebaseUser.photoURL || undefined,
                customPhotoURL: firestoreUser?.customPhotoURL || undefined,
              },
              isAuthenticated: true,
              isLoading: false,
            });
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
            },
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Google sign in error:", error);
          throw error;
        }
      },

      signOut: async () => {
        try {
          await firebaseSignOut(auth);
          set({ user: null, isAuthenticated: false });
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

        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
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
