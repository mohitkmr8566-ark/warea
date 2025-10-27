/**
 * 🧭 Firebase Functions (v2) — Warea Project
 */
const { setGlobalOptions } = require("firebase-functions/v2/options");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
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
 * Test at: http://127.0.0.1:5001/{your-project-id}/asia-south1/helloWorld
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

/**
 * 🪄 Trigger — Auto Sync Discount % on Product Edit
 * Runs whenever a product document is created or updated
 */
exports.syncDiscountOnProductWrite = onDocumentWritten("products/{productId}", async (event) => {
  const after = event.data?.after?.data();
  const before = event.data?.before?.data();
  const productId = event.params.productId;

  if (!after) return null;

  const { mrp, price } = after;
  if (!mrp || !price || isNaN(mrp) || isNaN(price) || mrp <= 0) return null;

  const newDiscount = Math.max(0, Math.round(((mrp - price) / mrp) * 100));
  const oldDiscount = before?.discountPercent || 0;

  if (newDiscount !== oldDiscount) {
    await db.collection("products").doc(productId).update({
      discountPercent: newDiscount,
    });
    logger.info(
      `🔁 Discount auto-sync for ${productId}: ${oldDiscount}% → ${newDiscount}%`
    );
  }

  return null;
});

/**
 * 🪄 Daily cleanup — auto deactivate expired hero slides
 */
exports.cleanUpHeroBanners = onSchedule("every 24 hours", async () => {
  logger.info("⏳ Running daily hero banner cleanup (deactivate expired)");
  const now = new Date();
  const snap = await db.collection("heroSlides").get();
  let updated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.endDate && !data.isDraft && now > new Date(data.endDate) && data.isActive) {
      await docSnap.ref.update({ isActive: false });
      updated++;
    }
  }

  logger.info(`✅ Deactivated ${updated} expired hero banners.`);
});

/**
 * 🪄 Daily activation — auto activate future hero slides
 */
exports.activateHeroBanners = onSchedule("every 24 hours", async () => {
  logger.info("⏳ Running daily hero banner activation (startDate check)");
  const now = new Date();
  const snap = await db.collection("heroSlides").get();
  let activated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (
      data.startDate &&
      !data.isDraft &&
      new Date(data.startDate) <= now &&
      !data.isActive
    ) {
      await docSnap.ref.update({ isActive: true });
      activated++;
    }
  }

  logger.info(`✅ Activated ${activated} hero banners scheduled for now.`);
});
