// lib/firebaseAdmin.js
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountString = process.env.SERVICE_ACCOUNT;

  if (!serviceAccountString) {
    throw new Error("❌ Missing SERVICE_ACCOUNT env variable");
  }

  const serviceAccount = JSON.parse(serviceAccountString);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();

export { admin, adminDb };
export default admin; // ✅ Fix for "does not contain a default export"
