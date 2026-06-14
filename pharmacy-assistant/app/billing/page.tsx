"use client";

import React, { useMemo, useState, useEffect } from "react";
import AppSidebar from "../components/AppSidebar";
import { MinusCircle, PlusCircle, Loader2, CheckCircle } from "lucide-react";
import TopHeader from "../components/TopHeader";

type BillItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
};

// Inventory item shape returned from /api/inventory
type InvItem = {
  id: string;
  name: string;
  unitPrice: number;
};

export default function BillingPage() {
  const [billItems, setBillItems]     = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [catalog, setCatalog]         = useState<InvItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [paying, setPaying]           = useState(false);
  const [paid, setPaid]               = useState(false);

  // ── Load item catalog from this user's inventory ───────────────────────────
  useEffect(() => {
    (async () => {
      setCatalogLoading(true);
      try {
        const res = await fetch("/api/inventory");
        if (res.ok) {
          const data: InvItem[] = await res.json();
          setCatalog(data);
          if (data.length > 0) setSelectedItemId(data[0].id);
        }
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const total = billItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = total >= 500 ? 45 : 0;
    const amountPayable = total - discount;
    return { total, discount, amountPayable };
  }, [billItems]);

  const dateTime = useMemo(() => {
    const now = new Date();
    const date = now.toLocaleDateString("en-CA").replaceAll("-", "/");
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  }, []);

  const updateQty = (id: string, action: "inc" | "dec") => {
    setBillItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = action === "inc" ? item.qty + 1 : Math.max(0, item.qty - 1);
        return { ...item, qty: nextQty };
      })
    );
  };

  const addRow = () => {
    if (selectedQty <= 0 || !selectedItemId) return;
    const invItem = catalog.find((i) => i.id === selectedItemId);
    if (!invItem) return;

    // If already in bill, just increase qty
    const existing = billItems.find((i) => i.name === invItem.name);
    if (existing) {
      setBillItems((prev) =>
        prev.map((i) => i.name === invItem.name ? { ...i, qty: i.qty + selectedQty } : i)
      );
    } else {
      setBillItems((prev) => [
        ...prev,
        { id: `${invItem.id}-${Date.now()}`, name: invItem.name, qty: selectedQty, unitPrice: invItem.unitPrice },
      ]);
    }
    setSelectedQty(1);
  };

  // ── Pay: save billing record to DB ─────────────────────────────────────────
  const handlePay = async () => {
    if (billItems.length === 0) { alert("Add items to the bill first"); return; }
    setPaying(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: billItems.map(({ name, qty, unitPrice }) => ({ name, qty, unitPrice })),
          total:         totals.total,
          discount:      totals.discount,
          amountPayable: totals.amountPayable,
          paymentMethod,
        }),
      });
      if (res.ok) {
        setPaid(true);
        setBillItems([]);
        setTimeout(() => setPaid(false), 3000);
      } else {
        alert("Failed to save billing record");
      }
    } finally {
      setPaying(false);
    }
  };

  const formatPrice = (value: number) => value.toFixed(2);
  const emptyRows = Math.max(0, 10 - billItems.length);

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 text-gray-900 overflow-hidden">
        <AppSidebar active="billing" />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 z-10">
            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm md:p-6">
              <h1 className="mb-4 text-center text-3xl font-bold">Payment</h1>

              {/* Success banner */}
              {paid && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 font-semibold">
                  <CheckCircle size={18} /> Payment recorded successfully!
                </div>
              )}

              {/* Item selector */}
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px_110px] md:items-end">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Select Item</label>
                    {catalogLoading ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={16} className="animate-spin" /> Loading inventory…
                      </div>
                    ) : catalog.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        No inventory items yet — add stock in Inventory first.
                      </p>
                    ) : (
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                      >
                        {catalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} — Rs.{item.unitPrice.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
                    <input
                      type="number" min={1} value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={addRow}
                    disabled={catalog.length === 0}
                    className="rounded-lg bg-[#10b7ab] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0ea99e] disabled:opacity-50"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              {/* Bill table + payment panel */}
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
                      {billItems.map((item) => (
                        <tr key={item.id}>
                          <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                          <td className="border border-gray-300 px-2 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => updateQty(item.id, "dec")} className="rounded-full text-gray-700 transition hover:text-black" aria-label={`Decrease ${item.name}`}>
                                <MinusCircle size={16} />
                              </button>
                              <span className="min-w-6 text-center font-semibold">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, "inc")} className="rounded-full text-gray-700 transition hover:text-black" aria-label={`Increase ${item.name}`}>
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
                      <input type="radio" name="payment" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                    </label>
                    <label className="flex items-center gap-2">
                      <span>Cash</span>
                      <input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
                    </label>
                  </div>

                  <div className="space-y-2 text-sm">
                    <InfoRow label="Total"         value={formatPrice(totals.total)} />
                    <InfoRow label="Discount"      value={`- ${formatPrice(totals.discount)}`} />
                    <InfoRow label="Amount Payable" value={formatPrice(totals.amountPayable)} />
                    <InfoRow label="Date"          value={dateTime.date} />
                    <InfoRow label="Time"          value={dateTime.time} />
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={paying || billItems.length === 0}
                    className="mt-8 w-full rounded-lg bg-[#10b7ab] py-3 text-lg font-bold text-white transition hover:bg-[#0ea99e] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paying ? <Loader2 size={18} className="animate-spin" /> : null}
                    {paying ? "Processing…" : "Pay"}
                  </button>
                </aside>
              </div>
            </div>
          </main>
        </div>
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
