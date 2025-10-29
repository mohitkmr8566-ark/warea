"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collectionGroup,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { Loader2, Check, Trash2, AlertTriangle, RotateCw } from "lucide-react";

/**
 * Safely convert Firestore createdAt to JS Date string.
 * Accepts: Firestore Timestamp (has .toDate or .seconds), numeric ms, or ISO string.
 */
function formatCreatedAt(raw) {
  if (!raw) return "";
  try {
    if (raw.toDate) return raw.toDate().toLocaleString();
    if (raw.seconds) return new Date(raw.seconds * 1000).toLocaleString();
    const num = Number(raw);
    if (!Number.isNaN(num)) return new Date(num).toLocaleString();
    return new Date(raw).toLocaleString();
  } catch {
    return "";
  }
}

export default function AdminReviewsPage() {
  // get loading so we don't run queries until auth finishes
  const { user, loading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [busyIds, setBusyIds] = useState(new Set());

  // Only consider admin true once auth finished loading
  const isAdmin =
    !loading &&
    user &&
    ["mohitkmr8566@gmail.com", "warea.admin@gmail.com"].includes(user.email);

  useEffect(() => {
    // wait until auth settles and we know isAdmin; otherwise don't run snapshot/read
    if (!isAdmin) {
      setReviews([]); // clear if user isn't admin
      setLoadingLocal(false);
      return;
    }

    (async () => {
      setLoadingLocal(true);
      try {
        // fetch all flagged reviews across all products
        const q = query(
          collectionGroup(db, "reviews"),
          where("flagged", "==", true),
          orderBy("flags", "desc")
        );
        const snap = await getDocs(q);

        const all = snap.docs.map((d) => {
          const path = d.ref.path; // e.g. "products/{productId}/reviews/{reviewId}"
          const parts = path.split("/");
          // safer extraction: find 'products' parent if present
          let productId = null;
          const prodIndex = parts.indexOf("products");
          if (prodIndex >= 0 && parts.length > prodIndex + 1) {
            productId = parts[prodIndex + 1];
          } else if (parts.length >= 2) {
            // fallback (best-effort)
            productId = parts[1];
          }
          const createdAtRaw = d.data().createdAt ?? d.data().created_at ?? null;
          return {
            id: d.id,
            ...d.data(),
            path,
            productId,
            createdAtRaw,
            createdAtLabel: formatCreatedAt(createdAtRaw),
          };
        });

        setReviews(all);
      } catch (e) {
        console.error("load flagged reviews error:", e);
        toast.error("Failed to load reviews (see console)");
      } finally {
        setLoadingLocal(false);
      }
    })();
  }, [isAdmin]);

  // helper to mark busy
  const setBusy = (id, val) => {
    setBusyIds((prev) => {
      const copy = new Set(prev);
      if (val) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  async function handleApprove(r) {
    if (!r?.path) return;
    setBusy(r.id, true);
    try {
      const ref = doc(db, r.path);
      await updateDoc(ref, { approved: true, flagged: false, flags: 0 });
      toast.success("Review approved ✅");
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error("approve error:", e);
      toast.error("Error approving review");
    } finally {
      setBusy(r.id, false);
    }
  }

  // Unflag / Resolve without deleting
  async function handleResolve(r) {
    if (!r?.path) return;
    setBusy(r.id, true);
    try {
      const ref = doc(db, r.path);
      await updateDoc(ref, { flagged: false, flags: 0 });
      toast.success("Review resolved (unflagged) ✅");
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error("resolve error:", e);
      toast.error("Error resolving review");
    } finally {
      setBusy(r.id, false);
    }
  }

  async function handleDelete(r) {
    if (!r?.path) return;
    if (!confirm("Delete this review permanently?")) return;
    setBusy(r.id, true);
    try {
      await deleteDoc(doc(db, r.path));
      toast.success("Review deleted ❌");
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error("delete review error:", e);
      toast.error("Error deleting review");
    } finally {
      setBusy(r.id, false);
    }
  }

  if (!user && !loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p>Please log in as admin to view this page.</p>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-red-500">
        <AlertTriangle className="mr-2" /> Access Denied: Admins only
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        🧾 Review Moderation Dashboard
      </h1>

      {loadingLocal ? (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-600 text-center">No flagged reviews found 🎉</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{r.userName || r.userId || "Customer"}</p>
                  <p className="text-sm text-gray-500">{r.createdAtLabel}</p>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{r.comment || "(no comment)"}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Flags: <strong>{Number(r.flags || 0)}</strong> • Rating: {Number(r.rating || 0)}/5 • Product:{" "}
                    {r.productId ? (
                      <Link href={`/product/${r.productId}`} className="text-blue-600 hover:underline">
                        View Product
                      </Link>
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(r)}
                    className="p-2 bg-green-100 hover:bg-green-200 rounded-full"
                    title="Approve Review"
                    disabled={busyIds.has(r.id)}
                    aria-disabled={busyIds.has(r.id)}
                  >
                    {busyIds.has(r.id) ? <RotateCw className="animate-spin" size={16} /> : <Check size={16} className="text-green-700" />}
                  </button>

                  <button
                    onClick={() => handleResolve(r)}
                    className="p-2 bg-amber-100 hover:bg-amber-200 rounded-full"
                    title="Resolve (unflag)"
                    disabled={busyIds.has(r.id)}
                  >
                    ✓
                  </button>

                  <button
                    onClick={() => handleDelete(r)}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-full"
                    title="Delete Review"
                    disabled={busyIds.has(r.id)}
                  >
                    <Trash2 size={16} className="text-red-700" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
