"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';
import { 
<<<<<<< HEAD
  LogOut, DoorOpen, User
=======
  LayoutDashboard, FileText, Package, Grid, Receipt, 
  LogOut, DoorOpen, User, X, Settings2
>>>>>>> d7e36fd3446bcaff3c6a7d7144bef482f5499aa3
} from 'lucide-react';

export default function RackManagement() {
  // --- STATE ---
  const [elements, setElements] = useState([
    { id: 'r3', type: 'rack', name: 'Rack 3', rows: 1, cols: 8, x: 50, y: 30, rotation: 0, gridData: {} },
    { id: 'r4', type: 'rack', name: 'Rack 4', rows: 1, cols: 7, x: 600, y: 50, rotation: 90, gridData: {} },
    { 
      id: 'r1', type: 'rack', name: 'Rack 1', rows: 4, cols: 10, x: 50, y: 220, rotation: 0, 
      gridData: {
        "0-0": { name: "Paracetamol", qty: 50 },
        "0-1": { name: "Ibuprofen", qty: 30 },
        "1-4": { name: "Amoxicillin", qty: 15 },
        "3-9": { name: "Vitamin C", qty: 100 }
      } 
    },
    { id: 'r2', type: 'rack', name: 'Rack 2', rows: 1, cols: 8, x: 50, y: 360, rotation: 0, gridData: {} },
    { id: 'd1', type: 'door', name: 'Main Door', x: 20, y: 130, rotation: 0 },
    { id: 'u1', type: 'user', name: 'Pharmacist', x: 120, y: 290, rotation: 0 },
  ]);

  const [selectedId, setSelectedId] = useState('r1');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Form states
  const [rackForm, setRackForm] = useState({ name: '', rows: '3', cols: '5' });
  const [doorForm, setDoorForm] = useState({ name: 'Door', count: '1' });
  const [userForm, setUserForm] = useState({ name: 'Staff', count: '1' });
  
  const [editingCell, setEditingCell] = useState(null); 
  const [cellForm, setCellForm] = useState({ name: '', qty: '' });

  // --- DRAG AND DROP LOGIC ---
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const el = elements.find(el => el.id === id);
    setSelectedId(id);
    setDraggingId(id);
    setDragOffset({
      x: (e.clientX - rect.left) - el.x,
      y: (e.clientY - rect.top) - el.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) - dragOffset.x;
    let newY = (e.clientY - rect.top) - dragOffset.y;
    
    setElements(prev => prev.map(el => 
      el.id === draggingId ? { ...el, x: newX, y: newY } : el
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

  // --- ACTIONS ---
  const addRack = () => {
    if (!rackForm.name) return alert("Please enter a rack name");
    setElements([...elements, {
      id: Date.now().toString(), type: 'rack', name: rackForm.name,
      rows: parseInt(rackForm.rows), cols: parseInt(rackForm.cols),
      x: 100, y: 100, rotation: 0, gridData: {}
    }]);
    setRackForm({ name: '', rows: '3', cols: '5' });
  };

  const addDoor = () => {
    if (!doorForm.name) return alert("Please enter a name for the door");
    const count = parseInt(doorForm.count);
    const newDoors = Array.from({ length: count }).map((_, i) => ({
      id: Date.now().toString() + i,
      type: 'door',
      name: count > 1 ? `${doorForm.name} ${i + 1}` : doorForm.name,
      x: 100 + (i * 40), y: 100 + (i * 40), rotation: 0
    }));
    setElements([...elements, ...newDoors]);
  };

  const addUser = () => {
    if (!userForm.name) return alert("Please enter a name for the person");
    const count = parseInt(userForm.count);
    const newUsers = Array.from({ length: count }).map((_, i) => ({
      id: Date.now().toString() + i,
      type: 'user',
      name: count > 1 ? `${userForm.name} ${i + 1}` : userForm.name,
      x: 150 + (i * 40), y: 150 + (i * 40), rotation: 0
    }));
    setElements([...elements, ...newUsers]);
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setElements(elements.map(el => el.id === selectedId ? { ...el, rotation: (el.rotation + 90) % 360 } : el));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const updateRackDimensions = (id, newRows, newCols) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, rows: Math.max(1, newRows), cols: Math.max(1, newCols) } : el
    ));
  };

  const updateElementName = (id, newName) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, name: newName } : el
    ));
  };

  // --- CELL EDITING LOGIC ---
  const openCellEditor = (row, col) => {
    const el = elements.find(e => e.id === selectedId);
    const existingData = el?.gridData?.[`${row}-${col}`];
    setCellForm(existingData ? { ...existingData } : { name: '', qty: '' });
    setEditingCell({ row, col });
  };

  const saveCellData = () => {
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const newGrid = { ...el.gridData };
        if (cellForm.name.trim() !== '') newGrid[`${editingCell.row}-${editingCell.col}`] = cellForm;
        else delete newGrid[`${editingCell.row}-${editingCell.col}`];
        return { ...el, gridData: newGrid };
      }
      return el;
    }));
    setEditingCell(null);
  };

  const clearCellData = () => {
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const newGrid = { ...el.gridData };
        delete newGrid[`${editingCell.row}-${editingCell.col}`];
        return { ...el, gridData: newGrid };
      }
      return el;
    }));
    setEditingCell(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // --- RENDERING HELPERS ---
  const renderCanvasElement = (el) => {
    const isSelected = selectedId === el.id;
    const baseStyle = {
      position: 'absolute', left: el.x, top: el.y, transform: `rotate(${el.rotation}deg)`,
      cursor: draggingId === el.id ? 'grabbing' : 'grab',
    };

    if (el.type === 'rack') {
      const cellWidth = 35;
      const cellHeight = 35;
      return (
        <div 
          key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
          className={`flex flex-col bg-white ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-gray-300 z-10' : 'border border-gray-500 z-0'}`}
        >
          <div className="absolute -top-6 left-0 text-sm font-bold text-gray-800 pointer-events-none whitespace-nowrap">
            {el.name}
          </div>
          <div className="flex border border-gray-600">
            {Array.from({ length: el.cols }).map((_, i) => (
              <div 
                key={i} style={{ width: cellWidth, height: cellHeight }} 
                className="border-r border-gray-400 last:border-r-0 bg-white flex items-center justify-center pointer-events-none"
              >
                <span className="text-[10px] font-bold text-gray-400 select-none">{i + 1}</span>
              </div>
            ))}
          </div>
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

  return (
<<<<<<< HEAD
    <>
    <Navbar />
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-900">
      <AppSidebar active="rackManagement" />
=======
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 relative">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 shrink-0 hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-50 flex items-center justify-center rounded border border-teal-200 text-teal-600 font-bold">V</div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight">AI-Powered Pharmacy Assistant</h1>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {[
            { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Prescription Reader', icon: FileText },
            { label: 'Inventory', icon: Package }, { label: 'Rack Management', icon: Grid, active: true },
            { label: 'Billing', icon: Receipt },
          ].map((item, idx) => (
            <button key={idx} className={`w-full flex items-center space-x-3 px-6 py-3 text-sm font-bold transition-colors ${item.active ? 'bg-teal-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <item.icon size={20} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
>>>>>>> d7e36fd3446bcaff3c6a7d7144bef482f5499aa3

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center overflow-hidden"><User size={20} className="text-orange-600 mt-2" /></div>
              <span className="text-sm font-bold text-gray-700">User Profile</span>
            </div>
            <button className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"><LogOut size={20} className="text-gray-700" /></button>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-6 flex flex-col space-y-6">
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* CANVAS AREA */}
            <div 
              ref={canvasRef}
              className="flex-1 bg-[#d4d4d4] border-2 border-gray-400 rounded-sm relative h-[450px] overflow-hidden shadow-inner cursor-crosshair"
              onMouseDown={() => setSelectedId(null)} 
            >
              {elements.map(renderCanvasElement)}
            </div>

            {/* CONTROLS PANEL */}
            <div className="w-full xl:w-64 flex flex-col space-y-4 shrink-0">
              
              {/* Add Rack Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Rack Name</label>
                  <input type="text" value={rackForm.name} onChange={e => setRackForm({...rackForm, name: e.target.value})} className="w-32 border border-gray-300 p-1 text-sm rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Rows</label>
                  <select value={rackForm.rows} onChange={e => setRackForm({...rackForm, rows: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Columns</label>
                  <select value={rackForm.cols} onChange={e => setRackForm({...rackForm, cols: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,3,5,7,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={addRack} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">ADD RACK</button>
              </div>

              {/* Add People Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Person Name</label>
                  <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-28 border border-gray-300 p-1 text-sm rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Count</label>
                  <select value={userForm.count} onChange={e => setUserForm({...userForm, count: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={addUser} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">ADD PERSON</button>
              </div>

              {/* Add Door Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Door Name</label>
                  <input type="text" value={doorForm.name} onChange={e => setDoorForm({...doorForm, name: e.target.value})} className="w-28 border border-gray-300 p-1 text-sm rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Count</label>
                  <select value={doorForm.count} onChange={e => setDoorForm({...doorForm, count: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={addDoor} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">ADD DOOR</button>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={rotateSelected} disabled={!selectedId} className="flex-1 bg-[#0056b3] disabled:opacity-50 hover:bg-blue-800 text-white font-bold py-2 rounded shadow-md flex items-center justify-center gap-1">Rotate</button>
                <button onClick={deleteSelected} disabled={!selectedId} className="flex-1 bg-[#b33a00] disabled:opacity-50 hover:bg-red-800 text-white font-bold py-2 rounded shadow-md flex items-center justify-center gap-1">Delete</button>
              </div>
            </div>
          </div>

          {/* DETAILED VIEW (BOTTOM PANEL) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative min-h-[250px]">
            {selectedElement ? (
              
              // If a RACK is selected
              selectedElement.type === 'rack' ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">{selectedElement.name} - Front View</h2>
                      <span className="text-sm text-gray-500">Click any cell to add/edit medicines</span>
                    </div>
                    
                    <div className="flex items-center space-x-6 bg-white px-4 py-2 rounded shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-bold text-gray-700">Name:</label>
                        <input 
                          type="text" 
                          value={selectedElement.name} 
                          onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                          className="w-24 border border-gray-300 rounded p-1 font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Settings2 size={16} className="text-gray-400" />
                        <label className="text-sm font-bold text-gray-700">Rows:</label>
                        <input 
                          type="number" min="1" max="10" 
                          value={selectedElement.rows} 
                          onChange={(e) => updateRackDimensions(selectedElement.id, parseInt(e.target.value) || 1, selectedElement.cols)}
                          className="w-16 border border-gray-300 rounded p-1 text-center font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-bold text-gray-700">Partitions:</label>
                        <input 
                          type="number" min="1" max="20" 
                          value={selectedElement.cols} 
                          onChange={(e) => updateRackDimensions(selectedElement.id, selectedElement.rows, parseInt(e.target.value) || 1)}
                          className="w-16 border border-gray-300 rounded p-1 text-center font-semibold text-teal-700 focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* GRID VIEW */}
                  <div className="bg-[#f0f0f0] p-4 rounded-lg inline-block border border-gray-300 w-full overflow-x-auto shadow-inner">
                    <div className="flex flex-col">
                      {Array.from({ length: selectedElement.rows }).map((_, rIdx) => (
                        <div key={rIdx} className="flex border-t border-l border-gray-500 first:border-t-0">
                          {Array.from({ length: selectedElement.cols }).map((_, cIdx) => {
                            const cellData = selectedElement.gridData?.[`${rIdx}-${cIdx}`];
                            return (
                              <div 
                                key={cIdx} 
                                onClick={() => openCellEditor(rIdx, cIdx)}
                                className={`w-28 h-20 border-r border-b border-gray-500 shrink-0 p-1.5 flex flex-col cursor-pointer transition-colors hover:ring-2 hover:ring-inset hover:ring-blue-400 ${cellData ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] text-gray-500 font-bold tracking-wider">
                                    R{rIdx + 1} - P{cIdx + 1}
                                  </span>
                                </div>
                                
                                {cellData ? (
                                  <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-xs font-bold text-teal-800 truncate" title={cellData.name}>
                                      {cellData.name}
                                    </span>
                                    <span className="text-[11px] text-teal-600 font-medium mt-auto">
                                      Qty: {cellData.qty}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center">
                                    <span className="text-xs text-gray-300 italic opacity-0 hover:opacity-100 transition-opacity">+ Add</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button className="bg-[#0056b3] hover:bg-blue-800 text-white font-bold py-2 px-8 rounded shadow-md">Save Layout</button>
                  </div>
                </div>
              ) : 
              
              // If a DOOR or USER is selected
              (
                <div className="space-y-6 max-w-md">
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {selectedElement.type === 'door' ? 'Door Details' : 'Person Details'}
                  </h2>
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={selectedElement.name || ''} 
                      onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 font-medium text-gray-800 shadow-sm"
                      placeholder="Enter name..."
                    />
                    <p className="text-xs text-gray-500 mt-2 italic">This name is displayed on the canvas map.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={deleteSelected} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-6 rounded shadow-sm">Delete from Map</button>
                  </div>
                </div>
              )
              
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 font-medium">
                Select an element on the canvas above to view and edit its contents
              </div>
            )}
          </div>

        </div>
      </main>

      {/* CELL EDITING MODAL */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                Edit R{editingCell.row + 1} - P{editingCell.col + 1}
              </h3>
              <button onClick={() => setEditingCell(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Medicine Name</label>
                <input 
                  type="text" value={cellForm.name} 
                  onChange={e => setCellForm({...cellForm, name: e.target.value})} 
                  placeholder="e.g. Paracetamol"
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                <input 
                  type="number" value={cellForm.qty} 
                  onChange={e => setCellForm({...cellForm, qty: e.target.value})} 
                  placeholder="0"
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button onClick={saveCellData} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-sm">Save</button>
                <button onClick={clearCellData} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded shadow-sm">Clear Cell</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}