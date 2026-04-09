import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  displayName: string;
  email: string;
  photoURL?: string;
  hasPassword?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
  setPassword: (password: string) => Promise<{ success: boolean }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      // Mock: set password for the first time
      setPassword: async (_password) => {
        // TODO: Replace with Firebase Auth API
        await new Promise((r) => setTimeout(r, 500));
        set((state) => ({
          user: state.user ? { ...state.user, hasPassword: true } : null,
        }));
        return { success: true };
      },
      // Mock: change existing password
      changePassword: async (_oldPassword, _newPassword) => {
        // TODO: Replace with Firebase Auth API
        await new Promise((r) => setTimeout(r, 500));
        return { success: true };
      },
    }),
    {
      name: "rtttl-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
