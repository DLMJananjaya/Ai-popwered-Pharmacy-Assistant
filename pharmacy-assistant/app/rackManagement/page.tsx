"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
  LayoutDashboard, PlusCircle, Search, Grid, Package, 
  AlertTriangle, Clock, Loader2, CheckCircle2, PackageOpen, LayoutGrid
} from 'lucide-react';

// --- SHARED COMPONENTS ---

const Loader = () => (
  <div className="flex justify-center items-center h-full p-10">
    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
  </div>
);

const EmptyState = ({ message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 border-dashed">
    <Icon className="w-12 h-12 text-gray-300 mb-3" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

// --- PAGES ---

const Dashboard = ({ medicines }) => {
  const lowStockThreshold = 10;
  const lowStockAlerts = medicines.filter(m => m.quantity <= lowStockThreshold);
  
  // Simple expiry check (within 30 days)
  const today = new Date();
  const expiringSoon = medicines.filter(m => {
    const expDate = new Date(m.expiryDate);
    const diffTime = Math.abs(expDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  return (
    <>
        <Navbar />
        <div className="space-y-6">
        
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Medicines Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
            <Package size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Medicines</p>
            <p className="text-2xl font-bold text-gray-800">{medicines.length}</p>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-gray-800">{lowStockAlerts.length}</p>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Expiring Soon</p>
            <p className="text-2xl font-bold text-gray-800">{expiringSoon.length}</p>
          </div>
        </div>
      </div>
    </div>
    </>
    
  );
};

const AddMedicine = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    name: '', category: '', expiryDate: '', price: '', quantity: '', rack: 'A', shelf: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onAdd({ ...formData, id: Date.now() });
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', category: '', expiryDate: '', price: '', quantity: '', rack: 'A', shelf: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Medicine</h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
          <CheckCircle2 className="mr-2" size={20} />
          Medicine added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. Paracetamol" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. Painkiller" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
              <select value={formData.rack} onChange={e => setFormData({...formData, rack: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none">
                <option value="A">Rack A</option>
                <option value="B">Rack B</option>
                <option value="C">Rack C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf No.</label>
              <input required type="number" min="1" max="5" value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
            </div>
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-medium py-2.5 rounded-lg hover:bg-teal-700 transition flex justify-center items-center">
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Save Medicine'}
        </button>
      </form>
    </div>
  );
};

const SearchMedicine = ({ medicines }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Inventory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by medicine name or category..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No medicines found." icon={PackageOpen} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="p-4 font-medium border-b border-gray-200">Medicine Name</th>
                <th className="p-4 font-medium border-b border-gray-200">Rack</th>
                <th className="p-4 font-medium border-b border-gray-200">Shelf</th>
                <th className="p-4 font-medium border-b border-gray-200">Quantity</th>
                <th className="p-4 font-medium border-b border-gray-200">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(med => (
                <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{med.name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">{med.rack}</span></td>
                  <td className="p-4 text-gray-600">{med.shelf}</td>
                  <td className="p-4">
                    <span className={`font-bold ${med.quantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {med.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{med.expiryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const RackView = ({ medicines }) => {
  const racks = ['A', 'B', 'C'];
  const shelves = ['1', '2', '3', '4', '5'];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Visual Rack Layout</h2>
      
      {racks.map(rackId => (
        <div key={rackId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <LayoutGrid className="text-teal-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-800">Rack {rackId}</h3>
          </div>
          
          <div className="space-y-3">
            {shelves.map(shelfId => {
              const medsOnShelf = medicines.filter(m => m.rack === rackId && m.shelf === shelfId);
              
              return (
                <div key={shelfId} className="flex border border-gray-300 rounded-lg overflow-hidden h-24">
                  <div className="bg-gray-100 border-r border-gray-300 w-16 flex items-center justify-center font-bold text-gray-600">
                    S-{shelfId}
                  </div>
                  <div className="flex-1 p-2 flex gap-2 overflow-x-auto bg-[#f8fafc]">
                    {medsOnShelf.length === 0 ? (
                      <div className="text-gray-400 text-sm flex items-center w-full justify-center italic">Empty Shelf</div>
                    ) : (
                      medsOnShelf.map(med => (
                        <div key={med.id} className="min-w-[120px] bg-white border border-teal-200 p-2 rounded shadow-sm flex flex-col justify-between">
                          <span className="font-bold text-sm text-teal-800 truncate">{med.name}</span>
                          <span className={`text-xs font-semibold ${med.quantity <= 10 ? 'text-red-500' : 'text-gray-500'}`}>
                            Qty: {med.quantity}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- MAIN LAYOUT & APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial Mock Data
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Amoxicillin', category: 'Antibiotic', expiryDate: '2026-12-01', price: '12.50', quantity: 45, rack: 'A', shelf: '1' },
    { id: 2, name: 'Ibuprofen', category: 'Painkiller', expiryDate: '2026-05-15', price: '8.00', quantity: 8, rack: 'B', shelf: '2' },
    { id: 3, name: 'Cetirizine', category: 'Antihistamine', expiryDate: '2025-10-20', price: '5.50', quantity: 120, rack: 'C', shelf: '3' },
  ]);

  // Simulate initial load
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleAddMedicine = (newMed) => {
    setMedicines([...medicines, newMed]);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add Medicine', icon: PlusCircle },
    { id: 'search', label: 'Search & Inventory', icon: Search },
    { id: 'rack', label: 'Rack Management', icon: Grid },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          {/* <h1 className="text-2xl font-extrabold text-teal-600 tracking-tight">Vaidya</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Pharmacy Assistant</p> */}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between md:justify-end shadow-sm z-10">
          <div className="md:hidden">
            {/* <h1 className="text-xl font-bold text-teal-600">Vaidya</h1> */}
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
              PA
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="max-w-6xl mx-auto animation-fade-in">
              {activeTab === 'dashboard' && <Dashboard medicines={medicines} />}
              {activeTab === 'add' && <AddMedicine onAdd={handleAddMedicine} />}
              {activeTab === 'search' && <SearchMedicine medicines={medicines} />}
              {activeTab === 'rack' && <RackView medicines={medicines} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}