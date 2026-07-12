'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '../components/AppSidebar';
import TopHeader from '../components/TopHeader';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

type Med = {
  name: string;
  strength: string | null;
  frequency: string | null;
  timing: string | null;
  notes: string | null;
};

type SideEffects = {
  found: boolean;
  common: string | null;
  warnings: string | null;
  source: string | null;
};

type InventoryMatch = {
  inventoryId: string;
  name: string;
  strength: string;
  qty: number;
  unitPrice: number;
  matchConfidence: number;
  matchMethod: 'alias' | 'fuzzy' | 'containment';
};

type IdentifiedMed = {
  input: string;
  canonical: string | null;
  confidence: number;
  found: boolean;
  loading: boolean;
  method: string;
  manufacturers: string | null;
  alternatives: Array<{ canonical: string; score: number }>;
  sideEffects: SideEffects | null;
  inventoryMatch: InventoryMatch | null;
  inventoryLoading: boolean;
};

type InvItem = {
  id: string;
  name: string;
  strength: string;
  qty: number;
  unitPrice: number;
};

// Helper: crop an image on a canvas and return data URL
function getCroppedImageDataUrl(
  imgEl: HTMLImageElement,
  crop: PixelCrop
): string {
  const canvas = document.createElement('canvas');
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    imgEl,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function PrescriptionPage() {
  // --- STATE MANAGEMENT ---
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);

  // Pan / Zoom state for image viewer
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Gemini-parsed result
  const [ocrText, setOcrText] = useState<string>('');
  const [medicines, setMedicines] = useState<Med[]>([]);
  const [usageText, setUsageText] = useState<string>('');
  const [allergyText, setAllergyText] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  // --- Manual Medicine Input ---
  const [manualMeds, setManualMeds] = useState<IdentifiedMed[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

    const [sendingToBilling, setSendingToBilling] = useState(false);
  const [billingMatchCount, setBillingMatchCount] = useState<number | null>(null);

  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Match identified medicines against inventory ---
  const matchInventory = useCallback(async (meds: IdentifiedMed[]) => {
    // Only match medicines that have been identified
    const toMatch = meds.filter((m) => m.found && m.canonical && !m.loading);
    if (toMatch.length === 0) return;

    // Mark all as inventory loading
    setManualMeds((prev) =>
      prev.map((m) =>
        m.found && m.canonical && !m.loading
          ? { ...m, inventoryLoading: true }
          : m
      )
    );

    try {
      const res = await fetch('/api/inventory/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: meds.map((m) => ({
            canonical: m.canonical,
            input: m.input,
            alternatives: m.alternatives,
          })),
        }),
      });

      if (!res.ok) throw new Error('Inventory match API error');

      const { matches } = await res.json();

      setManualMeds((prev) =>
        prev.map((m, i) => ({
          ...m,
          inventoryMatch: matches[i] || null,
          inventoryLoading: false,
        }))
      );
    } catch (err) {
      console.error('Inventory match error:', err);
      setManualMeds((prev) =>
        prev.map((m) => ({ ...m, inventoryLoading: false }))
      );
    }
  }, []);

  // --- Identify medicine via API ---
  const identifyMedicineClient = useCallback(async (name: string, index: number) => {
    try {
      const res = await fetch('/api/medicine/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error('API error');

      const result = await res.json();

      setManualMeds((prev) => {
        const updated = prev.map((m, i) =>
          i === index
            ? {
                ...m,
                canonical: result.canonical,
                confidence: result.confidence,
                found: result.found,
                loading: false,
                method: result.method || 'unknown',
                manufacturers: result.manufacturers || null,
                alternatives: result.alternatives || [],
                sideEffects: result.side_effects || null,
              }
            : m
        );

        // Trigger inventory matching once all meds are done loading
        const allDone = updated.every((m) => !m.loading);
        if (allDone) {
          setTimeout(() => matchInventory(updated), 100);
        }

        return updated;
      });
    } catch (err) {
      console.error('Medicine identify error:', err);
      setManualMeds((prev) => {
        const updated = prev.map((m, i) =>
          i === index ? { ...m, loading: false, found: false } : m
        );

        const allDone = updated.every((m) => !m.loading);
        if (allDone) {
          setTimeout(() => matchInventory(updated), 100);
        }

        return updated;
      });
    }
  }, [matchInventory]);

  // --- Handle Enter key to add medicine ---
  const handleMedInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      e.preventDefault();

      const newMed: IdentifiedMed = {
        input: currentInput.trim(),
        canonical: null,
        confidence: 0,
        found: false,
        loading: true,
        method: '',
        manufacturers: null,
        alternatives: [],
        sideEffects: null,
        inventoryMatch: null,
        inventoryLoading: false,
      };

      const newIndex = manualMeds.length;
      setManualMeds((prev) => [...prev, newMed]);
      setCurrentInput('');

      identifyMedicineClient(currentInput.trim(), newIndex);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // --- Remove a manually added medicine ---
  const removeManualMed = (index: number) => {
    setManualMeds((prev) => prev.filter((_, i) => i !== index));
  };



  // 1) Start Camera
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setImage(null);
      setIsProcessed(false);
      setIsCropping(false);
      setCrop(undefined);
      setCompletedCrop(null);
      resetResults();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
      setIsCameraOpen(false);
    }
  };

  const resetResults = () => {
    setOcrText('');
    setMedicines([]);
    setUsageText('');
    setAllergyText('');
    setWarnings([]);
    setPatientName(null);
    setDoctorName(null);
    setPrescriptionDate(null);
    setDiagnosis(null);
    setManualMeds([]);
    setBillingMatchCount(null);
  };

  // 2) Capture Photo
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      alert('Camera not ready yet. Wait 1 second and try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImage(imageUrl);

    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    setIsCameraOpen(false);

    setIsProcessed(false);
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
    resetResults();
  };

  // 3) Upload Image
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;

      setImage(event.target.result as string);
      setIsProcessed(false);
      setIsCameraOpen(false);
      setIsCropping(false);
      setCrop(undefined);
      setCompletedCrop(null);
      resetResults();
    };
    reader.readAsDataURL(file);
  };

  // --- Pan / Zoom handlers ---
  const resetPanZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCropping) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  // Touch pan
  const touchStart = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStart.current = { tx: e.touches[0].clientX, ty: e.touches[0].clientY, px: pan.x, py: pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !touchStart.current) return;
    e.preventDefault();
    setPan({
      x: touchStart.current.px + (e.touches[0].clientX - touchStart.current.tx),
      y: touchStart.current.py + (e.touches[0].clientY - touchStart.current.ty),
    });
  };

  const handleTouchEnd = () => {
    touchStart.current = null;
  };

  // Reset pan/zoom when a new image is loaded
  useEffect(() => {
    if (image) resetPanZoom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  // --- Crop controls ---
  const startCropping = () => {
    setIsCropping(true);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const applyCrop = () => {
    if (!completedCrop || !cropImgRef.current) return;
    if (completedCrop.width < 10 || completedCrop.height < 10) {
      alert('Please select a larger area to crop.');
      return;
    }
    const croppedUrl = getCroppedImageDataUrl(cropImgRef.current, completedCrop);
    setImage(croppedUrl);
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
    resetPanZoom();
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  // 4) Process with Gemini Flash
  const handleProcess = async () => {
    if (!image) return alert('Capture or upload an image first.');

    try {
      setLoading(true);

      const res = await fetch('/api/prescription/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to read prescription');
      }

      const { data } = await res.json();

      const meds: Med[] = (data.medicines || []).map((m: Med) => ({
        name: m.name || 'Unknown',
        strength: m.strength || null,
        frequency: m.frequency || null,
        timing: m.timing || null,
        notes: m.notes || null,
      }));
      setMedicines(meds);

      // Automatically add Gemini-extracted medicines to manualMeds to trigger identification
      if (meds.length > 0) {
        const existingCount = manualMeds.length;
        const newMeds: IdentifiedMed[] = meds.map((m) => ({
          input: m.name,
          canonical: null,
          confidence: 0,
          found: false,
          loading: true,
          method: '',
          manufacturers: null,
          alternatives: [],
          sideEffects: null,
          inventoryMatch: null,
          inventoryLoading: false,
        }));

        setManualMeds((prev) => [...prev, ...newMeds]);

        meds.forEach((m, idx) => {
          identifyMedicineClient(m.name, existingCount + idx);
        });
      }

      setOcrText(data.rawText || '');
      setUsageText(data.usageInstructions || 'No usage instructions detected.');
      setAllergyText(data.allergyWarnings || 'No allergy information detected.');
      setWarnings(data.warnings || []);
      setPatientName(data.patientName || null);
      setDoctorName(data.doctorName || null);
      setPrescriptionDate(data.date || null);
      setDiagnosis(data.diagnosis || null);

      setIsProcessed(true);
    } catch (err) {
      console.error('Gemini prescription read error:', err);
      alert(`Failed to read prescription: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear / Scan new
  const clearAll = () => {
    const stream = (videoRef.current?.srcObject as MediaStream | null) ?? null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;

    setImage(null);
    setIsCameraOpen(false);
    setIsProcessed(false);
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
    resetResults();
  };

  const scanNew = () => {
    clearAll();
    startCamera();
  };

  // Confidence badge color helper
  const getConfidenceBadge = (confidence: number, found: boolean) => {
    if (!found) return { color: 'bg-red-100 text-red-700', label: 'Not found' };
    if (confidence >= 0.9) return { color: 'bg-emerald-100 text-emerald-700', label: `${Math.round(confidence * 100)}%` };
    if (confidence >= 0.7) return { color: 'bg-amber-100 text-amber-700', label: `${Math.round(confidence * 100)}%` };
    return { color: 'bg-red-100 text-red-700', label: `${Math.round(confidence * 100)}%` };
  };

  const showTwoCols = true;

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
        <AppSidebar active="prescription" />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <TopHeader />

          <main className="flex-1 overflow-y-auto p-6 z-10">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Gemini AI Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl px-4 py-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Powered by <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Google Gemini 3.1 Flash-Lite</span> — AI-powered prescription reading
                </span>
              </div>

              {/* DYNAMIC GRID */}
              <div className={`grid grid-cols-1 ${showTwoCols ? 'lg:grid-cols-2' : ''} gap-6 transition-all duration-500`}>
                {/* --- LEFT CARD: SCANNER --- */}
                <div
                  className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center transition-all duration-500 ${!showTwoCols ? 'max-w-2xl mx-auto w-full' : 'h-full'}`}
                >
                  <h2 className="text-xl font-bold mb-4 text-black">Scan here!</h2>

                  {/* Viewport */}
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 overflow-hidden relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    {/* Ready state */}
                    {!isCameraOpen && !image && (
                      <div className="flex flex-col items-center justify-center h-full w-full gap-3">
                        <p className="text-gray-400 mb-2 italic">Scan or upload prescription</p>
                        <div className="flex gap-4">
                          <button
                            onClick={startCamera}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-md flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Camera
                          </button>
                          <button
                            onClick={triggerFileSelect}
                            className="bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Camera */}
                    {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}

                    {/* Pannable / Zoomable image viewer */}
                    {image && !isCameraOpen && (
                      <div
                        ref={viewerRef}
                        className="w-full h-full relative overflow-hidden"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <img
                          src={image}
                          alt="Captured"
                          draggable={false}
                          style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                        {/* Zoom controls overlay */}
                        <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
                          <button
                            onClick={(e: React.ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.25)); }}
                            className="w-7 h-7 rounded-md bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg leading-none backdrop-blur-sm transition"
                            title="Zoom in"
                          >+</button>
                          <button
                            onClick={(e: React.ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }}
                            className="w-7 h-7 rounded-md bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg leading-none backdrop-blur-sm transition"
                            title="Zoom out"
                          >−</button>
                          <button
                            onClick={(e: React.ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); resetPanZoom(); }}
                            className="w-7 h-7 rounded-md bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
                            title="Reset view"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          {zoom !== 1 && (
                            <span className="text-[10px] text-white/80 text-center bg-black/40 rounded px-1">{Math.round(zoom * 100)}%</span>
                          )}
                        </div>
                        {/* Drag hint */}
                        {zoom > 1 && (
                          <div className="absolute top-2 left-2 text-[10px] text-white bg-black/40 rounded px-2 py-0.5 backdrop-blur-sm pointer-events-none">
                            Drag to pan
                          </div>
                        )}
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>


                  {/* Bottom Buttons */}
                  <div className="flex gap-3 flex-wrap justify-center">
                    {isCameraOpen ? (
                      <button onClick={takePhoto} className="bg-[#00A99D] hover:bg-[#008f85] text-white font-bold py-2 px-8 rounded-lg shadow-md">
                        Capture Photo
                      </button>
                    ) : image && !isProcessed ? (
                      <>
                        <button onClick={clearAll} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg shadow-md text-sm">
                          Clear
                        </button>
                        <button
                          onClick={startCropping}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-lg shadow-md flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Crop
                        </button>
                        <button
                          onClick={handleProcess}
                          disabled={loading}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-60 text-white font-bold py-2 px-6 rounded-lg shadow-md flex items-center gap-2 text-sm"
                        >
                          {loading ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                              Analyzing with Gemini...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                              Read with Gemini AI
                            </>
                          )}
                        </button>
                      </>
                    ) : image && isProcessed ? (
                      <button onClick={scanNew} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                        Scan New Prescription
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* --- RIGHT CARD: MEDICINE LIST + MANUAL INPUT --- */}
                {showTwoCols && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-center text-black">Medicine List</h2>

                    {/* --- Manual Medicine Input Section --- */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-[#00A99D] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700">Add Medicines Manually</h3>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#00A99D] select-none">
                          {manualMeds.length + 1}.
                        </span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={currentInput}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentInput(e.target.value)}
                          onKeyDown={handleMedInputKeyDown}
                          placeholder="Type medicine name & press Enter"
                          className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/20 outline-none transition-all bg-gray-50 hover:bg-white text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5 ml-1">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Enter</kbd> to add &mdash; medicines are auto-identified
                      </p>
                    </div>

                    {/* --- Manually Added Medicines --- */}
                    {manualMeds.length > 0 && (
                      <div className="space-y-2 mb-5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Added Medicines</h4>
                        {manualMeds.map((med, idx) => {
                          const badge = getConfidenceBadge(med.confidence, med.found);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition-colors group"
                            >
                              <span className="text-sm font-bold text-[#00A99D] w-6 text-right shrink-0">
                                {idx + 1}.
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800 truncate">{med.input}</span>
                                  {med.loading ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-medium">
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                      </svg>
                                      Identifying...
                                    </span>
                                  ) : med.found && med.canonical ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.color}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      {badge.label}
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.color}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {badge.label}
                                    </span>
                                  )}
                                </div>
                                {med.found && med.canonical && med.canonical !== med.input && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    → <span className="font-medium text-emerald-600">{med.canonical}</span>
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeManualMed(idx)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* --- Separator --- */}
                    {manualMeds.length > 0 && medicines.length > 0 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium">From Prescription Scan (Gemini AI)</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    )}

                    {/* --- Gemini-Detected Medicines --- */}
                    <div className="space-y-3 text-sm md:text-base flex-1 overflow-y-auto">
                      {isProcessed && medicines.length === 0 && manualMeds.length === 0 ? (
                        <p className="text-gray-500 text-center">No medicines detected. Try a clearer photo.</p>
                      ) : (
                        medicines.map((m, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-bold text-purple-600 shrink-0">{idx + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800">{m.name}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {m.strength && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-medium">
                                      💊 {m.strength}
                                    </span>
                                  )}
                                  {m.frequency && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[11px] font-medium">
                                      🕐 {m.frequency}
                                    </span>
                                  )}
                                  {m.timing && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[11px] font-medium">
                                      ⏰ {m.timing}
                                    </span>
                                  )}
                                </div>
                                {m.notes && (
                                  <p className="text-[11px] text-gray-500 mt-1 italic">📝 {m.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Raw text */}
                    {isProcessed && (
                      <details className="mt-6">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-700">Show raw AI-extracted text</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700">{ocrText}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* --- PRESCRIPTION DETAILS (from Gemini) --- */}
              {isProcessed && (patientName || doctorName || prescriptionDate || diagnosis) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Prescription Details</h3>
                      <p className="text-white/70 text-xs">Extracted by Gemini AI</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                    {patientName && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</p>
                        <p className="text-sm font-medium text-gray-800">{patientName}</p>
                      </div>
                    )}
                    {doctorName && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Doctor</p>
                        <p className="text-sm font-medium text-gray-800">{doctorName}</p>
                      </div>
                    )}
                    {prescriptionDate && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-800">{prescriptionDate}</p>
                      </div>
                    )}
                    {diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Diagnosis</p>
                        <p className="text-sm font-medium text-gray-800">{diagnosis}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- MODEL OUTPUT SECTION (Manual Meds Table) --- */}
              {manualMeds.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-gradient-to-r from-[#00A99D] to-[#00C9B7] px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Medicine Identifier — Model Output</h3>
                      <p className="text-white/70 text-xs">Results from AI-powered medicine identification</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 font-semibold text-gray-600 w-10">#</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Input</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Canonical Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-center">Confidence</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-center">Method</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Manufacturers</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Alternatives</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Inventory Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manualMeds.map((med, idx) => {
                          const badge = getConfidenceBadge(med.confidence, med.found);
                          return (
                            <React.Fragment key={idx}>
                              <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-[#00A99D]">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{med.input}</td>
                                <td className="px-4 py-3">
                                  {med.loading ? (
                                    <span className="inline-flex items-center gap-1.5 text-blue-500">
                                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                      </svg>
                                      Identifying...
                                    </span>
                                  ) : med.found && med.canonical ? (
                                    <span className="font-semibold text-emerald-700">{med.canonical}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!med.loading && (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full transition-all duration-500 ${
                                            med.confidence >= 0.9 ? 'bg-emerald-500' :
                                            med.confidence >= 0.7 ? 'bg-amber-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.round(med.confidence * 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-medium text-gray-600">{Math.round(med.confidence * 100)}%</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!med.loading && med.method && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                      med.method === 'exact' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      med.method === 'fuzzy' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      med.method === 'semantic' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                      'bg-gray-50 text-gray-600 border border-gray-200'
                                    }`}>
                                      {med.method}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {!med.loading && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.color}`}>
                                      {med.found ? (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                      {med.found ? 'Found' : 'Not Found'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {med.loading ? (
                                    <span className="text-gray-300 text-xs">—</span>
                                  ) : med.manufacturers ? (
                                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{med.manufacturers}</span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {!med.loading && med.alternatives && med.alternatives.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {med.alternatives.slice(0, 2).map((alt, ai) => (
                                        <span key={ai} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                                          {alt.canonical}
                                          <span className="text-gray-400">({Math.round((alt.score ?? 0) * 100)}%)</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : !med.loading ? (
                                    <span className="text-gray-300 text-xs">—</span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3">
                                  {med.loading ? (
                                    <span className="text-gray-300 text-xs">—</span>
                                  ) : med.inventoryLoading ? (
                                    <span className="inline-flex items-center gap-1.5 text-blue-500">
                                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                      </svg>
                                      Matching...
                                    </span>
                                  ) : med.inventoryMatch ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {med.inventoryMatch.name}
                                      </span>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>Qty: <strong className="text-gray-700">{med.inventoryMatch.qty}</strong></span>
                                        <span>LKR <strong className="text-gray-700">{med.inventoryMatch.unitPrice.toFixed(2)}</strong></span>
                                        <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                                          med.inventoryMatch.matchMethod === 'alias' ? 'bg-emerald-50 text-emerald-600' :
                                          med.inventoryMatch.matchMethod === 'containment' ? 'bg-blue-50 text-blue-600' :
                                          'bg-purple-50 text-purple-600'
                                        }`}>{med.inventoryMatch.matchMethod}</span>
                                      </div>
                                    </div>
                                  ) : med.found ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[11px] font-medium">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Not in stock
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                              </tr>

                              {/* --- SIDE EFFECTS ROW (NEW) --- */}
                              {!med.loading && med.found && med.sideEffects?.found && (
                                <tr className="bg-gray-50/70 border-b border-gray-100">
                                  <td></td>
                                  <td colSpan={8} className="px-4 py-3">
                                    <div className="space-y-1.5">
                                      <div className="text-xs">
                                        <span className="font-semibold text-gray-600">Common side effects: </span>
                                        <span className="text-gray-600">{med.sideEffects.common}</span>
                                      </div>
                                      <div className="text-xs bg-red-50 border border-red-200 rounded px-2 py-1.5 inline-block">
                                        <span className="font-semibold text-red-700">⚠ Warning: </span>
                                        <span className="text-red-600">{med.sideEffects.warnings}</span>
                                      </div>
                                      <div className="text-[10px] text-gray-400">Source: {med.sideEffects.source}</div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              {!med.loading && med.found && med.sideEffects && !med.sideEffects.found && (
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                  <td></td>
                                  <td colSpan={7} className="px-4 py-3 text-xs text-gray-400 italic">
                                    Side effects not yet available for this medicine — please verify with pharmacist.
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Total: <strong className="text-gray-700">{manualMeds.length}</strong> medicine{manualMeds.length !== 1 ? 's' : ''}</span>
                      <span>Found: <strong className="text-emerald-600">{manualMeds.filter(m => m.found).length}</strong></span>
                      <span>In Stock: <strong className="text-teal-600">{manualMeds.filter(m => m.inventoryMatch).length}</strong></span>
                      <span>Not Found: <strong className="text-red-500">{manualMeds.filter(m => !m.found && !m.loading).length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-100 border border-emerald-300"></span> Exact</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-100 border border-blue-300"></span> Fuzzy</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-100 border border-purple-300"></span> Semantic</span>
                    </div>
                  </div>

                  {/* --- SEND TO BILLING (NEW) --- */}
                  <div className="px-6 py-4 bg-teal-50 border-t-2 border-teal-200">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-teal-800">Send to Billing</h4>
                        <p className="text-xs text-teal-600 mt-0.5">
                          Medicines found in your inventory will be pre-loaded into the billing page.
                        </p>
                        {billingMatchCount !== null && billingMatchCount === 0 && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">⚠ None of the identified medicines are in your inventory. Add them first.</p>
                        )}
                        {billingMatchCount !== null && billingMatchCount > 0 && (
                          <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {billingMatchCount} medicine{billingMatchCount !== 1 ? 's' : ''} matched in inventory — opening billing...</p>
                        )}
                      </div>
                      <button
                        id="send-to-billing-btn"
                        disabled={sendingToBilling || manualMeds.filter(m => m.inventoryMatch && !m.loading).length === 0}
                        onClick={() => {
                          setSendingToBilling(true);
                          setBillingMatchCount(null);

                          // Use the pre-matched inventory items from AI pipeline
                          const matched = manualMeds
                            .filter((m) => m.inventoryMatch && !m.loading)
                            .map((m) => ({
                              inventoryId: m.inventoryMatch!.inventoryId,
                              name: m.inventoryMatch!.name,
                              qty: 1,
                              unitPrice: m.inventoryMatch!.unitPrice,
                            }));

                          setBillingMatchCount(matched.length);

                          if (matched.length > 0) {
                            sessionStorage.setItem('prescriptionBillItems', JSON.stringify(matched));
                            sessionStorage.setItem('prescriptionMeds', JSON.stringify(manualMeds));
                            sessionStorage.setItem('prescriptionPatientName', patientName || "");
                            setTimeout(() => router.push('/billing'), 800);
                          }

                          setSendingToBilling(false);
                        }}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2 text-sm whitespace-nowrap transition-all"
                      >
                        {sendingToBilling ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Checking inventory...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Send to Billing
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- BOTTOM SECTION: WARNINGS --- */}
              {isProcessed && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-black">Usage & Allergy Warnings :</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-4 w-1/4 align-top font-bold text-black border-r border-gray-200">Usage :</td>
                          <td className="p-4 text-gray-700">{usageText || 'No usage information detected.'}</td>
                        </tr>
                        <tr>
                          <td className="p-4 w-1/4 font-bold text-black border-r border-gray-200">Allergy Status :</td>
                          <td className="p-4">
                            <div className="text-gray-700">{allergyText || 'Unknown.'}</div>
                            {warnings.length > 0 && (
                              <ul className="mt-2 list-disc pl-5 text-gray-700">
                                {warnings.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {/* ======= CROP MODAL OVERLAY ======= */}
      {isCropping && image && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Crop Prescription</h2>
                <p className="text-white/50 text-xs">Drag to select the area you want to keep</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelCrop}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                disabled={!completedCrop}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Crop
              </button>
            </div>
          </div>

          {/* Crop area */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="max-w-full max-h-full flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                style={{ maxHeight: 'calc(100vh - 120px)', maxWidth: '100%' }}
              >
                <img
                  ref={cropImgRef}
                  src={image}
                  alt="Crop"
                  style={{
                    maxHeight: 'calc(100vh - 120px)',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </ReactCrop>
            </div>
          </div>

          {/* Footer hint */}
          {!completedCrop && (
            <div className="shrink-0 flex items-center justify-center px-6 py-3 bg-amber-500/10 border-t border-amber-500/20">
              <svg className="w-4 h-4 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-amber-300 text-sm">Click and drag on the image to select the crop area, then click <strong>Apply Crop</strong></span>
            </div>
          )}
        </div>
      )}
    </>
  );
}