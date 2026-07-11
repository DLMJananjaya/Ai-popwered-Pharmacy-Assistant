"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Package, Grid, Receipt,
  LogOut, DoorOpen, User, X, Settings2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';
import TopHeader from '../components/TopHeader';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface CellData {
  name: string;
  qty: string | number;
}

interface GridData {
  [key: string]: CellData;
}

interface RackElement {
  id: string;
  type: 'rack';
  name: string;
  rows: number;
  cols: number;
  x: number;
  y: number;
  rotation: number;
  gridData: GridData;
}

interface DoorElement {
  id: string;
  type: 'door';
  name: string;
  x: number;
  y: number;
  rotation: number;
}

interface UserElement {
  id: string;
  type: 'user';
  name: string;
  x: number;
  y: number;
  rotation: number;
}

type CanvasElement = RackElement | DoorElement | UserElement;

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
// Make sure these hrefs match your actual Next.js route file paths exactly.

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Prescription Reader', icon: FileText, href: '/prescriptionReader' },
  { label: 'Inventory', icon: Package, href: '/inventory' },
  { label: 'Rack Management', icon: Grid, href: '/rackManagement' },
  { label: 'Billing', icon: Receipt, href: '/billing' },
];

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
// Extracts the sidebar so it uses Next.js <Link> for real URL navigation.
// usePathname() highlights whichever route is currently active.



// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────

