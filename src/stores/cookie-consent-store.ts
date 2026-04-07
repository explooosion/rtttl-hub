import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CookieConsentState {
  hasConsented: boolean;
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: { preferences: boolean; statistics: boolean }) => void;
  resetConsent: () => void;
}

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      hasConsented: false,
      necessary: true,
      preferences: false,
      statistics: false,
      acceptAll: () =>
        set({ hasConsented: true, necessary: true, preferences: true, statistics: true }),
      rejectAll: () =>
        set({ hasConsented: true, necessary: true, preferences: false, statistics: false }),
      savePreferences: (prefs) => set({ hasConsented: true, necessary: true, ...prefs }),
      resetConsent: () =>
        set({ hasConsented: false, necessary: true, preferences: false, statistics: false }),
    }),
    { name: "rtttl-cookie-consent" },
  ),
);
