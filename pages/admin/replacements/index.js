// pages/admin/replacements/index.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

/* ---------------- Admin config ---------------- */
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

/* ---------------- Status helpers ---------------- */
const STATUSES = [
  "requested",
  "approved",
  "in_progress",
  "pickup_scheduled",
  "replacement_shipped",
  "completed",
  "rejected",
];

const statusLabel = (s) =>
  ({
    requested: "Requested",
    approved: "Approved",
    in_progress: "In Progress",
    pickup_scheduled: "Pickup Scheduled",
    replacement_shipped: "Replacement Shipped",
    completed: "Completed",
    rejected: "Rejected",
  }[s] || s);

const statusClass = (s) =>
  ({
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    pickup_scheduled: "bg-teal-100 text-teal-800",
    replacement_shipped: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }[s] || "bg-gray-100 text-gray-700");

/* ---------------- Small utils ---------------- */
function fmtDate(val) {
  try {
    if (!val) return "—";
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function timeAgo(val) {
  try {
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

function pathOrderId(path) {
  // orders/{orderId}/replacements/{repId}
  const parts = path.split("/");
  const i = parts.indexOf("orders");
  return i >= 0 ? parts[i + 1] : null;
}

/* ---------------- Page ---------------- */
export default function AdminReplacementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // UI state
  const [qText, setQText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p className="text-gray-600">Please log in with an admin account.</p>
      </div>
    );
  }
  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-600">
            Your account (<span className="font-medium">{user.email}</span>) is not authorized to view this page.
          </p>
        </div>
      </div>
    );
  }

  // Realtime replacements feed
  useEffect(() => {
    const q = query(collectionGroup(db, "replacements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const out = [];
        const jobs = snap.docs.map(async (d) => {
          const orderId = pathOrderId(d.ref.path);
          let order = null;
          if (orderId) {
            try {
              const os = await getDoc(doc(db, "orders", orderId));
              if (os.exists()) order = { id: os.id, ...os.data() };
            } catch {
              /* ignore */
            }
          }
          out.push({ id: d.id, orderId, ...d.data(), _order: order });
        });
        await Promise.allSettled(jobs);
        setRows(out);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load replacements");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Derived metrics + filtering
  const metrics = useMemo(() => {
    const counts = Object.fromEntries(["all", ...STATUSES].map((s) => [s, 0]));
    rows.forEach((r) => {
      counts.all++;
      counts[r.status || "requested"] = (counts[r.status || "requested"] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (statusFilter !== "all") {
      list = list.filter((r) => (r.status || "requested") === statusFilter);
    }
    if (qText.trim()) {
      const t = qText.toLowerCase();
      list = list.filter((r) => {
        const o = r._order;
        return (
          (r.orderId || "").toLowerCase().includes(t) ||
          (r.userId || "").toLowerCase().includes(t) ||
          (r.reason || "").toLowerCase().includes(t) ||
          (r.note || "").toLowerCase().includes(t) ||
          (o?.customer?.name || "").toLowerCase().includes(t) ||
          (o?.customer?.phone || "").toLowerCase().includes(t)
        );
      });
    }
    return list;
  }, [rows, statusFilter, qText]);

  // Status change with history + timestamp track
  async function setStatus(row, nextStatus) {
    try {
      const ref = doc(db, "orders", row.orderId, "replacements", row.id);
      await updateDoc(ref, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        [`statusTimestamps.${nextStatus}`]: serverTimestamp(),
        history: arrayUnion({
          at: serverTimestamp(),
          by: user.email,
          to: nextStatus,
        }),
      });
      toast.success(`Status → ${statusLabel(nextStatus)}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <>
      <Head>
        <title>Admin · Replacement Requests — Warea</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold">Replacement Requests</h1>
            <p className="text-gray-500 text-sm">
              Manage customer replacement requests. Approve, schedule pickup, and mark completion.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Top metrics (Hybrid: small cards) */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {["all", ...STATUSES].map((key) => (
            <div key={key} className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500 capitalize">
                {key === "all" ? "Total" : statusLabel(key)}
              </div>
              <div className="text-2xl font-semibold">{metrics[key] || 0}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {["all", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={[
                  "px-3 py-1.5 rounded-full text-sm border",
                  statusFilter === s ? "bg-black text-white border-black" : "hover:bg-gray-50",
                ].join(" ")}
              >
                {s === "all" ? "All" : statusLabel(s)}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Search by order, user, phone, reason…"
            className="w-full lg:w-80 border rounded-lg px-3 py-2"
          />
        </div>

        {/* HYBRID LIST: cards on mobile, table on desktop */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No replacement requests found.</div>
        ) : (
          <>
            {/* Cards (mobile) */}
            <div className="grid gap-3 md:hidden">
              {filtered.map((r) => {
                const o = r._order;
                return (
                  <div key={`${r.orderId}_${r.id}`} className="bg-white rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-500">Order</div>
                        <div className="font-semibold">#{(r.orderId || "").slice(0, 8)}</div>
                        <div className="text-xs text-gray-500 mt-1">{fmtDate(r.createdAt)} · {timeAgo(r.createdAt)}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass(r.status || "requested")}`}>
                        {statusLabel(r.status || "requested")}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Customer</div>
                        <div className="text-sm font-medium">
                          {o?.customer?.name || o?.userId || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{o?.customer?.phone || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Reason</div>
                        <div className="text-sm">{r.reason || "—"}</div>
                      </div>
                    </div>

                    {r.note && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Note</div>
                        <div className="text-sm text-gray-700">{r.note}</div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/orders/${r.orderId}`}
                        className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                      >
                        View Order
                      </Link>
                      <a
                        href={`/api/invoice/${r.orderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                      >
                        Invoice
                      </a>

                      {/* Quick actions */}
                      {r.status !== "approved" && r.status !== "completed" && r.status !== "rejected" && (
                        <button
                          onClick={() => setStatus(r, "approved")}
                          className="px-3 py-1.5 rounded-md bg-black text-white text-sm hover:bg-gray-800"
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== "rejected" && r.status !== "completed" && (
                        <button
                          onClick={() => setStatus(r, "rejected")}
                          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                        >
                          Reject
                        </button>
                      )}

                      {/* Next step select */}
                      <select
                        className="px-3 py-1.5 rounded-md border text-sm bg-white"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) setStatus(r, val);
                        }}
                      >
                        <option value="">Next step…</option>
                        {STATUSES.filter((s) => s !== (r.status || "requested")).map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table (desktop) */}
            <div className="hidden md:block overflow-x-auto bg-white border rounded-2xl shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Reason</th>
                    <th className="text-left px-4 py-3">Note</th>
                    <th className="text-left px-4 py-3">Created</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const o = r._order;
                    return (
                      <tr key={`${r.orderId}_${r.id}`} className="border-t">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-gray-900">#{(r.orderId || "").slice(0, 8)}</div>
                          <div className="flex gap-2 mt-1">
                            <Link
                              href={`/admin/orders/${r.orderId}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Order
                            </Link>
                            <a
                              href={`/api/invoice/${r.orderId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Invoice
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {o?.customer ? (
                            <>
                              <div className="font-medium text-gray-900">{o.customer.name || o.userId || "—"}</div>
                              <div className="text-xs text-gray-500">{o.customer.phone || "—"}</div>
                            </>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {r.reason || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="max-w-[360px] text-gray-700">{r.note || "—"}</div>
                        </td>
                        <td className="px-4 py-3 align-top text-gray-600">
                          <div>{fmtDate(r.createdAt)}</div>
                          <div className="text-xs">{timeAgo(r.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass(
                              r.status || "requested"
                            )}`}
                          >
                            {statusLabel(r.status || "requested")}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            {r.status !== "approved" && r.status !== "completed" && r.status !== "rejected" && (
                              <button
                                onClick={() => setStatus(r, "approved")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                                title="Approve"
                              >
                                Approve
                              </button>
                            )}
                            {r.status !== "rejected" && r.status !== "completed" && (
                              <button
                                onClick={() => setStatus(r, "rejected")}
                                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                                title="Reject"
                              >
                                Reject
                              </button>
                            )}
                            <select
                              className="px-3 py-1.5 rounded border bg-white"
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) setStatus(r, val);
                              }}
                            >
                              <option value="">More…</option>
                              {STATUSES.filter((s) => s !== (r.status || "requested")).map((s) => (
                                <option key={s} value={s}>
                                  {statusLabel(s)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tips */}
            <div className="mt-6 text-xs text-gray-500">
              <p>
                Suggested flow: <span className="font-medium">requested → approved → pickup_scheduled → replacement_shipped → completed</span>
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
