'use client';

import React, { useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import AppSidebar from '../components/AppSidebar';
import { createWorker } from 'tesseract.js';

type Med = {
  name: string;
  strength: string | null;
  frequency: string | null;
  timing: string | null;
  notes: string | null;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const showTwoCols = isProcessed;

  return (
    <>
      {/* <Navbar /> */}

      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-800 overflow-hidden">
        <AppSidebar active="prescription" />

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-0">
            <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full opacity-10">
              <path d="M400,500 C200,400 300,200 500,100 L500,500 Z" fill="#00A99D" />
            </svg>
          </div>

          {/* Header */}
          <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-black">AI-Powered Pharmacy Assistant</h1>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden border border-gray-200">
                <img src="https://avatar.iran.liara.run/public/boy?username=admin" alt="User" />
              </div>
              <span className="text-sm font-bold text-black">User Profile</span>
            </div>
          </header>

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

                {/* --- RIGHT CARD: MEDICINE LIST --- */}
                {isProcessed && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-xl font-bold mb-6 text-center text-black">Medicine List</h2>

                    <div className="space-y-4 text-sm md:text-base">
                      {medicines.length === 0 ? (
                        <p className="text-gray-500 text-center">No medicines detected. Try a clearer photo.</p>
                      ) : (
                        medicines.map((m, idx) => <MedicineItem key={idx} text={m.name} />)
                      )}
                    </div>

                    {/* Optional: show raw OCR text for debugging */}
                    <details className="mt-6">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-700">Show raw OCR text</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700">{ocrText}</pre>
                    </details>
                  </div>
                )}
              </div>

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
