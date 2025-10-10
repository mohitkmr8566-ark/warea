// pages/admin/migrate-products.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { isAdmin } from "@/lib/admin";
import AdminLayout from "@/components/admin/AdminLayout";
import Head from "next/head";
import toast from "react-hot-toast";

export default function MigrateProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [toMigrate, setToMigrate] = useState([]);
  const [withBackup, setWithBackup] = useState([]);
  const [migrating, setMigrating] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return;
      if (!isAdmin(user)) {
        router.push("/");
        return;
      }

      try {
        const snap = await getDocs(collection(db, "products"));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const legacy = all.filter(
          (p) =>
            !p.images &&
            (p.image || p.image_url || p.image_public_id)
        );

        const backups = all.filter((p) => p._backup);

        setProducts(all);
        setToMigrate(legacy);
        setWithBackup(backups);
      } catch (err) {
        console.error("Failed to load products:", err);
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user]);

  const handleMigrate = async () => {
    if (!confirm("Are you sure you want to migrate all old products?")) return;

    setMigrating(true);
    let migratedCount = 0;

    for (const p of toMigrate) {
      try {
        const ref = doc(db, "products", p.id);

        const oldImage =
          p.image?.url ||
          p.image_url ||
          (typeof p.image === "string" ? p.image : null);
        const oldPublicId =
          p.image?.public_id || p.image_public_id || null;

        if (!oldImage) continue;

        const newImages = [
          { url: oldImage, public_id: oldPublicId || "" },
        ];

        await updateDoc(ref, {
          images: newImages,
          _backup: {
            image: p.image || null,
            image_url: p.image_url || null,
            image_public_id: p.image_public_id || null,
          },
          updatedAt: serverTimestamp(),
        });

        migratedCount++;
      } catch (err) {
        console.error("Migration failed for", p.id, err);
      }
    }

    toast.success(`Migrated ${migratedCount} products ✅`);
    setMigrating(false);
    setDone(true);
  };

  const handleRevert = async () => {
    if (!confirm("⚠️ Are you sure you want to revert to backup?")) return;

    setReverting(true);
    let revertedCount = 0;

    for (const p of withBackup) {
      try {
        const ref = doc(db, "products", p.id);
        const backup = p._backup;

        await updateDoc(ref, {
          image: backup.image || null,
          image_url: backup.image_url || null,
          image_public_id: backup.image_public_id || null,
          images: null,
          updatedAt: serverTimestamp(),
        });

        revertedCount++;
      } catch (err) {
        console.error("Revert failed for", p.id, err);
      }
    }

    toast.success(`Reverted ${revertedCount} products 🔄`);
    setReverting(false);
    setDone(false);
  };

  if (!user)
    return (
      <div className="page-container py-12 text-center">
        Please sign in as admin.
      </div>
    );

  if (!isAdmin(user))
    return (
      <div className="page-container py-12 text-center text-red-600">
        Access denied. Admin only.
      </div>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Admin — Product Migration</title>
      </Head>

      <div className="page-container py-8">
        <h1 className="text-3xl font-bold mb-6">🧩 Product Migration Tool</h1>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
              <p className="text-gray-700 mb-4">
                This tool upgrades legacy image fields into the new{" "}
                <code className="bg-gray-100 px-1 rounded mx-1">images[]</code>{" "}
                format and allows you to revert safely.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="mb-2">
                    <strong>Total products:</strong> {products.length}
                  </p>
                  <p className="mb-4 text-yellow-700">
                    <strong>Need migration:</strong> {toMigrate.length}
                  </p>

                  {toMigrate.length > 0 && (
                    <button
                      onClick={handleMigrate}
                      disabled={migrating}
                      className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
                    >
                      {migrating ? "Migrating..." : "Run Migration"}
                    </button>
                  )}
                </div>

                <div>
                  <p className="mb-2">
                    <strong>Products with Backup:</strong> {withBackup.length}
                  </p>

                  {withBackup.length > 0 && (
                    <button
                      onClick={handleRevert}
                      disabled={reverting}
                      className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition"
                    >
                      {reverting ? "Reverting..." : "Revert Migration"}
                    </button>
                  )}
                </div>
              </div>

              {done && (
                <p className="text-green-600 mt-4">
                  ✅ Migration completed successfully!
                </p>
              )}
            </div>

            {toMigrate.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-4 border border-gray-100">
                <h3 className="font-semibold mb-3">
                  Products Detected for Migration:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 max-h-64 overflow-y-auto">
                  {toMigrate.map((p) => (
                    <li key={p.id} className="border-b pb-1">
                      <span className="font-medium">{p.title}</span> —{" "}
                      <span className="text-gray-500">
                        {p.category || "Uncategorized"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
