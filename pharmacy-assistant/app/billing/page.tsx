"use client";

import React, { useMemo, useState, useEffect } from "react";
import AppSidebar from "../components/AppSidebar";
import { MinusCircle, PlusCircle, Loader2, CheckCircle, Download, Mail } from "lucide-react";
import TopHeader from "../components/TopHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type BillItem = {
  id: string;
  inventoryId: string;
  name: string;
  qty: number;
  unitPrice: number;
  availableQty: number;
  expireDate?: string; // ISO string — used for FEFO display
};

type InvItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  strength?: string;
  expireDate?: string;
};

// Location info resolved from rack layout
type RackLocation = {
  rackName: string;   // e.g. "Rack A — Common"
  rackNumber: number; // 1-based index of rack in layout
  row: number;        // 1-based
  col: number;        // 1-based
};

// Rack element from /api/rack-layout
type CanvasRack = {
  id: string;
  type: string;
  name: string;
  rows?: number;
  cols?: number;
  gridData?: Record<string, { name: string; qty: number }>;
};

/**
 * Build a map: canonical medicine name (lowercase) → RackLocation
 * Iterates every rack's gridData cells and tries to match by name substring.
 */
function buildLocationMap(elements: CanvasRack[]): Map<string, RackLocation> {
  const map = new Map<string, RackLocation>();
  const racks = elements.filter((el) => el.type === "rack");

  racks.forEach((rack, rackIdx) => {
    if (!rack.gridData) return;
    Object.entries(rack.gridData).forEach(([key, cell]) => {
      if (!cell?.name) return;
      const [rowStr, colStr] = key.split("-");
      const row = parseInt(rowStr, 10) + 1; // convert 0-based → 1-based
      const col = parseInt(colStr, 10) + 1;

      // The cell name is "paracetamol 500mg" — extract just the medicine name part
      const cellNameLower = cell.name.toLowerCase().trim();

      // Store the full cell name as the key so we can match against inventory names
      map.set(cellNameLower, {
        rackName: rack.name,
        rackNumber: rackIdx + 1,
        row,
        col,
      });
    });
  });

  return map;
}

/**
 * Find the rack location for an inventory item name.
 * Tries exact match first, then checks if the cell name starts with the item name.
 */
function findLocation(
  itemName: string,
  locationMap: Map<string, RackLocation>
): RackLocation | null {
  const needle = itemName.toLowerCase().trim();

  // 1. Exact key match
  if (locationMap.has(needle)) return locationMap.get(needle)!;

  // 2. Cell name starts with item name (e.g. "paracetamol 500mg" starts with "paracetamol")
  for (const [key, loc] of locationMap.entries()) {
    if (key.startsWith(needle + " ") || key === needle) return loc;
  }

  // 3. Item name starts with the cell key (reverse)
  for (const [key, loc] of locationMap.entries()) {
    if (needle.startsWith(key + " ") || needle === key) return loc;
  }

  return null;
}

/**
 * Returns days until expiry from an ISO date string.
 * Negative = already expired.
 */
