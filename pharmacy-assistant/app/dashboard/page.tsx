'use client';

import React, { useState, useEffect } from 'react';
import AppSidebar from '../components/AppSidebar';
import TopHeader from '../components/TopHeader';

interface InventorySubItem {
  name: string;
  qty: number;
  unitPrice: number;
  _id?: string;
}

interface BillingItem {
  id: string;
  items: InventorySubItem[];
  amountPayable: number;
  paymentMethod: string;
  createdAt: string;
}

export default function DashboardPage() {
    const [salesRecords, setSalesRecords] = useState<BillingItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [fromDate, setFromDate] = useState("2026-05-13");
    const [toDate, setToDate] = useState("2026-06-27");
    
    const [stats, setStats] = useState({ noOfSales: 0, prescriptionReads: 0, totalSales: "Rs. 0.00", revenue: "Rs. 0.00" });
    const [chartData, setChartData] = useState<Array<{ day: string; value: number; height: string }>>([]);

    useEffect(() => {
        async function fetchDashboardMetrics() {
            try {
                setLoading(true);
                const response = await fetch(`/api/dashboard?from=${fromDate}&to=${toDate}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    setStats({
                        noOfSales: data.summary.noOfSales,
                        prescriptionReads: data.summary.prescriptionReads,
                        totalSales: data.summary.totalSales,
                        revenue: data.summary.revenue
                    });
                    
                    setSalesRecords(data.records);
                }
            } catch (error) {
                console.error("Failed pulling dashboard metrics:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchDashboardMetrics();
    }, [fromDate, toDate]);

    
    useEffect(() => {
        if (!fromDate || !toDate) return;

        const start = new Date(`${fromDate}T00:00:00.000Z`);
        const end = new Date(`${toDate}T23:59:59.999Z`);
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const salesMap: Record<string, number> = {};
        
        let mode: "day" | "week" | "month" = "day";
        if (totalDays > 10 && totalDays <= 90) {
            mode = "week";
        } else if (totalDays > 90) {
            mode = "month";
        }

        
        const getWeekKey = (date: Date) => {
            const target = new Date(date.getTime());
            const dayNr = (date.getUTCDay() + 6) % 7; 
            target.setUTCDate(target.getUTCDate() - dayNr + 3);
            const firstThursday = target.getTime();
            target.setUTCMonth(0, 1);
            if (target.getUTCDay() !== 4) {
                target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
            }
            const weekNum = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
            const monthLabel = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
            return `Wk ${weekNum} (${monthLabel})`;
        };

      
        salesRecords.forEach(item => {
            if (!item.createdAt) return;
            const d = new Date(item.createdAt);

            if (mode === "day") {
                const localDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
                salesMap[localDateStr] = (salesMap[localDateStr] || 0) + 1;
            } else if (mode === "week") {
                const weekLabel = getWeekKey(d);
                salesMap[weekLabel] = (salesMap[weekLabel] || 0) + 1;
            } else {
                
                const monthLabel = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
                salesMap[monthLabel] = (salesMap[monthLabel] || 0) + 1;
            }
        });

        const structuredChart = [];
        let loop = new Date(start.getTime());

        if (mode === "day") {
            let safetyCounter = 0;
            while (loop <= end && safetyCounter < 31) {
                const localDateStr = `${loop.getUTCFullYear()}-${String(loop.getUTCMonth() + 1).padStart(2, '0')}-${String(loop.getUTCDate()).padStart(2, '0')}`;
                const count = salesMap[localDateStr] || 0;
                
                structuredChart.push({
                    day: `${String(loop.getUTCMonth() + 1).padStart(2, '0')}/${String(loop.getUTCDate()).padStart(2, '0')}`,
                    value: count,
                    height: count > 0 ? `${Math.min(count * 20 + 15, 90)}%` : "5%"
                });
                loop.setUTCDate(loop.getUTCDate() + 1);
                safetyCounter++;
            }
        } else if (mode === "week") {
            const addedWeeks = new Set<string>();
            const extendedEnd = new Date(end.getTime() + (7 * 86400000));
            
            while (loop <= extendedEnd) {
                const weekLabel = getWeekKey(loop);
                
                if (!addedWeeks.has(weekLabel) && loop <= extendedEnd) {
                    addedWeeks.add(weekLabel);
                    const count = salesMap[weekLabel] || 0;
                    
                    structuredChart.push({
                        day: weekLabel,
                        value: count,
                        height: count > 0 ? `${Math.min(count * 20 + 15, 90)}%` : "5%"
                    });
                }
                loop.setUTCDate(loop.getUTCDate() + 7);
            }
        } else {
            const addedMonths = new Set<string>();
            while (loop <= end) {
                
                const monthLabel = loop.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
                if (!addedMonths.has(monthLabel)) {
                    addedMonths.add(monthLabel);
                    const count = salesMap[monthLabel] || 0;
                    structuredChart.push({
                        day: monthLabel,
                        value: count,
                        height: count > 0 ? `${Math.min(count * 20 + 15, 90)}%` : "5%"
                    });
                }
                loop.setUTCMonth(loop.getUTCMonth() + 1);
            }
        }

        setChartData(structuredChart);
    }, [salesRecords, fromDate, toDate]);

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
            <AppSidebar active="dashboard" />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <TopHeader />
                <main className="flex-1 overflow-y-auto p-6 z-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Date Filters */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-black">From :</span>
                                <input type="date" className="border border-black rounded px-2 py-1 text-sm bg-transparent" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-black">To :</span>
                                <input type="date" className="border border-black rounded px-2 py-1 text-sm bg-transparent" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>
                            {loading && <span className="text-xs text-teal-600 animate-pulse font-medium">Syncing database values...</span>}
                        </div>

                        {/* Stats Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="No Of Sales" value={stats.noOfSales.toString()} />
                            <StatCard title="Prescription Reads" value={stats.prescriptionReads.toString()} />
                            <StatCard title="Total Sales" value={stats.totalSales} subValue={true} />
                            <StatCard title="Revenue" value={stats.revenue} subValue={true} />
                        </div>

                        {/* Sales Analytics Chart */}
                        <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-bold text-center text-black mb-6">Sales Analytics</h2>
                            <div className="h-64 flex items-end justify-between gap-2 px-2 md:px-6 border-l border-b border-black relative">
                                {chartData.map((bar, index) => (
                                    <ChartBar key={index} day={bar.day} value={bar.value} height={bar.height} />
                                ))}
                            </div>
                        </div>

                        {/* Sales Details Table */}
                        <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-bold text-center text-black mb-6">Sales Details</h2>
                            <div className="bg-white border border-black overflow-x-auto rounded-lg">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="border-b border-black text-sm bg-gray-100">
                                            <th className="p-3 border-r border-black font-bold text-center w-32">Date</th>
                                            <th className="p-3 border-r border-black font-bold text-center w-56">ID</th>
                                            <th className="p-3 border-r border-black font-bold text-center">Items</th>
                                            <th className="p-3 border-r border-black font-bold text-center w-36">Price</th>
                                            <th className="p-3 font-bold text-center w-40">Payment Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {salesRecords.map((row, index) => (
                                            <tr key={index} className="border-b border-gray-300 align-top hover:bg-gray-50/80">
                                                <td className="p-3 border-r border-black text-center whitespace-nowrap">
                                                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                {/* Clear layout for ID field */}
                                                <td className="p-3 border-r border-black font-mono text-[11px] text-center break-all max-w-[14rem]">
                                                    {row.id}
                                                </td>
                                                <td className="p-3 border-r border-black">
                                                    <div className="flex flex-col gap-1">
                                                        {row.items?.map((item, idx) => (
                                                            <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs w-fit text-left">
                                                                {typeof item === 'object' && item !== null
                                                                    ? `${item.name || 'Unknown'} (x${item.qty || 1})`
                                                                    : String(item)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-black font-semibold text-center whitespace-nowrap">
                                                    Rs. {(row.amountPayable || 0).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-center capitalize font-medium text-gray-600">
                                                    {(row.paymentMethod || 'cash').replace('_', ' ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

interface StatCardProps { title: string; value: string; subValue?: boolean }
function StatCard({ title, value, subValue = false }: StatCardProps) {
    return (
        <div className="bg-gray-100/80 rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-32">
            <h3 className="text-sm font-bold text-black mb-2">{title}</h3>
            <p className={`font-bold text-black ${subValue ? 'text-xl' : 'text-3xl'}`}>{value}</p>
        </div>
    );
}

interface ChartBarProps { day: string; value: number; height: string }
function ChartBar({ day, value, height }: ChartBarProps) {
    return (
        <div className="flex flex-col items-center justify-end h-full w-full group">
            <div className="w-full bg-[#00A99D] rounded-t-sm hover:opacity-80 transition-all relative min-h-[5px]" style={{ height: height }}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold text-black whitespace-nowrap bg-white/80 px-1 rounded shadow-sm">{value}</span>
            </div>
            <span className="mt-2 text-[9px] md:text-xs font-bold text-black text-center block w-full truncate" title={day}>{day}</span>
        </div>
    );
}