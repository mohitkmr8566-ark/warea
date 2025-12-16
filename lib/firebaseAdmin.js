// lib/firebaseAdmin.js — hardened init (supports SERVICE_ACCOUNT_PATH or SERVICE_ACCOUNT)
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

let initialized = false;
let serviceAccount = null;

/**
 * Try these in order:
 * 1. SERVICE_ACCOUNT_PATH -> file containing JSON
 * 2. SERVICE_ACCOUNT -> single-line JSON in env (with \\n for private_key)
 * 3. Fallback: attempt admin.initializeApp() with no args (ADC or emulator)
 */

try {
  // 1) SERVICE_ACCOUNT_PATH
  if (process.env.SERVICE_ACCOUNT_PATH) {
    const p = path.resolve(process.cwd(), process.env.SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      serviceAccount = JSON.parse(raw);
      console.log("✅ Firebase Admin: loaded service account from path:", p);
    } else {
      console.warn("⚠️ Firebase Admin: SERVICE_ACCOUNT_PATH set but file not found:", p);
    }
  }

  // 2) SERVICE_ACCOUNT (env JSON string)
  if (!serviceAccount && process.env.SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
      console.log("✅ Firebase Admin: parsed SERVICE_ACCOUNT from env");
    } catch (e) {
      console.warn("⚠️ Firebase Admin: failed to parse SERVICE_ACCOUNT env JSON:", e.message);
    }
  }

  // If serviceAccount contains private_key with escaped newlines, convert them
  if (serviceAccount && serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  // Initialize admin
  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      initialized = true;
      console.log("✅ Firebase Admin initialized with service account");
    } else {
      // Last resort: try initializeApp() without explicit creds (may work with ADC or emulator)
      try {
        admin.initializeApp();
        initialized = true;
        console.log("✅ Firebase Admin initialized with default credentials (ADC/emulator)");
      } catch (e) {
        // Not fatal here; we'll log and export admin (but adminDb will be null)
        console.warn("⚠️ Firebase Admin not initialized: no service account and ADC init failed:", e.message);
      }
    }
  } else {
    initialized = true;
    console.log("ℹ️ Firebase Admin already initialized");
  }
} catch (err) {
  console.error("🔥 Firebase Admin initialization error (unexpected):", err && err.stack ? err.stack : err);
}

// Export admin and adminDb (adminDb may be null if not initialized)
// Export admin and adminDb (guaranteed initialized or throws)
let adminDb;

if (!initialized) {
  throw new Error(
    "🔥 Firebase Admin not initialized — SERVICE_ACCOUNT or SERVICE_ACCOUNT_PATH missing"
  );
}

adminDb = admin.firestore();

export { admin, adminDb };
export default admin;
