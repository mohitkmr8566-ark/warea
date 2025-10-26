// lib/firebaseAdmin.js
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // SERVICE_ACCOUNT points to a JSON file path (relative to project root)
  const serviceAccountPath = process.env.SERVICE_ACCOUNT || "./serviceAccountKey.json";
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
