"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  _id: string;
  name: string;
  email: string;
  pharmacyName?: string;
  documentUrl?: string;
  isAdminVerified: boolean;
  isVerified: boolean;
  createdAt: string;
  role: string;
};

const statusBadge = (verified: boolean) =>
  verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      ✓ Approved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      ⏳ Pending
    </span>
  );

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setActionLoading(userId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchUsers(); // Refresh list
      } else {
        setMessage(data.message || "Action failed.");
      }
    } catch {
      setMessage("Server error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#00A99D] flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
            <p className="text-xs text-gray-500">User Verification Management</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-[#00A99D] hover:underline font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "pending", label: "⏳ Pending Approval" },
            { key: "verified", label: "✓ Approved" },
            { key: "all", label: "All Users" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === tab.key ? "#00A99D" : "white",
                color: filter === tab.key ? "white" : "#374151",
                border: `1px solid ${filter === tab.key ? "#00A99D" : "#e5e7eb"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchUsers}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: message.toLowerCase().includes("success") || message.toLowerCase().includes("approved") || message.toLowerCase().includes("rejected")
                ? "#f0fdf4"
                : "#fef2f2",
              color: message.toLowerCase().includes("success") || message.toLowerCase().includes("approved") || message.toLowerCase().includes("rejected")
                ? "#15803d"
                : "#b91c1c",
              border: "1px solid",
              borderColor: message.toLowerCase().includes("success") || message.toLowerCase().includes("approved") || message.toLowerCase().includes("rejected")
                ? "#bbf7d0"
                : "#fecaca",
            }}
          >
            {message}
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-medium">No users in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00A99D] to-[#10B981] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-base">{user.name}</h3>
                    {statusBadge(user.isAdminVerified)}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{user.role}</span>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.pharmacyName && (
                    <p className="text-xs text-gray-400 mt-0.5">🏪 {user.pharmacyName}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registered: {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* Document Preview */}
                <div className="flex items-center gap-3 shrink-0">
                  {user.documentUrl ? (
                    <button
                      onClick={() => setPreviewDoc(user.documentUrl!)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      📄 View Document
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No document</span>
                  )}

                  {/* Actions */}
                  {!user.isAdminVerified && (
                    <>
                      <button
                        onClick={() => handleAction(user._id, "approve")}
                        disabled={actionLoading === user._id}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {actionLoading === user._id ? "..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(user._id, "reject")}
                        disabled={actionLoading === user._id}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {actionLoading === user._id ? "..." : "✕ Reject"}
                      </button>
                    </>
                  )}

                  {user.isAdminVerified && (
                    <button
                      onClick={() => handleAction(user._id, "reject")}
                      disabled={actionLoading === user._id}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e: React.SyntheticEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Verification Document</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
              {previewDoc.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc}
                  className="w-full h-full min-h-[60vh] rounded"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewDoc}
                  alt="Verification Document"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg"
                />
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <a
                href={previewDoc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00A99D] hover:underline font-medium"
              >
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
