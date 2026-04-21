"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';
import { 
  LogOut, DoorOpen, User
} from 'lucide-react';

export default function RackManagement() {
  // --- STATE ---
  // Initial layout mimicking the screenshot
  const [elements, setElements] = useState([
    { id: 'r3', type: 'rack', name: 'Rack 3', rows: 1, cols: 8, x: 50, y: 30, rotation: 0 },
    { id: 'r4', type: 'rack', name: 'Rack 4', rows: 1, cols: 7, x: 600, y: 50, rotation: 90 },
    { id: 'r1', type: 'rack', name: 'Rack 1', rows: 4, cols: 10, x: 50, y: 220, rotation: 0 },
    { id: 'r2', type: 'rack', name: 'Rack 2', rows: 1, cols: 8, x: 50, y: 360, rotation: 0 },
    { id: 'd1', type: 'door', x: 20, y: 130, rotation: 0 },
    { id: 'u1', type: 'user', x: 120, y: 290, rotation: 0 },
  ]);

  const [selectedId, setSelectedId] = useState('r1');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Form states
  const [rackForm, setRackForm] = useState({ name: '', rows: '3', cols: '5' });

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
    
    // Fixed: Using previous state to ensure smooth dragging without stuttering
    setElements(prev => prev.map(el => 
      el.id === draggingId ? { ...el, x: newX, y: newY } : el
    ));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Attach global mouse listeners for smooth dragging outside element bounds
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
      id: Date.now().toString(),
      type: 'rack',
      name: rackForm.name,
      rows: parseInt(rackForm.rows),
      cols: parseInt(rackForm.cols),
      x: 100, y: 100, rotation: 0
    }]);
    setRackForm({ name: '', rows: '3', cols: '5' });
  };

  const addDoor = () => {
    setElements([...elements, { id: Date.now().toString(), type: 'door', x: 100, y: 100, rotation: 0 }]);
  };

  const addUser = () => {
    setElements([...elements, { id: Date.now().toString(), type: 'user', x: 100, y: 100, rotation: 0 }]);
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setElements(elements.map(el => 
      el.id === selectedId ? { ...el, rotation: (el.rotation + 90) % 360 } : el
    ));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // --- RENDERING HELPERS ---
  const renderCanvasElement = (el) => {
    const isSelected = selectedId === el.id;
    const baseStyle = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      transform: `rotate(${el.rotation}deg)`,
      cursor: draggingId === el.id ? 'grabbing' : 'grab',
    };

    if (el.type === 'rack') {
      const cellWidth = 35;
      const cellHeight = 35;
      return (
        <div 
          key={el.id} 
          style={baseStyle}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          className={`flex flex-col bg-white ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-gray-300 z-10' : 'border border-gray-500 z-0'}`}
        >
          <div className="absolute -top-6 left-0 text-sm font-bold text-gray-800 pointer-events-none whitespace-nowrap">
            {el.name}
          </div>
          <div className="flex border border-gray-600">
            {Array.from({ length: el.cols }).map((_, i) => (
              <div key={i} style={{ width: cellWidth, height: cellHeight }} className="border-r border-gray-400 last:border-r-0 bg-white" />
            ))}
          </div>
        </div>
      );
    }

    if (el.type === 'door') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
             className={`p-1 bg-gray-200 rounded-sm ${isSelected ? 'ring-2 ring-blue-600 z-10' : 'border border-gray-600 z-0'}`}>
          <DoorOpen size={40} className="text-black" />
        </div>
      );
    }

    if (el.type === 'user') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={(e) => handleMouseDown(e, el.id)}
             className={`p-1 bg-transparent ${isSelected ? 'ring-2 ring-blue-600 rounded-full z-10' : 'z-0'}`}>
          <User size={48} className="text-black fill-black" />
        </div>
      );
    }
  };

  return (
    <>
    <Navbar />
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-900">
      <AppSidebar active="rackManagement" />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center overflow-hidden">
                <User size={20} className="text-orange-600 mt-2" />
              </div>
              <span className="text-sm font-bold text-gray-700">User Profile</span>
            </div>
            <button className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition">
              <LogOut size={20} className="text-gray-700" />
            </button>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-6 flex flex-col space-y-6">
          
          <div className="flex gap-6">
            {/* CANVAS AREA */}
            <div 
              ref={canvasRef}
              className="flex-1 bg-[#d4d4d4] border-2 border-gray-400 rounded-sm relative h-[450px] overflow-hidden shadow-inner cursor-crosshair"
              // Fixed: Using onMouseDown so it doesn't interrupt element clicks
              onMouseDown={() => setSelectedId(null)} 
            >
              {elements.map(renderCanvasElement)}
            </div>

            {/* CONTROLS PANEL */}
            <div className="w-64 flex flex-col space-y-4 shrink-0">
              
              {/* Add Rack Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Name</label>
                  <input type="text" value={rackForm.name} onChange={e => setRackForm({...rackForm, name: e.target.value})} className="w-32 border border-gray-300 p-1 text-sm rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Rows</label>
                  <select value={rackForm.rows} onChange={e => setRackForm({...rackForm, rows: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">Columns</label>
                  <select value={rackForm.cols} onChange={e => setRackForm({...rackForm, cols: e.target.value})} className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    {[1,3,5,7,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={addRack} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md mt-2">
                  ADD
                </button>
              </div>

              {/* Add Users Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3 flex flex-col items-center">
                <div className="flex w-full justify-between items-center px-2">
                  <label className="text-sm font-bold text-gray-800">Users</label>
                  <select className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    <option>1</option><option>2</option>
                  </select>
                </div>
                <button onClick={addUser} className="w-24 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md">
                  ADD
                </button>
              </div>

              {/* Add Doors Form */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3 flex flex-col items-center">
                <div className="flex w-full justify-between items-center px-2">
                  <label className="text-sm font-bold text-gray-800">Doors</label>
                  <select className="w-16 border border-gray-300 p-1 text-sm rounded bg-gray-50">
                    <option>1</option><option>2</option>
                  </select>
                </div>
                <button onClick={addDoor} className="w-24 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded shadow-md">
                  ADD
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button onClick={rotateSelected} disabled={!selectedId} className="flex-1 bg-[#0056b3] disabled:opacity-50 hover:bg-blue-800 text-white font-bold py-2 rounded shadow-md flex items-center justify-center gap-1">
                  Rotate
                </button>
                <button onClick={deleteSelected} disabled={!selectedId} className="flex-1 bg-[#b33a00] disabled:opacity-50 hover:bg-red-800 text-white font-bold py-2 rounded shadow-md flex items-center justify-center gap-1">
                  Delete
                </button>
              </div>

            </div>
          </div>

          {/* DETAILED RACK VIEW */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {selectedElement && selectedElement.type === 'rack' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-extrabold text-gray-900">{selectedElement.name}</h2>
                <div className="bg-[#f0f0f0] p-4 rounded-lg inline-block border border-gray-300 w-full overflow-x-auto">
                  <div className="flex flex-col">
                    {Array.from({ length: selectedElement.rows }).map((_, rIdx) => (
                      <div key={rIdx} className="flex border-t border-l border-gray-500 first:border-t-0">
                        {Array.from({ length: selectedElement.cols }).map((_, cIdx) => (
                          <div 
                            key={cIdx} 
                            className="w-16 h-12 bg-white border-r border-b border-gray-500 shrink-0" 
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button className="bg-[#0056b3] hover:bg-blue-800 text-white font-bold py-2 px-8 rounded shadow-md">
                    Save
                  </button>
                  <button className="bg-[#b33a00] hover:bg-red-800 text-white font-bold py-2 px-8 rounded shadow-md">
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 font-medium">
                Select a rack on the canvas to view details
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
    </>
  );
}