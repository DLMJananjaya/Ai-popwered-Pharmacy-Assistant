'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';
import TopHeader from '../components/TopHeader';
import { createWorker } from 'tesseract.js';

type Med = {
  name: string;
  strength: string | null;
  frequency: string | null;
  timing: string | null;
  notes: string | null;
};

type IdentifiedMed = {
  input: string;
  canonical: string | null;
  confidence: number;
  found: boolean;
  loading: boolean;
  method: string;
  alternatives: Array<{ canonical: string; score: number }>;
};

export default function PrescriptionPage() {
  // --- STATE MANAGEMENT ---
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [loading, setLoading] = useState(false);

  // OCR result
  const [ocrText, setOcrText] = useState<string>('');
  const [medicines, setMedicines] = useState<Med[]>([]);
  const [usageText, setUsageText] = useState<string>('');
  const [allergyText, setAllergyText] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // --- Manual Medicine Input ---
  const [manualMeds, setManualMeds] = useState<IdentifiedMed[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setManualMeds((prev) =>
        prev.map((m, i) =>
          i === index
            ? {
                ...m,
                canonical: result.canonical,
                confidence: result.confidence,
                found: result.found,
                loading: false,
                method: result.method || 'unknown',
                alternatives: result.alternatives || [],
              }
            : m
        )
      );
    } catch (err) {
      console.error('Medicine identify error:', err);
      setManualMeds((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, loading: false, found: false } : m
        )
      );
    }
  }, []);

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
        alternatives: [],
      };

      const newIndex = manualMeds.length;
      setManualMeds((prev) => [...prev, newMed]);
      setCurrentInput('');

      // Trigger identification
      identifyMedicineClient(currentInput.trim(), newIndex);

      // Keep focus on input
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
      setOcrText('');
      setMedicines([]);
      setUsageText('');
      setAllergyText('');
      setWarnings([]);

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

    // Use JPEG to reduce size (faster OCR)
    const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImage(imageUrl);

    // Stop camera stream
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    setIsCameraOpen(false);

    // Reset previous results
    setIsProcessed(false);
    setOcrText('');
    setMedicines([]);
    setUsageText('');
    setAllergyText('');
    setWarnings([]);
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

      // Reset previous results
      setOcrText('');
      setMedicines([]);
      setUsageText('');
      setAllergyText('');
      setWarnings([]);
    };
    reader.readAsDataURL(file);
  };

  // --- Helpers: basic extraction from OCR lines ---
  const extractMedicineLines = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 3);

    // Heuristic filters for medicine-like lines
    const medLike = lines.filter((l) => {
      const s = l.toLowerCase();
      return (
        /\b(mg|ml|mcg|g)\b/.test(s) || // doses
        /\b(tab|tabs|tablet|cap|caps|capsule|syrup|inj|ointment|cream|drops)\b/.test(s) || // forms
        /\b(bd|tds|od|nocte|qam|qpm|bid|tid|qid)\b/.test(s) || // frequency
        /\b\d+\b/.test(s) // has numbers
      );
    });

    // If nothing matched, just return first ~12 non-empty lines as fallback
    const finalLines = medLike.length ? medLike : lines.slice(0, 12);

    return finalLines.map((line) => ({
      name: line,
      strength: null,
      frequency: null,
      timing: null,
      notes: null,
    })) as Med[];
  };

  // 4) Process OCR (Tesseract)
  const handleProcess = async () => {
    if (!image) return alert('Capture or upload an image first.');

    try {
      setLoading(true);

      const worker = await createWorker('eng', 1, {
        logger: (m) => console.log(m),
        workerPath: 'https://unpkg.com/tesseract.js@5/dist/worker.min.js',
        corePath: 'https://unpkg.com/tesseract.js-core@5/tesseract-core.wasm.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      });

      const { data } = await worker.recognize(image);
      await worker.terminate();

      const text = data.text || '';
      setOcrText(text);

      // Fill UI from OCR (basic)
      const meds = extractMedicineLines(text);
      setMedicines(meds);

      setUsageText('Auto-filled from OCR text (please verify).');
      setAllergyText('Unknown (local OCR cannot analyze allergies).');
      setWarnings(['Please verify all medicines and doses with a pharmacist.']);

      setIsProcessed(true);
    } catch (err) {
      console.error('Tesseract error:', err);
      alert('OCR failed. Check Console (F12) for details.');
    } finally {
      setLoading(false);
    }
  };

  // Clear / Scan new
  const clearAll = () => {
    // stop camera if running
    const stream = (videoRef.current?.srcObject as MediaStream | null) ?? null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;

    setImage(null);
    setIsCameraOpen(false);
    setIsProcessed(false);

    setOcrText('');
    setMedicines([]);
    setUsageText('');
    setAllergyText('');
    setWarnings([]);
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

  const showTwoCols = true; // Always show both columns so user can add medicines without scanning

  return (
    <>
      {/* <Navbar /> */}

      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
        <AppSidebar active="prescription" />

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <TopHeader />

          {/* Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 z-10">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* DYNAMIC GRID */}
              <div className={`grid grid-cols-1 ${showTwoCols ? 'lg:grid-cols-2' : ''} gap-6 transition-all duration-500`}>
                {/* --- LEFT CARD: SCANNER --- */}
                <div
                  className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center transition-all duration-500 ${!showTwoCols ? 'max-w-2xl mx-auto w-full' : 'h-full'
                    }`}
                >
                  <h2 className="text-xl font-bold mb-4 text-black">Scan here!</h2>

                  {/* Viewport */}
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 overflow-hidden relative">
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    {/* Ready */}
                    {!isCameraOpen && !image && (
                      <div className="flex flex-col items-center justify-center h-full w-full gap-3">
                        <p className="text-gray-400 mb-2 italic">Scan or upload prescription</p>

                        <div className="flex gap-4">
                          <button
                            onClick={startCamera}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-md flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
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

                    {/* Captured/Uploaded */}
                    {image && <img src={image} alt="Captured" className="w-full h-full object-cover" />}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Bottom Buttons */}
                  <div className="flex gap-4">
                    {isCameraOpen ? (
                      <button onClick={takePhoto} className="bg-[#00A99D] hover:bg-[#008f85] text-white font-bold py-2 px-8 rounded-lg shadow-md">
                        Capture Photo
                      </button>
                    ) : image && !isProcessed ? (
                      <>
                        <button onClick={clearAll} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                          Clear
                        </button>
                        <button
                          onClick={handleProcess}
                          disabled={loading}
                          className="bg-[#00A99D] hover:bg-[#008f85] disabled:opacity-60 text-white font-bold py-2 px-8 rounded-lg shadow-md"
                        >
                          {loading ? 'Processing...' : 'Process'}
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
                          onChange={(e) => setCurrentInput(e.target.value)}
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
                              {/* Number */}
                              <span className="text-sm font-bold text-[#00A99D] w-6 text-right shrink-0">
                                {idx + 1}.
                              </span>

                              {/* Medicine info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800 truncate">
                                    {med.input}
                                  </span>
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

                              {/* Remove button */}
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

                    {/* --- Separator if both OCR and manual meds exist --- */}
                    {manualMeds.length > 0 && medicines.length > 0 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium">From Prescription Scan</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    )}

                    {/* --- OCR-Detected Medicines --- */}
                    <div className="space-y-4 text-sm md:text-base flex-1 overflow-y-auto">
                      {isProcessed && medicines.length === 0 && manualMeds.length === 0 ? (
                        <p className="text-gray-500 text-center">No medicines detected. Try a clearer photo.</p>
                      ) : (
                        medicines.map((m, idx) => <MedicineItem key={idx} text={m.name} />)
                      )}
                    </div>

                    {/* Optional: show raw OCR text for debugging */}
                    {isProcessed && (
                      <details className="mt-6">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-700">Show raw OCR text</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700">{ocrText}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* --- MODEL OUTPUT SECTION --- */}
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
                          <th className="px-4 py-3 font-semibold text-gray-600">Alternatives</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manualMeds.map((med, idx) => {
                          const badge = getConfidenceBadge(med.confidence, med.found);
                          return (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
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
                                    <span className="text-xs font-medium text-gray-600">
                                      {Math.round(med.confidence * 100)}%
                                    </span>
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Total: <strong className="text-gray-700">{manualMeds.length}</strong> medicine{manualMeds.length !== 1 ? 's' : ''}</span>
                      <span>Found: <strong className="text-emerald-600">{manualMeds.filter(m => m.found).length}</strong></span>
                      <span>Not Found: <strong className="text-red-500">{manualMeds.filter(m => !m.found && !m.loading).length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-100 border border-emerald-300"></span> Exact</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-100 border border-blue-300"></span> Fuzzy</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-100 border border-purple-300"></span> Semantic</span>
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
    </>
  );
}

/* --- Helper Components --- */

function MedicineItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#00A99D] mt-2 shrink-0"></div>
      <span className="text-gray-800 font-medium">{text}</span>
    </div>
  );
}