function daysUntilExpiry(isoDate?: string): number | null {
  if (!isoDate) return null;
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns Tailwind color classes + label based on days remaining.
 */
function expiryStyle(days: number | null): { bg: string; text: string; border: string; label: string } {
  if (days === null) return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-300", label: "Unknown" };
  if (days < 0)   return { bg: "bg-red-100",    text: "text-red-700",   border: "border-red-400",   label: "EXPIRED" };
  if (days <= 30) return { bg: "bg-red-50",     text: "text-red-600",   border: "border-red-300",   label: `${days}d left` };
  if (days <= 90) return { bg: "bg-amber-50",   text: "text-amber-700", border: "border-amber-300", label: `${days}d left` };
  return           { bg: "bg-emerald-50",   text: "text-emerald-700", border: "border-emerald-300", label: `${days}d left` };
}

export default function BillingPage() {
  const [billItems, setBillItems]         = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [catalog, setCatalog]             = useState<InvItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedQty, setSelectedQty]     = useState<number>(1);
  const [paying, setPaying]               = useState(false);
  const [paid, setPaid]                   = useState(false);

  const [patientEmail, setPatientEmail]   = useState("");
  const [patientName, setPatientName]     = useState("");
  const [prescriptionMeds, setPrescriptionMeds] = useState<any[]>([]);
  const [emailing, setEmailing]           = useState(false);
  const [emailStatus, setEmailStatus]     = useState<'idle' | 'success' | 'error'>('idle');

  // Rack location lookup map
  const [locationMap, setLocationMap]     = useState<Map<string, RackLocation>>(new Map());

  // ── Load inventory + rack layout on mount ───────────────────────────────────
  useEffect(() => {
    (async () => {
      setCatalogLoading(true);
      try {
        // Fetch inventory and rack layout in parallel
        const [invRes, rackRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/rack-layout"),
        ]);

        // Build rack location map
        if (rackRes.ok) {
          const elements: CanvasRack[] = await rackRes.json();
          setLocationMap(buildLocationMap(elements));
        }

        if (invRes.ok) {
          const raw: InvItem[] = await invRes.json();

          // ── FEFO sort: earliest expiry first ──────────────────────────────
          const data = [...raw].sort((a, b) => {
            if (!a.expireDate && !b.expireDate) return 0;
            if (!a.expireDate) return 1;  // no date → push to end
            if (!b.expireDate) return -1;
            return new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime();
          });

          setCatalog(data);
          if (data.length > 0) setSelectedItemId(data[0].id);

          // Check sessionStorage for pre-populated items from prescription
          try {
            const storedMeds = sessionStorage.getItem("prescriptionMeds");
            if (storedMeds) {
              setPrescriptionMeds(JSON.parse(storedMeds));
              sessionStorage.removeItem("prescriptionMeds");
            }
            
            const storedName = sessionStorage.getItem("prescriptionPatientName");
            if (storedName) {
              setPatientName(storedName);
              sessionStorage.removeItem("prescriptionPatientName");
            }

            const stored = sessionStorage.getItem("prescriptionBillItems");
            if (stored) {
              const prescItems: Array<{ inventoryId: string; name: string; qty: number; unitPrice: number }> = JSON.parse(stored);
              sessionStorage.removeItem("prescriptionBillItems");

              const preloaded: BillItem[] = prescItems
                .map((pi) => {
                  const invItem = data.find((d) => d.id === pi.inventoryId);
                  if (!invItem) return null;
                  return {
                    id: `${pi.inventoryId}-${Date.now()}-${Math.random()}`,
                    inventoryId: pi.inventoryId,
                    name: pi.name,
                    qty: pi.qty,
                    unitPrice: pi.unitPrice,
                    availableQty: invItem.qty,
                    expireDate: invItem.expireDate,
                  } as BillItem;
                })
                .filter(Boolean) as BillItem[];

              if (preloaded.length > 0) setBillItems(preloaded);
            }
          } catch {
            // sessionStorage read failed — ignore
          }
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
        const nextQty =
          action === "inc"
            ? Math.min(item.qty + 1, item.availableQty)
            : Math.max(0, item.qty - 1);
        return { ...item, qty: nextQty };
      })
    );
  };

  const addRow = () => {
    if (selectedQty <= 0 || !selectedItemId) return;
    const invItem = catalog.find((i) => i.id === selectedItemId);
    if (!invItem) return;

    const existing = billItems.find((i) => i.inventoryId === invItem.id);
    if (existing) {
      setBillItems((prev) =>
        prev.map((i) =>
          i.inventoryId === invItem.id
            ? { ...i, qty: Math.min(i.qty + selectedQty, i.availableQty) }
            : i
        )
      );
    } else {
      setBillItems((prev) => [
        ...prev,
        {
          id: `${invItem.id}-${Date.now()}`,
          inventoryId: invItem.id,
          name: invItem.name,
          qty: Math.min(selectedQty, invItem.qty),
          unitPrice: invItem.unitPrice,
          availableQty: invItem.qty,
          expireDate: invItem.expireDate,
        },
      ]);
    }
    setSelectedQty(1);
  };

  // ── PDF Generation ─────────────────────────────────────────────────────────
  const generatePDF = (action: 'download' | 'base64' = 'download'): string | void => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 169, 157); // #00A99D
    doc.text("VAIDIA Pharmacy", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${dateTime.date} ${dateTime.time}`, 14, 28);
    if (patientName) {
      doc.text(`Patient Name: ${patientName}`, 14, 34);
    }
    
    // Bill Items
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Bill Summary", 14, 45);
    
    const tableData = billItems.map((item) => [
      item.name,
      item.qty.toString(),
      `Rs. ${formatPrice(item.unitPrice)}`,
      `Rs. ${formatPrice(item.qty * item.unitPrice)}`
    ]);
    
    autoTable(doc, {
      startY: 50,
      head: [['Item', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 169, 157] },
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal: Rs. ${formatPrice(totals.total)}`, 14, finalY);
    doc.text(`Discount: - Rs. ${formatPrice(totals.discount)}`, 14, finalY + 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Amount Payable: Rs. ${formatPrice(totals.amountPayable)}`, 14, finalY + 14);
    doc.setFont("helvetica", "normal");
    
    finalY += 30;

    // Medicines Info (Warnings/Side Effects)
    if (prescriptionMeds.length > 0) {
      const medsFound = prescriptionMeds.filter(m => m.found);
      if (medsFound.length > 0) {
        doc.addPage();
        finalY = 20;
        doc.setFontSize(16);
        doc.setTextColor(0, 169, 157);
        doc.text("Medicine Information & Warnings", 14, finalY);
        finalY += 10;
        
        medsFound.forEach((med) => {
          if (finalY > 270) {
            doc.addPage();
            finalY = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "bold");
          doc.text(med.canonical || med.input, 14, finalY);
          finalY += 6;
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          if (med.sideEffects && med.sideEffects.found) {
            doc.setTextColor(80, 80, 80);
            const commonLines = doc.splitTextToSize(`Common side effects: ${med.sideEffects.common}`, 180);
            doc.text(commonLines, 14, finalY);
            finalY += (commonLines.length * 5) + 2;
            
            if (med.sideEffects.warnings) {
              doc.setTextColor(185, 28, 28); // red
              const warnLines = doc.splitTextToSize(`Warning: ${med.sideEffects.warnings}`, 180);
              doc.text(warnLines, 14, finalY);
              finalY += (warnLines.length * 5) + 2;
            }
            
            doc.setTextColor(150, 150, 150);
            doc.text(`Source: ${med.sideEffects.source}`, 14, finalY);
            finalY += 8;
          } else {
            doc.setTextColor(150, 150, 150);
            doc.text("Side effect information not available.", 14, finalY);
            finalY += 8;
          }
          
          finalY += 4; // space between meds
        });
      }
    }

    if (action === 'download') {
      doc.save(`Invoice_${Date.now()}.pdf`);
    } else {
      return doc.output('datauristring');
    }
  };

  const handleEmailPDF = async () => {
    if (!patientEmail.trim()) {
      alert("Please enter the patient's email address.");
      return;
    }
    
    setEmailing(true);
    setEmailStatus('idle');
    
    try {
      const pdfBase64 = generatePDF('base64');
      
      const res = await fetch('/api/prescription/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientEmail.trim(),
          patientName: patientName || null,
          pdfBase64: pdfBase64,
        }),
      });

      if (!res.ok) throw new Error('Failed to send email');
      setEmailStatus('success');
    } catch (err) {
      console.error(err);
      setEmailStatus('error');
    } finally {
      setEmailing(false);
    }
  };

  // ── Pay: save billing record AND deduct inventory ──────────────────────────
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

      if (!res.ok) { alert("Failed to save billing record"); return; }

      // Deduct inventory quantities
      const deductPromises = billItems.map((item) =>
        fetch("/api/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.inventoryId, qty: Math.max(0, item.availableQty - item.qty) }),
        })
      );
      await Promise.all(deductPromises);

      setPaid(true);
      setBillItems([]);
      // Refresh catalog
      const refreshed = await fetch("/api/inventory");
      if (refreshed.ok) {
        const data: InvItem[] = await refreshed.json();
        setCatalog(data);
        if (data.length > 0) setSelectedItemId(data[0].id);
      }
      setTimeout(() => setPaid(false), 4000);
    } finally {
      setPaying(false);
    }
  };

  const removeRow = (id: string) => setBillItems((prev) => prev.filter((i) => i.id !== id));
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
                  <CheckCircle size={18} /> Payment recorded &amp; inventory updated successfully!
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedItemId(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        {catalog.map((item) => {
                          const loc = findLocation(item.name, locationMap);
                          const locLabel = loc ? ` [Rack ${loc.rackNumber} · R${loc.row} C${loc.col}]` : "";
                          const days = daysUntilExpiry(item.expireDate);
                          const expLabel = item.expireDate
                            ? ` · Exp: ${new Date(item.expireDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}${days !== null && days <= 90 ? ` ⚠` : ""}`
                            : "";
                          return (
                            <option key={item.id} value={item.id}>
                              {item.name}{locLabel}{expLabel} — Rs.{item.unitPrice.toFixed(2)} (Stock: {item.qty})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
                    <input
                      type="number" min={1} value={selectedQty}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedQty(Math.max(1, Number(e.target.value) || 1))}
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
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-400 px-3 py-2 text-left">Item</th>
                        <th className="border border-gray-400 px-3 py-2 text-center w-32">Location</th>
                        <th className="border border-gray-400 px-3 py-2 text-center w-28">Expiry</th>
                        <th className="border border-gray-400 px-3 py-2 text-center">Qty</th>
                        <th className="border border-gray-400 px-3 py-2 text-center">Unit Price</th>
                        <th className="border border-gray-400 px-3 py-2 text-right">Total</th>
                        <th className="border border-gray-400 px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item) => {
                        const loc = findLocation(item.name, locationMap);
                        const days = daysUntilExpiry(item.expireDate);
                        const eStyle = expiryStyle(days);
                        const expDateLabel = item.expireDate
                          ? new Date(item.expireDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : null;
                        return (
                          <tr key={item.id} className={`hover:bg-gray-50 transition-colors${
                            days !== null && days < 0 ? " bg-red-50" :
                            days !== null && days <= 30 ? " bg-red-50/40" :
                            days !== null && days <= 90 ? " bg-amber-50/40" : ""
                          }`}>
                            {/* Item name */}
                            <td className="border border-gray-300 px-3 py-2">
                              <div className="font-medium capitalize">{item.name}</div>
                              {item.availableQty <= item.qty && (
                                <span className="text-[10px] text-amber-600 font-semibold">max stock</span>
                              )}
                            </td>

                            {/* Rack location badge */}
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              {loc ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  {/* Rack name pill */}
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b7ab]/10 text-[#0a8a81] border border-[#10b7ab]/30 leading-tight whitespace-nowrap">
                                    {loc.rackName.split('—')[0].trim()}
                                  </span>
                                  {/* Rack# · Row · Col chips */}
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-[10px] font-bold">
                                      Rack {loc.rackNumber}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                                      R{loc.row}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                      C{loc.col}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </td>

                            {/* Expiry badge */}
                            <td className="border border-gray-300 px-2 py-2 text-center">
                              {expDateLabel ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <span className="text-[10px] text-gray-500">{expDateLabel}</span>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${eStyle.bg} ${eStyle.text} ${eStyle.border}`}>
                                    {eStyle.label}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </td>

                            {/* Quantity controls */}
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

                            <td className="border border-gray-300 px-3 py-2 text-center">Rs.{formatPrice(item.unitPrice)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right font-medium">Rs.{formatPrice(item.qty * item.unitPrice)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button
                                onClick={() => removeRow(item.id)}
                                className="text-red-400 hover:text-red-600 transition text-base leading-none"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: emptyRows }).map((_, idx) => (
                        <tr key={`empty-${idx}`} className="h-10">
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                          <td className="border border-gray-300" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Payment aside */}
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
                    <InfoRow label="Total"          value={`Rs. ${formatPrice(totals.total)}`} />
                    <InfoRow label="Discount"       value={`- Rs. ${formatPrice(totals.discount)}`} />
                    <InfoRow label="Amount Payable" value={`Rs. ${formatPrice(totals.amountPayable)}`} />
                    <InfoRow label="Date"           value={dateTime.date} />
                    <InfoRow label="Time"           value={dateTime.time} />
                  </div>

                  {/* FEFO notice */}
                  {billItems.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><strong>FEFO order applied</strong> — Items sorted by earliest expiry first.</span>
                    </div>
                  )}

                  {/* Location legend */}
                  {billItems.length > 0 && (
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Location Legend</p>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-white font-bold">Rack N</span>
                          <span className="text-gray-500">= Rack #</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">R1</span>
                          <span className="text-gray-500">= Row</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">C2</span>
                          <span className="text-gray-500">= Column</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={paying || billItems.length === 0}
                    className="mt-6 w-full rounded-lg bg-[#10b7ab] py-3 text-lg font-bold text-white transition hover:bg-[#0ea99e] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paying ? <Loader2 size={18} className="animate-spin" /> : null}
                    {paying ? "Processing…" : "Pay"}
                  </button>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Receipt & Information</h3>
                    
                    <button
                      onClick={() => generatePDF('download')}
                      disabled={billItems.length === 0}
                      className="w-full mb-3 rounded-lg border-2 border-[#10b7ab] bg-white py-2 text-sm font-bold text-[#10b7ab] transition hover:bg-[#10b7ab] hover:text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download PDF Bill
                    </button>
                    
                    <div className="flex flex-col gap-2">
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#10b7ab] focus:outline-none focus:ring-1 focus:ring-[#10b7ab]"
                      />
                      <button
                        onClick={handleEmailPDF}
                        disabled={emailing || billItems.length === 0 || !patientEmail.trim()}
                        className="w-full rounded-lg bg-gray-800 py-2 text-sm font-bold text-white transition hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {emailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        {emailing ? "Sending..." : "Email PDF Bill"}
                      </button>
                    </div>
                    
                    {emailStatus === 'success' && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Email sent successfully!
                      </p>
                    )}
                    {emailStatus === 'error' && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Failed to send email. Please try again.
                      </p>
                    )}
                  </div>
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
      <span className="text-gray-600">{label} :</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
