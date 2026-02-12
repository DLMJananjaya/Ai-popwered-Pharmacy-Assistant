import React from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-white relative overflow-hidden font-sans text-gray-900">
      

      {/* --- BACKGROUND SHAPES (Google-style Circles) --- */}
      {/* 1. Large Teal Circle (Top Left) */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#00A99D]/10 rounded-full blur-3xl -z-10"></div>
      
      {/* 2. Soft Yellow Circle (Middle Right) */}
      <div className="absolute top-1/3 right-[-50px] w-72 h-72 bg-yellow-100/60 rounded-full blur-3xl -z-10"></div>
      
      {/* 3. Small Blue Circle (Bottom Left) */}
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-100/60 rounded-full blur-2xl -z-10"></div>


      <div className="container mx-auto px-30 h-screen flex items-center">
        
        {/* --- MAIN LAYOUT: SIDE BY SIDE --- */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-12">
          
          {/* LEFT SIDE: TEXT & FEATURES */}
          <div className="flex-1 space-y-8">
            
            {/* App Name */}
            <h1 className="text-60xl md:text-8xl font-bold tracking-tighter text-black">
              VAIDIA
            </h1>
            
            {/* Description */}
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Your intelligent pharmacy assistant. We use advanced AI to make managing your pharmacy simple, fast, and error-free.
            </p>

            {/* "What we are able to do" - Feature List */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block w-full max-w-md">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                What we can do
              </h3>
              <ul className="space-y-3">
                <FeatureItem text="Scan & Read Prescriptions" />
                <FeatureItem text="Manage Medicine Inventory" />
                <FeatureItem text="Track Sales & Revenue" />
                <FeatureItem text="Check Allergy Warnings" />
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/dashboard">
                <button className="bg-[#00A99D] hover:bg-[#008f85] text-white text-lg font-medium px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  Get Started
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: IMAGE */}
          <div className="flex-1 relative flex justify-center">
            {/* Decorative Circle behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00A99D]/5 rounded-full -z-10"></div>
            
            {/* Image Placeholder - Replace 'src' with your actual app screenshot if you have one */}
            <div className="relative w-full max-w-lg aspect-square bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden">
               <img 
                 src="/mohamed_hassan-doctor-9051173_1280.png" 
                //  src="/mohamed_hassan-pharmacist-9051167_1280.jpg" 
                  src="/mohamed_hassan-doctor-9374797_1280.png" 
                 alt="VAIDIA App Illustration"
                 className="w-full h-full object-cover scale-x-[-1]"
               />
            </div>
          </div>

        </div>
      </div>
    </main>
  </>);
}

// Simple Helper for the Checkmark List
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-lg font-medium text-gray-700">
      {/* Green Check Circle */}
      <div className="w-6 h-6 rounded-full bg-[#00A99D] flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      {text}
    </li>
  );
}