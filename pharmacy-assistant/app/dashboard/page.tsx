import React from 'react';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <div className="w-8 h-8 bg-[#00A99D] rounded-md mr-3"></div>
          <h1 className="text-xl font-bold tracking-tight">Pharma<span className="text-[#00A99D]">AI</span></h1>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<HomeIcon />} label="Dashboard" active />
          <NavItem icon={<PillIcon />} label="Inventory" />
          <NavItem icon={<CartIcon />} label="Sales / Billing" />
          <NavItem icon={<UsersIcon />} label="Customers" />
          <NavItem icon={<ChartIcon />} label="Reports" />
          <NavItem icon={<SettingsIcon />} label="Settings" />
        </nav>

        {/* User Profile (Bottom of Sidebar) */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src="https://avatar.iran.liara.run/public/boy?username=user" 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-[#00A99D]"
            />
            <div>
              <p className="text-sm font-bold text-gray-700">Dr. Sahan</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-[#00A99D] transition-colors">
              <BellIcon />
            </button>
            <button className="bg-[#00A99D] text-white px-5 py-2 rounded-xl font-medium shadow-md hover:bg-[#008f85] transition-colors">
              + New Sale
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Sales" value="$12,450" change="+15%" icon={<DollarIcon />} />
            <StatCard title="Medicines" value="2,345" change="In Stock" icon={<PillIcon />} />
            <StatCard title="Low Stock" value="12" change="Urgent" isAlert icon={<AlertIcon />} />
            <StatCard title="Customers" value="1,203" change="+5%" icon={<UsersIcon />} />
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-100">
                    <th className="pb-3 font-medium">Medicine</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <TableRow name="Amoxicillin 500mg" date="Today, 10:42 AM" customer="Jane Doe" amount="$12.50" status="Completed" />
                  <TableRow name="Paracetamol" date="Today, 09:15 AM" customer="John Smith" amount="$5.00" status="Completed" />
                  <TableRow name="Vitamin C" date="Yesterday" customer="Mike Ross" amount="$18.20" status="Pending" />
                  <TableRow name="Insulin Pen" date="Yesterday" customer="Rachel Z." amount="$45.00" status="Completed" />
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

/* --- HELPER COMPONENTS (Internal) --- */

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-[#E6F7F6] text-[#00A99D] font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      <span className={active ? "text-[#00A99D]" : "text-gray-400"}>{icon}</span>
      {label}
    </a>
  );
}

function StatCard({ title, value, change, icon, isAlert = false }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
        <p className={`text-xs font-medium ${isAlert ? 'text-red-500' : 'text-emerald-500'}`}>{change}</p>
      </div>
      <div className={`p-3 rounded-xl ${isAlert ? 'bg-red-50 text-red-500' : 'bg-[#E6F7F6] text-[#00A99D]'}`}>
        {icon}
      </div>
    </div>
  );
}

function TableRow({ name, date, customer, amount, status }: any) {
  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-4 font-medium text-gray-800">{name}</td>
      <td className="py-4 text-gray-500">{date}</td>
      <td className="py-4 text-gray-500">{customer}</td>
      <td className="py-4 font-medium text-gray-800">{amount}</td>
      <td className="py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

/* --- ICONS (SVGs) --- */
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const PillIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>;
const CartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const DollarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const AlertIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;