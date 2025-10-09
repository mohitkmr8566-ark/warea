require("dotenv").config();
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.resolve(process.env.SERVICE_ACCOUNT));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

(async () => {
  try {
    const docRef = await db.collection("testConnection").add({
      message: "Firebase Admin SDK connected successfully!",
      timestamp: new Date(),
    });
    console.log("✅ Firestore write successful! Document ID:", docRef.id);
  } catch (err) {
    console.error("❌ Firebase connection failed:", err);
  }
})();
