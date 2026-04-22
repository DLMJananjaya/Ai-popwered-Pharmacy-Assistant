import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
      <nav className="w-full bg-transparent backdrop-blur-md sticky top-0 z-50">
       <div className="container mx-auto px-6 h-16 flex items-center justify-between">

        {/* --- LOGO SECTION START --- */}
        <Link href="/" className="flex items-center ml-5 ">
          <Image 
            src="/logo.png"       
            alt="PharmaAI Logo" 
            width={100}           
            height={60}  
            className="h-20 w-auto object-contain" 
            priority
          />
        </Link>
        {/* --- LOGO SECTION END --- */}

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            About Us
          </Link>
          <Link href="/prescription" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            Scan
          </Link>
          <Link href="/rackManagement" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
            Rack Management
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