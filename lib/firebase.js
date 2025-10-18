// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

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

// Flag to control emulator usage in the browser
const USE_EMULATOR =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" ||
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";

// ---- Initialize app (safe singleton) ---------------------------------------
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Use initializeFirestore so we can pass dev-friendly settings that
 * avoid WebSocket transport (the source of the INTERNAL ASSERTION error).
 * These settings affect only the browser SDK.
 */
const db =
  // If Firestore already exists (HMR), reuse it; otherwise create with settings
  getApps().length && (() => {
    try {
      return getFirestore(app);
    } catch (_) {
      return initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true, // <— key: prefer long-polling
        useFetchStreams: false,
      });
    }
  })() ||
  initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalAutoDetectLongPolling: true, // <— key: prefer long-polling
    useFetchStreams: false,
  });

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ---- Connect to emulators (browser only) -----------------------------------
if (typeof window !== "undefined" && USE_EMULATOR) {
  // Avoid reconnecting on HMR
  if (!window.__WAREA_EMU__) {
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      // If you add Storage or Functions emulators, connect them here too.
      // connectFunctionsEmulator(getFunctions(app), "127.0.0.1", 5001)
      window.__WAREA_EMU__ = true;
      // console.info("[Warea] Connected to Firebase emulators");
    } catch (e) {
      console.warn("[Warea] Emulator connect skipped/failed:", e?.message || e);
    }
  }
}

// ---- Analytics (browser only & supported) -----------------------------------
let analytics;
if (typeof window !== "undefined") {
  analyticsSupported().then((ok) => {
    if (ok) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, auth, googleProvider, analytics };
export default app;
