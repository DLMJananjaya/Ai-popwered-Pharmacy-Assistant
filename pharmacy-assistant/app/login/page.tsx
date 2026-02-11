import React from 'react';
import Link from 'next/link'; // Import Link component

const LoginPage = () => {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden font-sans flex items-center justify-center py-10 md:py-0">
      
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
      <div className="container mx-auto px-6 relative z-10 h-full flex flex-col md:flex-row items-center justify-between max-w-6xl">
        
        {/* LEFT COLUMN: Header & Illustration */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8">
          
          <div className="flex items-center space-x-4 mb-4 md:mb-12 self-start">
            <div className="w-12 h-12 bg-gray-300 rounded-sm shrink-0"></div> 
            <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
              AI-Powered Pharmacy Assistant
            </h1>
          </div>

          <div className="relative w-full max-w-md">
            {/* Make sure this image is in your public folder */}
            <img 
              src="/Gemini_Generated_Image_7hsiwa7hsiwa7hsi.png" 
              alt="Pharmacist illustration" 
              className="w-full h-auto object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="w-full md:w-5/12 mt-12 md:mt-0 md:pl-12">
          <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            
            <h2 className="text-2xl font-medium text-black mb-8">
              Sign in to your account
            </h2>

            <form className="space-y-6">
              {/* User Name Input */}
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="User Name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                />
              </div>

              {/* Sign In Button */}
              <button
                type="button"
                className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-4"
              >
                Sign In
              </button>

              {/* --- NEW ADDITION: Sign Up Link --- */}
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-[#00A99D] font-semibold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
              {/* ---------------------------------- */}

            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;