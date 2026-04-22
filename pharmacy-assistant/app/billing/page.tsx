"use client";

import React, { useMemo, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import Navbar from "../components/Navbar";
import { MinusCircle, PlusCircle } from "lucide-react";

type BillItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
};

const ITEM_CATALOG: Record<string, number> = {
  Paracetamol: 2.5,
  Serenace: 15.0,
  "Ferup Plus": 430.0,
};

const INITIAL_ITEMS: BillItem[] = [
  { id: "b1", name: "Paracetamol", qty: 10, unitPrice: 2.5 },
  { id: "b2", name: "Serenace", qty: 6, unitPrice: 15.0 },
  { id: "b3", name: "Ferup Plus", qty: 1, unitPrice: 430.0 },
];

export default function BillingPage() {
  const [items, setItems] = useState<BillItem[]>(INITIAL_ITEMS);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [selectedItem, setSelectedItem] = useState<keyof typeof ITEM_CATALOG>("Paracetamol");
  const [selectedQty, setSelectedQty] = useState<number>(1);

  const totals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = total >= 500 ? 45 : 0;
    const amountPayable = total - discount;
    return { total, discount, amountPayable };
  }, [items]);

  const dateTime = useMemo(() => {
    const now = new Date();
    const date = now.toLocaleDateString("en-CA").replaceAll("-", "/");
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  }, []);

  const updateQty = (id: string, action: "inc" | "dec") => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = action === "inc" ? item.qty + 1 : Math.max(0, item.qty - 1);
        return { ...item, qty: nextQty };
      })
    );
  };

  const addRow = () => {
    if (selectedQty <= 0) return;
    const unitPrice = ITEM_CATALOG[selectedItem];
    setItems((prev) => [
      ...prev,
      {
        id: `${selectedItem}-${Date.now()}`,
        name: selectedItem,
        qty: selectedQty,
        unitPrice,
      },
    ]);
    setSelectedQty(1);
  };

  const formatPrice = (value: number) => value.toFixed(2);

  const emptyRows = Math.max(0, 10 - items.length);

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 text-gray-900">
        <AppSidebar active="billing" />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm md:p-6">
            <h1 className="mb-4 text-center text-3xl font-bold">Payment</h1>

            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px_110px] md:items-end">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Select Item</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value as keyof typeof ITEM_CATALOG)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                  >
                    {Object.keys(ITEM_CATALOG).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                  />
                </div>
                <button
                  onClick={addRow}
                  className="rounded-lg bg-[#10b7ab] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0ea99e]"
                >
                  Add Row
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <section className="overflow-x-auto rounded-lg border border-gray-400">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-400 px-3 py-2">Item</th>
                      <th className="border border-gray-400 px-3 py-2">Qty</th>
                      <th className="border border-gray-400 px-3 py-2">Unit Price</th>
                      <th className="border border-gray-400 px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, "dec")}
                              className="rounded-full text-gray-700 transition hover:text-black"
                              aria-label={`Decrease ${item.name}`}
                            >
                              <MinusCircle size={16} />
                            </button>
                            <span className="min-w-6 text-center font-semibold">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, "inc")}
                              className="rounded-full text-gray-700 transition hover:text-black"
                              aria-label={`Increase ${item.name}`}
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{formatPrice(item.unitPrice)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: emptyRows }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="h-10">
                        <td className="border border-gray-300" />
                        <td className="border border-gray-300" />
                        <td className="border border-gray-300" />
                        <td className="border border-gray-300" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <aside className="rounded-lg border border-gray-300 p-4">
                <h2 className="mb-4 text-xl font-bold">Payment Option :</h2>
                <div className="mb-5 flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2">
                    <span>Credit Card</span>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Cash</span>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                  </label>
                </div>

                <div className="space-y-2 text-sm">
                  <InfoRow label="Total" value={formatPrice(totals.total)} />
                  <InfoRow label="Discount" value={`- ${formatPrice(totals.discount)}`} />
                  <InfoRow label="Amount Payable" value={formatPrice(totals.amountPayable)} />
                  <InfoRow label="Date" value={dateTime.date} />
                  <InfoRow label="Time" value={dateTime.time} />
                </div>

                <button className="mt-8 w-full rounded-lg bg-[#10b7ab] py-3 text-lg font-bold text-white transition hover:bg-[#0ea99e]">
                  Pay
                </button>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label} :</span>
      <span>{value}</span>
    </div>
  );
}
