"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AppSidebar from "../components/AppSidebar";
import { AlertTriangle } from "lucide-react";

type InventoryItem = {
  name: string;
  strength: string;
  qty: number;
  expireDate: string;
  unitPrice: number;
};

const INITIAL_ITEMS: InventoryItem[] = [
  { name: "Paracetamol", strength: "250mg", qty: 156, expireDate: "2028/03/30", unitPrice: 2.5 },
  { name: "Serenace", strength: "10mg", qty: 54, expireDate: "2026/03/10", unitPrice: 15.0 },
  { name: "Ferup Plus", strength: "100ml", qty: 2, expireDate: "2028/01/20", unitPrice: 430.0 },
];

const isWithinDays = (dateText: string, days: number) => {
  const date = new Date(dateText.replaceAll("/", "-"));
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  return daysDiff >= 0 && daysDiff <= days;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [itemName, setItemName] = useState("");
  const [strength, setStrength] = useState("");
  const [qty, setQty] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [removeName, setRemoveName] = useState("");

  const lowStockItems = useMemo(() => items.filter((item) => item.qty <= 5), [items]);
  const expiringSoonItems = useMemo(
    () => items.filter((item) => isWithinDays(item.expireDate, 180)),
    [items]
  );

  const clearForm = () => {
    setItemName("");
    setStrength("");
    setQty("");
    setExpireDate("");
    setUnitPrice("");
    setRemoveName("");
  };

  const addItem = () => {
    if (!itemName || !strength || !qty || !expireDate || !unitPrice) {
      window.alert("Please fill all fields before adding an item.");
      return;
    }

    const parsedQty = Number(qty);
    const parsedPrice = Number(unitPrice);
    if (Number.isNaN(parsedQty) || Number.isNaN(parsedPrice)) {
      window.alert("Quantity and Unit Price must be valid numbers.");
      return;
    }

    const newItem: InventoryItem = {
      name: itemName.trim(),
      strength: strength.trim(),
      qty: parsedQty,
      expireDate,
      unitPrice: parsedPrice,
    };
    setItems((prev) => [...prev, newItem]);
    clearForm();
  };

  const removeItem = () => {
    const target = removeName.trim().toLowerCase();
    if (!target) {
      window.alert("Enter an item name to remove.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.name.toLowerCase() !== target));
    setRemoveName("");
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)] bg-[#f3f4f6] text-gray-900">
        <AppSidebar active="inventory" />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="mb-3 text-center text-2xl font-bold">Add/Remove Items</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2">Name</th>
                        <th className="border border-gray-300 px-3 py-2">mg/ml</th>
                        <th className="border border-gray-300 px-3 py-2">Qty</th>
                        <th className="border border-gray-300 px-3 py-2">Expire Date</th>
                        <th className="border border-gray-300 px-3 py-2">Unit Price[Rs]</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1">
                          <input
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Item name"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            value={strength}
                            onChange={(e) => setStrength(e.target.value)}
                            placeholder="250mg / 100ml"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0"
                            type="number"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            value={expireDate}
                            onChange={(e) => setExpireDate(e.target.value)}
                            type="date"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full rounded border border-gray-200 px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <input
                  value={removeName}
                  onChange={(e) => setRemoveName(e.target.value)}
                  placeholder="Enter item name to remove"
                  className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                />

                <div className="mt-3 flex justify-end gap-3">
                  <button
                    onClick={clearForm}
                    className="rounded-lg bg-slate-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
                  >
                    Clear
                  </button>
                  <button
                    onClick={removeItem}
                    className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    Remove
                  </button>
                  <button
                    onClick={addItem}
                    className="rounded-lg bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="mb-3 text-center text-2xl font-bold">Stock</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2">Name</th>
                        <th className="border border-gray-300 px-3 py-2">mg/ml</th>
                        <th className="border border-gray-300 px-3 py-2">Qty</th>
                        <th className="border border-gray-300 px-3 py-2">Expire Date</th>
                        <th className="border border-gray-300 px-3 py-2">Unit Price[Rs]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={`${item.name}-${item.expireDate}`}>
                          <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.strength}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.qty}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.expireDate}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 px-3 py-8 text-center text-gray-400">
                            No stock items available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-3xl font-bold">Warnings!</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-1 font-semibold text-gray-700">Low Stock Alert:</p>
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((item) => (
                      <p key={item.name} className="text-gray-600">
                        <AlertTriangle size={14} className="mr-1 inline text-amber-500" />
                        {item.name} is running low. Only {item.qty} units remain.
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500">No low stock items.</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 font-semibold text-gray-700">Expiry Alert:</p>
                  {expiringSoonItems.length > 0 ? (
                    expiringSoonItems.map((item) => (
                      <p key={`${item.name}-exp`} className="text-gray-600">
                        <AlertTriangle size={14} className="mr-1 inline text-amber-500" />
                        {item.name} will expire on {item.expireDate}.
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500">No near-expiry items.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
