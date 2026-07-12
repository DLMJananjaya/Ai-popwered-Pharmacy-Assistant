"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import AppSidebar from "../components/AppSidebar";
import { AlertTriangle, Loader2 } from "lucide-react";
import TopHeader from "../components/TopHeader";

type InventoryItem = {
  id: string;
  name: string;
  strength: string;
  qty: number;
  expireDate: string;
  unitPrice: number;
};

const isWithinDays = (dateText: string, days: number) => {
  const date = new Date(dateText);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemName, setItemName] = useState("");
  const [strength, setStrength] = useState("");
  const [qty, setQty] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [removeName, setRemoveName] = useState("");

  // ── Load inventory from DB on mount ───────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ── Alerts ────────────────────────────────────────────────────────────────
  const lowStockItems = useMemo(() => items.filter((i) => i.qty <= 5), [items]);
  const expiringSoonItems = useMemo(
    () => items.filter((i) => isWithinDays(i.expireDate, 180)),
    [items]
  );

  const clearForm = () => {
    setItemName(""); setStrength(""); setQty("");
    setExpireDate(""); setUnitPrice(""); setRemoveName("");
  };

  // ── Add item (saves to DB) ─────────────────────────────────────────────────
  const addItem = async () => {
    if (!itemName || !strength || !qty || !expireDate || !unitPrice) {
      alert("Please fill all fields");
      return;
    }
    const parsedQty = Number(qty);
    const parsedPrice = Number(unitPrice);
    if (isNaN(parsedQty) || isNaN(parsedPrice) || parsedQty < 0 || parsedPrice < 0) {
      alert("Invalid numbers — must be positive");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemName.trim(),
          strength: strength.trim(),
          qty: parsedQty,
          expireDate,
          unitPrice: parsedPrice,
        }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [newItem, ...prev]);
        clearForm();
      } else {
        alert("Failed to add item");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Remove item by name (deletes from DB) ──────────────────────────────────
  const removeItem = async () => {
    const target = removeName.trim().toLowerCase();
    if (!target) { alert("Enter item name"); return; }

    const found = items.find((i) => i.name.toLowerCase() === target);
    if (!found) { alert("Item not found"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: found.id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== found.id));
        setRemoveName("");
      } else {
        alert("Failed to remove item");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
        <AppSidebar active="inventory" />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <TopHeader />
          <main className="flex-1 p-6 overflow-auto z-10">
            <div className="grid xl:grid-cols-[1fr_260px] gap-4">

              {/* LEFT */}
              <section className="space-y-4">

                {/* ADD / REMOVE FORM */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="text-xl font-bold text-center mb-4">Add / Remove Items</h2>

                  <div className="grid grid-cols-5 gap-2">
                    <input placeholder="Name"     value={itemName}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)}   className="border p-2" />
                    <input placeholder="Strength" value={strength}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStrength(e.target.value)}   className="border p-2" />
                    <input type="number" placeholder="Qty"   value={qty}        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)}        className="border p-2" />
                    <input type="date"            value={expireDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpireDate(e.target.value)} className="border p-2" />
                    <input type="number" placeholder="Price" value={unitPrice}  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitPrice(e.target.value)}  className="border p-2" />
                  </div>

                  <input
                    placeholder="Remove by name"
                    value={removeName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoveName(e.target.value)}
                    className="border p-2 w-full mt-3"
                  />

                  <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={clearForm}   disabled={saving} className="bg-gray-400 text-white px-4 py-2 disabled:opacity-50">Clear</button>
                    <button onClick={removeItem}  disabled={saving} className="bg-red-500  text-white px-4 py-2 disabled:opacity-50">
                      {saving ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}Remove
                    </button>
                    <button onClick={addItem}     disabled={saving} className="bg-teal-500 text-white px-4 py-2 disabled:opacity-50">
                      {saving ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}Add
                    </button>
                  </div>
                </div>

                {/* TABLE */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="text-xl font-bold text-center mb-4">Stock</h2>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={32} className="animate-spin text-teal-500" />
                    </div>
                  ) : (
                    <table className="w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Strength</th>
                          <th className="border p-2">Qty</th>
                          <th className="border p-2">Expire</th>
                          <th className="border p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="border p-2">{item.name}</td>
                            <td className="border p-2">{item.strength}</td>
                            <td className="border p-2">{item.qty}</td>
                            <td className="border p-2">{item.expireDate}</td>
                            <td className="border p-2">{item.unitPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center p-6 text-gray-400">
                              No items — add your first stock item above
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* RIGHT — WARNINGS */}
              <aside className="bg-white p-4 rounded-xl shadow h-fit">
                <h3 className="text-xl font-bold text-red-600 mb-3">⚠ Warnings</h3>

                <div className="mb-4">
                  <p className="font-semibold">Low Stock:</p>
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((item) => (
                      <p key={item.id}>
                        <AlertTriangle className="inline mr-1 text-yellow-500" size={14} />
                        {item.name} ({item.qty})
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400">No issues</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold">Expiring Soon:</p>
                  {expiringSoonItems.length > 0 ? (
                    expiringSoonItems.map((item) => (
                      <p key={item.id}>
                        <AlertTriangle className="inline mr-1 text-yellow-500" size={14} />
                        {item.name} → {item.expireDate}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400">No issues</p>
                  )}
                </div>
              </aside>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}