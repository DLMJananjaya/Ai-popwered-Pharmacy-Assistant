import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="w-full bg-transparent absolute top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* --- LOGO SECTION (Fixed) --- */}
        {/* We removed the <div> (green square) and <span> (text) completely */}
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo.png"       /* <--- Make sure your file is named logo.png in public folder */
            alt="PharmaAI Logo" 
            width={150}           /* Adjust size here */
            height={50}   
            className="h-12 w-auto object-contain" 
            priority      
          />
        </Link>
        {/* --------------------------- */}

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            Contact
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <button className="text-gray-900 font-medium hover:text-[#00A99D] transition-colors">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-[#00A99D] hover:bg-[#008f85] text-white px-5 py-2 rounded-xl font-medium transition-colors shadow-sm">
              Get Started
            </button>
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;