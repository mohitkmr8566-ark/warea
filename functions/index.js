/**
 * 🧭 Firebase Functions (v2) — Warea Project
 */
const { setGlobalOptions } = require("firebase-functions/v2/options");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// ✅ Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 🌐 Global config — limit concurrent function instances
setGlobalOptions({ maxInstances: 10 });

/**
 * ✅ Hello World (Testing Endpoint)
 * You can test it at:
 * http://127.0.0.1:5001/{your-project-id}/asia-south1/helloWorld
 */
exports.helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase Functions!");
});

/**
 * 🛍️ Trigger — On New Order Create
 * Fires when a new document is added to `/orders/{orderId}`
 */
exports.onNewOrderCreate = onDocumentCreated("orders/{orderId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.warn("⚠️ No snapshot data found for order trigger");
    return null;
  }

  const orderData = snap.data();
  const orderId = event.params.orderId;
  const userId = orderData?.userId;

  logger.info(`🆕 New order placed: ${orderId} by ${userId || "unknown user"}`);
  logger.info(`🌍 Running in ${process.env.FUNCTIONS_EMULATOR ? "EMULATOR" : "PRODUCTION"} mode`);

  // 🧪 Skip guest or invalid user
  if (!userId || userId === "guest") {
    logger.info("Guest order — skipping notification creation.");
    return null;
  }

  try {
    const notifRef = db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc();

    await notifRef.set({
      title: "🛍️ Order Placed Successfully",
      message: `Your order #${orderId.slice(0, 8)} has been placed successfully.`,
      orderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      type: "order",
      env: process.env.FUNCTIONS_EMULATOR ? "development" : "production",
    });

    logger.info(`✅ Notification created for user: ${userId}`);
  } catch (error) {
    logger.error("❌ Failed to create notification", { error: error.message });
  }

  return null;
});
