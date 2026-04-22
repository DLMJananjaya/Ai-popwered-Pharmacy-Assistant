"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AppSidebar from "../components/AppSidebar";
import { AlertTriangle } from "lucide-react";

// ✅ TYPE
type InventoryItem = {
  id: string;
  name: string;
  strength: string;
  qty: number;
  expireDate: string;
  unitPrice: number;
};

// ✅ INITIAL DATA (fixed date format)
const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "1",
    name: "Paracetamol",
    strength: "250mg",
    qty: 156,
    expireDate: "2028-03-30",
    unitPrice: 2.5,
  },
  {
    id: "2",
    name: "Serenace",
    strength: "10mg",
    qty: 54,
    expireDate: "2026-03-10",
    unitPrice: 15.0,
  },
  {
    id: "3",
    name: "Ferup Plus",
    strength: "100ml",
    qty: 2,
    expireDate: "2028-01-20",
    unitPrice: 430.0,
  },
];

// ✅ SAFE DATE FUNCTION
const isWithinDays = (dateText: string, days: number) => {
  const date = new Date(dateText);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const diff = date.getTime() - now.getTime();

  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);

  const [itemName, setItemName] = useState("");
  const [strength, setStrength] = useState("");
  const [qty, setQty] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [removeName, setRemoveName] = useState("");

  // ✅ ALERTS
  const lowStockItems = useMemo(() => items.filter((i) => i.qty <= 5), [items]);

  const expiringSoonItems = useMemo(
    () => items.filter((i) => isWithinDays(i.expireDate, 180)),
    [items]
  );

  // ✅ CLEAR
  const clearForm = () => {
    setItemName("");
    setStrength("");
    setQty("");
    setExpireDate("");
    setUnitPrice("");
    setRemoveName("");
  };

  // ✅ ADD ITEM
  const addItem = () => {
    if (!itemName || !strength || !qty || !expireDate || !unitPrice) {
      alert("Please fill all fields");
      return;
    }

    const parsedQty = Number(qty);
    const parsedPrice = Number(unitPrice);

    if (isNaN(parsedQty) || isNaN(parsedPrice)) {
      alert("Invalid numbers");
      return;
    }

    if (parsedQty < 0 || parsedPrice < 0) {
      alert("Values must be positive");
      return;
    }

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      strength: strength.trim(),
      qty: parsedQty,
      expireDate,
      unitPrice: parsedPrice,
    };

    setItems((prev) => [...prev, newItem]);
    clearForm();
  };

  // ✅ REMOVE (remove only one item)
  const removeItem = () => {
    const target = removeName.trim().toLowerCase();

    if (!target) {
      alert("Enter item name");
      return;
    }

    setItems((prev) => {
      const index = prev.findIndex(
        (item) => item.name.toLowerCase() === target
      );

      if (index === -1) return prev;

      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });

    setRemoveName("");
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
        <AppSidebar active="inventory" />

        <main className="flex-1 p-6 overflow-auto">
          <div className="grid xl:grid-cols-[1fr_260px] gap-4">

            {/* LEFT */}
            <section className="space-y-4">

              {/* ADD FORM */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-center mb-4">
                  Add / Remove Items
                </h2>

                <div className="grid grid-cols-5 gap-2">
                  <input
                    placeholder="Name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="border p-2"
                  />
                  <input
                    placeholder="Strength"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="border p-2"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="border p-2"
                  />
                  <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="border p-2"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="border p-2"
                  />
                </div>

                <input
                  placeholder="Remove by name"
                  value={removeName}
                  onChange={(e) => setRemoveName(e.target.value)}
                  className="border p-2 w-full mt-3"
                />

                <div className="flex gap-2 mt-3 justify-end">
                  <button onClick={clearForm} className="bg-gray-400 text-white px-4 py-2">
                    Clear
                  </button>
                  <button onClick={removeItem} className="bg-red-500 text-white px-4 py-2">
                    Remove
                  </button>
                  <button onClick={addItem} className="bg-teal-500 text-white px-4 py-2">
                    Add
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-center mb-4">Stock</h2>

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
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* RIGHT PANEL */}
            <aside className="bg-white p-4 rounded-xl shadow h-fit">
              <h3 className="text-xl font-bold text-red-600 mb-3">⚠ Warnings</h3>

              {/* LOW STOCK */}
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

              {/* EXPIRY */}
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
    </>
  );
}