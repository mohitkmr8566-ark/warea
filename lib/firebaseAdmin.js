// lib/firebaseAdmin.js
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountString = process.env.SERVICE_ACCOUNT;

  if (!serviceAccountString) {
    throw new Error("❌ Missing SERVICE_ACCOUNT env variable");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    // 🔑 FIX: Convert escaped \n to real newlines (important for PEM format)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("🔥 Firebase Admin initialization failed:", error);
  }
}

const adminDb = admin.firestore();

export { admin, adminDb };
export default admin;
