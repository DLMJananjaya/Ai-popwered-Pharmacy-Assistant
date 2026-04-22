import React from 'react';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <>
    <Navbar />
   <main className="relative min-h-screen overflow-hidden font-sans text-gray-900">
      
      {/* --- BACKGROUND SHAPES (Google-style Circles) --- */}
      <div className="absolute left-[-140px] top-[-120px] -z-10 h-96 w-96 rounded-full bg-[#00A99D]/15 blur-3xl"></div>
      <div className="absolute right-[-90px] top-1/4 -z-10 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"></div>
      <div className="absolute bottom-0 left-8 -z-10 h-56 w-56 rounded-full bg-yellow-100/70 blur-3xl"></div>

      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center px-6 py-10 md:px-10 lg:px-16">
        
        <div className="flex w-full flex-col items-center justify-between gap-12 lg:flex-row lg:gap-16">
          
          {/* LEFT SIDE */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            
            <h1 className="text-5xl font-extrabold tracking-tight text-black sm:text-6xl lg:text-7xl">
              VAIDIA
            </h1>
            
            <p className="mx-auto max-w-xl text-base leading-relaxed text-gray-700 sm:text-lg lg:mx-0">
              Your intelligent pharmacy assistant. We use advanced AI to make managing your pharmacy simple, fast, and error-free.
            </p>

            <div className="inline-block w-full max-w-xl rounded-2xl border border-gray-200 bg-white/85 p-6 shadow-lg shadow-slate-200/50 backdrop-blur">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
                What we can do
              </h3>
              <ul className="space-y-3">
                <FeatureItem text="Scan & Read Prescriptions" />
                <FeatureItem text="Manage Medicine Inventory" />
                <FeatureItem text="Track Sales & Revenue" />
                <FeatureItem text="Check Allergy Warnings" />
              </ul>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="relative flex flex-1 justify-center">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00A99D]/10 blur-2xl sm:h-[430px] sm:w-[430px]"></div>
            
            <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-2xl shadow-slate-300/60 sm:max-w-md lg:max-w-lg">
               <img 
                 src="/mohamed_hassan-doctor-9051173_1280.png" 
                 alt="VAIDIA App Illustration"
                 className="h-full w-full object-cover scale-x-[-1]"
               />
            </div>
          </div>

        </div>
      </div>
    </main>
  </>);
}

// Helper Component
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-base font-medium text-gray-700 sm:text-lg">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00A99D]">
        <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {text}
    </li>
  );
}