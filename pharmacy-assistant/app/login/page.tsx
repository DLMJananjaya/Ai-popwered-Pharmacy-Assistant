import React from 'react';

const LoginPage = () => {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden font-sans flex items-center justify-center">
      
      {/* --- Background Decorative Shapes --- */}
      
      {/* Top Right Curves */}
      <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none z-0">
        <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full">
          {/* Black Swoosh */}
          <path 
            d="M200,0 C350,200 100,400 500,250 L500,0 Z" 
            fill="black" 
            transform="translate(50, -50) scale(1.2)"
          />
          {/* Teal Swoosh Main */}
          <path 
            d="M200,0 C350,200 100,400 500,300 L500,0 Z" 
            fill="#10B981" 
            className="text-emerald-500" 
            transform="translate(60, -20)"
          />
           {/* Light Teal Gradient/Layer */}
           <path 
            d="M250,0 C400,180 200,350 500,280 L500,0 Z" 
            fill="#34D399" 
            className="text-emerald-400" 
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Bottom Left Curves (Subtle peek) */}
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,200 C50,100 150,150 0,0 Z" fill="#10B981" />
          <path d="M-20,200 C30,120 100,180 -20,50 Z" fill="black" />
        </svg>
      </div>

      {/* --- Main Content Container --- */}
      <div className="container mx-auto px-6 py-8 relative z-10 h-full flex flex-col md:flex-row items-center justify-between max-w-6xl">
        
        {/* LEFT COLUMN: Header & Illustration */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8">
          
          {/* Header Title */}
          <div className="flex items-center space-x-4 mb-4 md:mb-12 self-start">
            {/* Placeholder for Logo Icon */}
            <div className="w-12 h-12 bg-gray-300 rounded-sm shrink-0"></div> 
            <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
              AI-Powered Pharmacy Assistant
            </h1>
          </div>

          {/* Illustration Area */}
          <div className="relative w-full max-w-md">
            {/* Note: Replace 'src' with your actual pharmacist image asset */}
            <img 
              src="Gemini_Generated_Image_7hsiwa7hsiwa7hsi.png" 
              alt="Pharmacist standing by shelves" 
              className="w-full h-auto object-contain rounded-lg"
            />
            {/* Fallback visual if no image: A blue box to mimic the shelf layout */}
            {/* <div className="w-full h-96 bg-blue-50 rounded-lg border-2 border-blue-100 flex items-center justify-center text-blue-300">
               Image Asset Goes Here
            </div> */}
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="w-full md:w-5/12 mt-12 md:mt-0 md:pl-12">
          <div className="bg-white/80 backdrop-blur-sm p-2 md:p-8 rounded-2xl">
            
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
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;