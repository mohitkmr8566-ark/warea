// lib/reviews.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Add a review to products/{productId}/reviews (client-side)
 * Returns the created doc ref (promise).
 */
export async function addReview(productId, user, rating, comment) {
  if (!productId) throw new Error("Missing productId");
  if (!user || !user.email) throw new Error("User must be signed in");

  const reviewsRef = collection(db, "products", productId, "reviews");
  return addDoc(reviewsRef, {
    userId: user.email,
    rating: Number(rating) || 0,
    comment: comment || "",
    createdAt: serverTimestamp(),
    userName: user.displayName || user.email,
  });
}
