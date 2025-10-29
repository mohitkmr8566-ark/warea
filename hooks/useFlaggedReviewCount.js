import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";

/**
 * Expects isAdmin boolean. Returns flagged review count.
 * NOTE: don't call when auth is still loading; set isAdmin=false while loading.
 */
export function useFlaggedReviewCount(isAdmin) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If not admin, don't open snapshot
    if (!isAdmin) {
      setCount(0);
      return;
    }

    const q = query(collectionGroup(db, "reviews"), where("flagged", "==", true));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCount(snap.size);
      },
      (error) => {
        // Important: log the error to console (permission/index issues)
        console.error("useFlaggedReviewCount snapshot error:", error);
        setCount(0);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  return count;
}