export default function RackManagement() {

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── Load layout from DB on mount ──────────────────────────────────────────
  const loadLayout = useCallback(async () => {
    setLayoutLoading(true);
    try {
      const res = await fetch('/api/rack-layout');
      if (res.ok) {
        const data = await res.json();
        // If no layout saved yet, start with an empty canvas
        setElements(Array.isArray(data) && data.length > 0 ? data : []);
      }
    } finally {
      setLayoutLoading(false);
    }
  }, []);

  useEffect(() => { loadLayout(); }, [loadLayout]);

  // ── Save layout to DB ─────────────────────────────────────────────────────
  const saveLayout = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/rack-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements }),
      });
      if (res.ok) {
        setSaveMsg('Layout saved!');
        setTimeout(() => setSaveMsg(''), 2500);
      } else {
        setSaveMsg('Save failed — try again');
      }
    } finally {
      setSaving(false);
    }
  };

  const [selectedId, setSelectedId] = useState<string | null>('r1');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [rackForm, setRackForm] = useState({ name: '', rows: '3', cols: '5' });
  const [doorForm, setDoorForm] = useState({ name: 'Door', count: '1' });
  const [userForm, setUserForm] = useState({ name: 'Staff', count: '1' });

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellForm, setCellForm] = useState<CellData>({ name: '', qty: '' });

  // ─── DRAG AND DROP ─────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    setSelectedId(id);
    setDraggingId(id);
    setDragOffset({
      x: (e.clientX - rect.left) - el.x,
      y: (e.clientY - rect.top) - el.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setElements(prev => prev.map(el =>
      el.id === draggingId
        ? { ...el, x: (e.clientX - rect.left) - dragOffset.x, y: (e.clientY - rect.top) - dragOffset.y }
        : el
    ));
  };

  const handleMouseUp = () => setDraggingId(null);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffset]);

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  const addRack = () => {
    if (!rackForm.name) return alert("Please enter a rack name");
    setElements(prev => [...prev, {
      id: Date.now().toString(), type: 'rack', name: rackForm.name,
      rows: parseInt(rackForm.rows), cols: parseInt(rackForm.cols),
      x: 100, y: 100, rotation: 0, gridData: {}
    }]);
    setRackForm({ name: '', rows: '3', cols: '5' });
  };

  const addDoor = () => {
    if (!doorForm.name) return alert("Please enter a name for the door");
    const count = parseInt(doorForm.count);
    setElements(prev => [...prev, ...Array.from({ length: count }).map((_, i): DoorElement => ({
      id: Date.now().toString() + i, type: 'door',
      name: count > 1 ? `${doorForm.name} ${i + 1}` : doorForm.name,
      x: 100 + (i * 40), y: 100 + (i * 40), rotation: 0,
    }))]);
  };

  const addUser = () => {
    if (!userForm.name) return alert("Please enter a name for the person");
    const count = parseInt(userForm.count);
    setElements(prev => [...prev, ...Array.from({ length: count }).map((_, i): UserElement => ({
      id: Date.now().toString() + i, type: 'user',
      name: count > 1 ? `${userForm.name} ${i + 1}` : userForm.name,
      x: 150 + (i * 40), y: 150 + (i * 40), rotation: 0,
    }))]);
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el =>
      el.id === selectedId ? { ...el, rotation: (el.rotation + 90) % 360 } : el
    ));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const updateRackDimensions = (id: string, newRows: number, newCols: number) => {
    setElements(prev => prev.map(el =>
      el.id === id && el.type === 'rack'
        ? { ...el, rows: Math.max(1, newRows), cols: Math.max(1, newCols) }
        : el
    ));
  };

  const updateElementName = (id: string, newName: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, name: newName } : el));
  };

  // ─── CELL EDITING ──────────────────────────────────────────────────────────

  const openCellEditor = (row: number, col: number) => {
    const el = elements.find(e => e.id === selectedId);
    if (!el || el.type !== 'rack') return;
    const existing = el.gridData[`${row}-${col}`];
    setCellForm(existing ? { ...existing } : { name: '', qty: '' });
    setEditingCell({ row, col });
  };

  const saveCellData = () => {
    if (!editingCell) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId || el.type !== 'rack') return el;
      const newGrid = { ...el.gridData };
      if (String(cellForm.name).trim() !== '') {
        newGrid[`${editingCell.row}-${editingCell.col}`] = cellForm;
      } else {
        delete newGrid[`${editingCell.row}-${editingCell.col}`];
      }
      return { ...el, gridData: newGrid };
    }));
    setEditingCell(null);
  };

  const clearCellData = () => {
    if (!editingCell) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId || el.type !== 'rack') return el;
      const newGrid = { ...el.gridData };
      delete newGrid[`${editingCell.row}-${editingCell.col}`];
      return { ...el, gridData: newGrid };
    }));
    setEditingCell(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId) ?? null;

  // ─── CANVAS RENDERING ──────────────────────────────────────────────────────

  const renderCanvasElement = (el: CanvasElement) => {
    const isSelected = selectedId === el.id;
    const baseStyle: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y,
      transform: `rotate(${el.rotation}deg)`,
      cursor: draggingId === el.id ? 'grabbing' : 'grab',
    };

    if (el.type === 'rack') {
      // Show a compact horizontal strip: first few columns + badge for total
      const maxVisible = Math.min(el.cols, 8);
      const hasMore = el.cols > maxVisible;
      return (
        <div key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
          className={`flex flex-col bg-white ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-gray-300 z-10' : 'border border-gray-500 z-0'}`}>
          <div className="absolute -top-6 left-0 text-sm font-bold text-gray-800 pointer-events-none whitespace-nowrap">{el.name}</div>
          <div className="flex items-center border border-gray-600">
            {Array.from({ length: maxVisible }).map((_, i) => (
              <div key={i} style={{ width: 28, height: 28 }}
                className="border-r border-gray-400 last:border-r-0 bg-white flex items-center justify-center pointer-events-none">
                <span className="text-[9px] font-bold text-gray-400 select-none">{i + 1}</span>
              </div>
            ))}
            {hasMore && (
              <div style={{ height: 28 }}
                className="bg-gray-100 flex items-center justify-center px-2 pointer-events-none border-l border-gray-400">
                <span className="text-[9px] font-bold text-teal-600 select-none whitespace-nowrap">…{el.cols}</span>
              </div>
            )}
          </div>
          <div className="text-[8px] text-gray-400 text-center pointer-events-none mt-0.5">{el.rows}R × {el.cols}P</div>
        </div>
      );
    }

    if (el.type === 'door') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
          className={`flex flex-col items-center p-1 bg-gray-200 rounded-sm ${isSelected ? 'ring-2 ring-blue-600 z-10' : 'border border-gray-600 z-0'}`}>
          <span className="absolute -top-5 text-xs font-bold text-gray-800 pointer-events-none whitespace-nowrap">{el.name}</span>
          <DoorOpen size={40} className="text-black" />
        </div>
      );
    }

    if (el.type === 'user') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
          className={`flex flex-col items-center p-1 bg-transparent ${isSelected ? 'ring-2 ring-blue-600 rounded-full z-10' : 'z-0'}`}>
          <span className="absolute -top-5 text-xs font-bold text-gray-800 pointer-events-none whitespace-nowrap">{el.name}</span>
          <User size={48} className="text-black fill-black" />
        </div>
      );
    }
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 relative">

      {/* ✅ SIDEBAR now uses Next.js <Link> — clicking any nav item navigates to its route */}


      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {/* <Navbar /> */}
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
          <AppSidebar active="rackManagement" />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <TopHeader />
            <div className="flex-1 overflow-auto p-6 flex flex-col space-y-6 z-10">
              <div className="flex flex-col xl:flex-row gap-6">

              {/* CANVAS */}
              <div ref={canvasRef}
                className="flex-1 bg-[#d4d4d4] border-2 border-gray-400 rounded-sm relative h-[450px] overflow-hidden shadow-inner cursor-crosshair"
                onMouseDown={() => setSelectedId(null)}>
                {elements.map(renderCanvasElement)}
              </div>

              {/* CONTROLS */}
              <div className="w-full xl:w-64 flex flex-col space-y-4 shrink-0">

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Rack Name</label>
                    <input type="text" value={rackForm.name}
                      onChange={e => setRackForm({ ...rackForm, name: e.target.value })}
                      className="w-32 border border-gray-300 p-1 text-sm rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Rows</label>
                    <input type="number" min="1" max="20" value={rackForm.rows}
                      onChange={e => setRackForm({ ...rackForm, rows: e.target.value })}
                      className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50 text-center" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Columns</label>
                    <input type="number" min="1" max="100" value={rackForm.cols}
                      onChange={e => setRackForm({ ...rackForm, cols: e.target.value })}
                      className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50 text-center" />
                  </div>
                  <button onClick={addRack} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">
                    ADD RACK
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Person Name</label>
                    <input type="text" value={userForm.name}
                      onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-28 border border-gray-300 p-1 text-sm rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Count</label>
                    <input type="number" min="1" max="20" value={userForm.count}
                      onChange={e => setUserForm({ ...userForm, count: e.target.value })}
                      className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50 text-center" />
                  </div>
                  <button onClick={addUser} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">
                    ADD PERSON
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Door Name</label>
                    <input type="text" value={doorForm.name}
                      onChange={e => setDoorForm({ ...doorForm, name: e.target.value })}
                      className="w-28 border border-gray-300 p-1 text-sm rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800">Count</label>
                    <input type="number" min="1" max="20" value={doorForm.count}
                      onChange={e => setDoorForm({ ...doorForm, count: e.target.value })}
                      className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50 text-center" />
                  </div>
                  <button onClick={addDoor} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">
                    ADD DOOR
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={rotateSelected} disabled={!selectedId}
                    className="flex-1 bg-[#0056b3] disabled:opacity-50 hover:bg-blue-800 text-white font-bold py-2 rounded shadow-md">
                    Rotate
                  </button>
                  <button onClick={deleteSelected} disabled={!selectedId}
                    className="flex-1 bg-[#b33a00] disabled:opacity-50 hover:bg-red-800 text-white font-bold py-2 rounded shadow-md">
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* DETAIL PANEL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative min-h-[250px]">

              {/* ── Always-visible Save Layout bar ─────────────────────────── */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-700">Layout Details</h3>
                <div className="flex items-center gap-3">
                  {saveMsg && (
                    <span className={`text-sm font-semibold ${
                      saveMsg.includes('saved') ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={saveLayout}
                    disabled={saving}
                    className="bg-[#0056b3] hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-2 px-8 rounded shadow-md"
                  >
                    {saving ? 'Saving…' : '💾 Save Layout'}
                  </button>
                </div>
              </div>
              {selectedElement ? (
                selectedElement.type === 'rack' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-900">{selectedElement.name} - Front View</h2>
                        <span className="text-sm text-gray-500">Click any cell to add/edit medicines</span>
                      </div>
                      <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded shadow-sm border border-gray-200 flex-wrap gap-y-2">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-bold text-gray-700">Name:</label>
                          <input type="text" value={selectedElement.name}
                            onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                            className="w-24 border border-gray-300 rounded p-1 font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Settings2 size={16} className="text-gray-400" />
                          <label className="text-sm font-bold text-gray-700">Rows:</label>
                          <input type="number" min="1" max="10" value={selectedElement.rows}
                            onChange={(e) => updateRackDimensions(selectedElement.id, parseInt(e.target.value) || 1, selectedElement.cols)}
                            className="w-16 border border-gray-300 rounded p-1 text-center font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-bold text-gray-700">Partitions:</label>
                          <input type="number" min="1" max="100" value={selectedElement.cols}
                            onChange={(e) => updateRackDimensions(selectedElement.id, selectedElement.rows, parseInt(e.target.value) || 1)}
                            className="w-16 border border-gray-300 rounded p-1 text-center font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500" />
                        </div>
                      </div>
                    </div>

                    {/* Single scrollable container for column header + grid body */}
                    <div className="w-full overflow-x-auto rounded-lg border border-gray-300 shadow-inner">
                      <div style={{ minWidth: `${selectedElement.cols * 112 + 40}px` }}>
                        {/* Column index header: 1 | 2 | 3 | ... | N */}
                        <div className="flex bg-gray-200 sticky top-0 z-10">
                          {/* Row label spacer */}
                          <div className="w-10 shrink-0" />
                          {Array.from({ length: selectedElement.cols }).map((_, cIdx) => (
                            <div key={cIdx}
                              className="w-28 shrink-0 flex items-center justify-center py-1.5 border-r border-b border-gray-300 last:border-r-0">
                              <span className="text-xs font-bold text-gray-600">{cIdx + 1}</span>
                            </div>
                          ))}
                        </div>
                        {/* Grid body with row labels */}
                        <div className="flex flex-col bg-[#f0f0f0]">
                          {Array.from({ length: selectedElement.rows }).map((_, rIdx) => (
                            <div key={rIdx} className="flex">
                              {/* Row label */}
                              <div className="w-10 shrink-0 flex items-center justify-center bg-gray-200 border-b border-r border-gray-400">
                                <span className="text-[10px] font-bold text-gray-600">R{rIdx + 1}</span>
                              </div>
                              {Array.from({ length: selectedElement.cols }).map((_, cIdx) => {
                                const cellData = selectedElement.gridData[`${rIdx}-${cIdx}`];
                                return (
                                  <div key={cIdx} onClick={() => openCellEditor(rIdx, cIdx)}
                                    className={`w-28 h-20 border-r border-b border-gray-500 shrink-0 p-1.5 flex flex-col cursor-pointer transition-colors hover:ring-2 hover:ring-inset hover:ring-blue-400 ${cellData ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'}`}>
                                    <span className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">R{rIdx + 1} - P{cIdx + 1}</span>
                                    {cellData ? (
                                      <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-xs font-bold text-teal-800 truncate" title={cellData.name}>{cellData.name}</span>
                                        <span className="text-[11px] text-teal-600 font-medium mt-auto">Qty: {cellData.qty}</span>
                                      </div>
                                    ) : (
                                      <div className="flex-1 flex items-center justify-center">
                                        <span className="text-xs text-gray-300 italic">+ Add</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Save button removed from here — now always visible at top of panel */}
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md">
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {selectedElement.type === 'door' ? 'Door Details' : 'Person Details'}
                    </h2>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                      <input type="text" value={selectedElement.name || ''}
                        onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 font-medium text-gray-800 shadow-sm"
                        placeholder="Enter name..." />
                      <p className="text-xs text-gray-500 mt-2 italic">This name is displayed on the canvas map.</p>
                    </div>
                    <button onClick={deleteSelected}
                      className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-6 rounded shadow-sm">
                      Delete from Map
                    </button>
                  </div>
                )
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 font-medium">
                  Select an element on the canvas above to view and edit its contents
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* CELL EDITING MODAL */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Edit R{editingCell.row + 1} - P{editingCell.col + 1}</h3>
              <button onClick={() => setEditingCell(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Medicine Name</label>
                <input type="text" value={cellForm.name}
                  onChange={e => setCellForm({ ...cellForm, name: e.target.value })}
                  placeholder="e.g. Paracetamol" autoFocus
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                <input type="number" value={cellForm.qty}
                  onChange={e => setCellForm({ ...cellForm, qty: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveCellData}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-sm">Save</button>
                <button onClick={clearCellData}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded shadow-sm">Clear Cell</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}