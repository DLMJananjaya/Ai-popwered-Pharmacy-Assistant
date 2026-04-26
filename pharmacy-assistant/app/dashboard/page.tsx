import React from 'react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';

export default function DashboardPage() {
    return (
        <>
            {/* <Navbar /> */}
            <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
                <AppSidebar active="dashboard" />

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex flex-col relative overflow-hidden">

                    {/* Background Shapes (Matches your theme) */}
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-0">
                        <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full opacity-10">
                            <path d="M400,500 C200,400 300,200 500,100 L500,500 Z" fill="#00A99D" />
                        </svg>
                    </div>

                    {/* --- TOP HEADER --- */}
                    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-black">AI-Powered Pharmacy Assistant</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* User Profile */}
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden border border-gray-200">
                                    <img src="https://avatar.iran.liara.run/public/boy?username=admin" alt="User" />
                                </div>
                                <span className="text-sm font-bold text-black">User Profile</span>
                            </div>
                            {/* Logout Icon */}
                            <button className="bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    </header>

                    {/* --- SCROLLABLE DASHBOARD CONTENT --- */}
                    <main className="flex-1 overflow-y-auto p-6 z-10">
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* 1. Date Filters */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-black">From :</span>
                                    <input type="date" className="border border-black rounded px-2 py-1 text-sm bg-transparent" defaultValue="2025-02-01" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-black">To :</span>
                                    <input type="date" className="border border-black rounded px-2 py-1 text-sm bg-transparent" defaultValue="2025-02-01" />
                                </div>
                            </div>

                            {/* 2. Stat Cards Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="No Of Sales" value="126" />
                                <StatCard title="Prescription Reads" value="64" />
                                <StatCard title="Total Sales" value="Rs. 12576.00" subValue={true} />
                                <StatCard title="Revenue" value="Rs. 3450.00" subValue={true} />
                            </div>

                            {/* 3. Sales Analytics Chart (Custom CSS Bar Chart) */}
                            <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-center text-black mb-2">Sales Analytics</h2>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-bold">Sales Count :</span>
                                        <select className="border border-black rounded px-2 py-0.5 bg-transparent">
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Chart Container */}
                                <div className="h-64 flex items-end justify-between gap-4 px-4 md:px-12 border-l border-b border-black">
                                    {/* Bars */}
                                    <ChartBar day="21" value={16} height="30%" />
                                    <ChartBar day="22" value={25} height="50%" />
                                    <ChartBar day="23" value={21} height="40%" />
                                    <ChartBar day="24" value={10} height="20%" />
                                    <ChartBar day="25" value={23} height="45%" />
                                    <ChartBar day="26" value={36} height="70%" />
                                    <ChartBar day="27" value={14} height="25%" />
                                    <span className="absolute bottom-0 right-0 translate-y-full pt-2 text-xs font-bold">Day</span>
                                </div>
                            </div>

                            {/* 4. Sales Details Table */}
                            <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-center text-black mb-6">Sales Details</h2>

                                <div className="bg-white border border-black overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-black text-sm">
                                                <th className="p-3 border-r border-black font-bold text-center w-24">Date</th>
                                                <th className="p-3 border-r border-black font-bold text-center w-24">ID</th>
                                                <th className="p-3 border-r border-black font-bold text-center">Items</th>
                                                <th className="p-3 border-r border-black font-bold text-center w-32">Price</th>
                                                <th className="p-3 font-bold text-center w-40">Assistant</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-gray-300 h-32 align-top">
                                                <td className="p-3 border-r border-black text-center">2026/02/25</td>
                                                <td className="p-3 border-r border-black text-center">PID00001A</td>
                                                <td className="p-3 border-r border-black">
                                                    <div className="flex flex-col gap-1">
                                                        <span>Paracetamol 500mg *10</span>
                                                        <span>Asprine 10mg *5</span>
                                                        <span>Face mask *10</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-black">Rs. 475.00</td>
                                                <td className="p-3">Ajith Fernando</td>
                                            </tr>
                                            {/* Empty rows to match height if needed */}
                                            <tr className="h-32"><td colSpan={5}></td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-end mt-4 gap-2 text-gray-500 font-bold">
                                    <button className="hover:text-black">&lt;</button>
                                    <button className="text-black">1</button>
                                    <button className="hover:text-black">2</button>
                                    <button className="hover:text-black">3</button>
                                    <button className="text-black">...</button>
                                    <button className="hover:text-black">&gt;</button>
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

/* --- Helper Components --- */

// 2. Stat Card
function StatCard({ title, value, subValue = false }: { title: string, value: string, subValue?: boolean }) {
    return (
        <div className="bg-gray-100/80 rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-32">
            <h3 className="text-sm font-bold text-black mb-2">{title}</h3>
            <p className={`font-bold text-black ${subValue ? 'text-xl' : 'text-3xl'}`}>
                {value}
            </p>
        </div>
    );
}

// 3. Simple CSS Chart Bar
function ChartBar({ day, value, height }: { day: string, value: number, height: string }) {
    return (
        <div className="flex flex-col items-center justify-end h-full w-full group">
            <span className="mb-2 text-xs font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity">{value}</span>
            {/* The Bar */}
            <div
                className="w-8 md:w-12 bg-[#00A99D] rounded-t-sm hover:opacity-80 transition-all relative"
                style={{ height: height }}
            >
                {/* Number always visible on top */}
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-black">
                    {value}
                </span>
            </div>
            {/* The Day Label */}
            <span className="mt-2 text-xs font-bold text-black">{day}</span>
        </div>
    );
}