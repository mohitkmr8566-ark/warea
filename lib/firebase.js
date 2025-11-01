// lib/firebase.js (Optimized & Tree-Shakable)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

// ✅ Only import analytics when needed (dynamic import inside browser only)
let analytics; // will load later if required

// ---- Config (from .env.local) ----------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ---- Initialize Firebase App (Singleton) -----------------------------------
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firestore with safe fallback & long-polling fix for local dev
let db;
try {
  db = getFirestore(app);
} catch (_) {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
  });
}

// ✅ Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Emulator support (only in browser & only if env true)
const USE_EMULATOR =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" ||
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";

if (typeof window !== "undefined" && USE_EMULATOR) {
  if (!window.__WAREA_EMU__) {
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      window.__WAREA_EMU__ = true;
    } catch (err) {
      console.warn("[Warea] Emulator connection skipped:", err?.message || err);
    }
  }
}

// ✅ Load Analytics *only* if supported & only in browser (lazy loaded)
async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  if (await isSupported()) {
    analytics = getAnalytics(app);
    return analytics;
  }
  return null;
}

export { app, db, auth, googleProvider, analytics, initAnalytics };
