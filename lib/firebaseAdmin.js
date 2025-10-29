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

export const adminDb = admin.firestore();
