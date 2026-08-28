import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

// Note: Import connectAuthEmulator and connectStorageEmulator when needed
// import { connectAuthEmulator } from "firebase/auth";
// import { connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Firebase Emulators when enabled
const useEmulator = import.meta.env.VITE_USE_EMULATOR === "true";

if (useEmulator && import.meta.env.DEV && location.hostname === "localhost") {
  try {
    // Firestore Emulator (port 8080)
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    // Auth Emulator (port 9099) - optional, uncomment if needed
    // connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

    // Storage Emulator (port 9199) - optional, uncomment if needed
    // connectStorageEmulator(storage, "127.0.0.1", 9199);

    console.log("🔧 Connected to Firebase Emulators");
    console.log("   - Firestore: http://127.0.0.1:8080");
    console.log("   - Emulator UI: http://127.0.0.1:4000");
  } catch (error) {
    console.warn("Failed to connect to Firebase Emulators:", error);
  }
} else if (import.meta.env.DEV) {
  console.log("🌐 Connected to Firebase Production");
}

// Initialize Analytics only in production
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Cloud Functions
export const functions = getFunctions(app, "us-central1");

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
