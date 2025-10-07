// pages/admin/dashboard.js
import AdminLayout from "@/components/admin/AdminLayout";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/router";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

const ADMIN_EMAIL = "mohitkmr8566@gmail.com"; // keep same admin email you used

function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString()}`;
}

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    days.push(key);
  }
  return days;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // real-time listener for all orders
  useEffect(() => {
    // require admin
    if (!user) return;

    if (user?.email !== ADMIN_EMAIL) {
      // just redirect non-admin to home or show message
      router.push("/");
      return;
    }

    setLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(arr);
        setLoading(false);
      },
      (err) => {
        console.error("orders listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Derived stats
  const stats = useMemo(() => {
    const s = {
      totalOrders: 0,
      totalRevenue: 0,
      byStatus: {},
      topProducts: {}, // id -> { name, qty, revenue }
      dailySales: {}, // YYYY-MM-DD -> amount
    };

    const days = getLastNDays(30);
    days.forEach((d) => (s.dailySales[d] = 0));

    orders.forEach((o) => {
      s.totalOrders += 1;
      s.totalRevenue += Number(o.total || 0);

      const st = o.status || "Processing";
      s.byStatus[st] = (s.byStatus[st] || 0) + 1;

      (o.items || []).forEach((it) => {
        const id = it.id || it.name;
        if (!s.topProducts[id]) {
          s.topProducts[id] = { name: it.name || id, qty: 0, revenue: 0 };
        }
        s.topProducts[id].qty += Number(it.qty || 1);
        s.topProducts[id].revenue += Number(it.qty || 1) * Number(it.price || 0);
      });

      // createdAt may be Firestore Timestamp or a string; guard it
      let dt = null;
      if (o.createdAt && o.createdAt.toDate) {
        dt = o.createdAt.toDate();
      } else if (typeof o.createdAt === "string" || o.createdAt instanceof String) {
        dt = new Date(o.createdAt);
      } else if (o.createdAt?.seconds) {
        dt = new Date(o.createdAt.seconds * 1000);
      } else {
        dt = o.createdAt ? new Date(o.createdAt) : new Date();
      }
      const key = dt.toISOString().slice(0, 10);
      if (s.dailySales[key] === undefined) s.dailySales[key] = 0;
      s.dailySales[key] += Number(o.total || 0);
    });

    // create arrays for charts
    const dailySalesArray = Object.entries(s.dailySales)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amt]) => ({ date, amount: Math.round(amt) }));

    const topProductsArray = Object.values(s.topProducts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    return {
      totalOrders: s.totalOrders,
      totalRevenue: s.totalRevenue,
      byStatus: s.byStatus,
      dailySalesArray,
      topProductsArray,
    };
  }, [orders]);

  if (!user) {
    return (
      <div className="page-container py-12 text-center">
        <p className="text-gray-500">Please login as admin to view the dashboard.</p>
      </div>
    );
  }

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="page-container py-12 text-center">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard — Warea</title>
      </Head>

      <div className="page-container py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading data...</div>
        ) : (
          <>
            {/* Top cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-semibold">{stats.totalOrders}</div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-2xl font-semibold">{formatCurrency(stats.totalRevenue)}</div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Orders (by status)</div>
                <div className="mt-2 flex flex-col gap-1">
                  {["Pending","Processing","Shipped","Out for Delivery","Delivered"].map((st) => (
                    <div key={st} className="flex justify-between text-sm">
                      <div>{st}</div>
                      <div className="font-semibold">{stats.byStatus[st] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Top Product</div>
                {stats.topProductsArray.length ? (
                  <div className="mt-2">
                    <div className="font-medium">{stats.topProductsArray[0].name}</div>
                    <div className="text-sm text-gray-500">Qty: {stats.topProductsArray[0].qty}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">No sales yet</div>
                )}
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-2">Sales - Last 30 days</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailySalesArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-2">Top Products (by qty)</h3>
                {stats.topProductsArray.length ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.topProductsArray.map((p) => ({ name: p.name, qty: p.qty }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="qty" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No products sold yet.</p>
                )}
              </div>
            </div>

            {/* Orders list preview */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 10).map((o) => (
                  <div key={o.id} className="flex justify-between items-center border rounded p-3">
                    <div>
                      <div className="font-semibold">
                        <a href={`/order/${o.id}`} className="text-blue-600 hover:underline">Order #{o.id.slice(0,6)}</a>
                      </div>
                      <div className="text-sm text-gray-500">
                        {o.customer?.name} • {o.customer?.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(o.total)}</div>
                      <div className="text-xs text-gray-500">{o.status || "Processing"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
