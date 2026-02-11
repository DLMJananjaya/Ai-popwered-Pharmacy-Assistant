import React from 'react';
import Link from 'next/link';

const SignUpPage = () => {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-auto font-sans flex items-center justify-center py-10">
      
      {/* --- Background Decorative Shapes --- */}
      <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none z-0">
        <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full">
          <path d="M200,0 C350,200 100,400 500,250 L500,0 Z" fill="black" transform="translate(50, -50) scale(1.2)" />
          <path d="M200,0 C350,200 100,400 500,300 L500,0 Z" fill="#10B981" className="text-emerald-500" transform="translate(60, -20)" />
          <path d="M250,0 C400,180 200,350 500,280 L500,0 Z" fill="#34D399" className="text-emerald-400" opacity="0.8" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,200 C50,100 150,150 0,0 Z" fill="#10B981" />
          <path d="M-20,200 C30,120 100,180 -20,50 Z" fill="black" />
        </svg>
      </div>

      {/* --- Main Content Container --- */}
      <div className="container mx-auto px-6 relative z-10 w-full flex flex-col md:flex-row items-start justify-between max-w-6xl">
        
        {/* LEFT COLUMN: Header & Illustration */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8 md:sticky md:top-10">
          
          <div className="flex items-center space-x-4 mb-4 self-start">
            <div className="w-12 h-12 bg-gray-300 rounded-sm shrink-0"></div> 
            <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
              AI-Powered Pharmacy Assistant
            </h1>
          </div>

          <div className="relative w-full max-w-md">
            <img 
              src="/signupImage.png" 
              alt="Pharmacist illustration" 
              className="w-full h-auto object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Updated Sign Up Form */}
        <div className="w-full md:w-5/12 mt-8 md:mt-0 md:pl-12">
          <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            
            <h2 className="text-2xl font-medium text-black mb-6">
              Create a new account
            </h2>

            <form className="space-y-4">
              
              {/* Name */}
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Email Address */}
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Phone Number */}
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Pharmacy Name */}
              <input
                type="text"
                placeholder="Pharmacy Name"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Pharmacy Address */}
              <textarea
                rows={2}
                placeholder="Pharmacy Address"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white resize-none"
              />

              {/* New User Name */}
              <input
                type="text"
                placeholder="New User Name"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Confirm Password */}
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
              />

              {/* Sign Up Button */}
              <button
                type="button"
                className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-2"
              >
                Sign Up
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#00A99D] font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;