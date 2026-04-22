"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
      <nav className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/80 backdrop-blur-xl shadow-sm">
       <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

        {/* --- LOGO SECTION START --- */}
        <Link href="/" className="ml-1 flex items-center md:ml-2">
          <Image 
            src="/logo.png"
            alt="PharmaAI Logo" 
            width={100}
            height={60}  
            className="h-16 w-auto object-contain sm:h-20"
            priority
          />
        </Link>
        {/* --- LOGO SECTION END --- */}

        {/* Desktop Menu */}
        <div className="hidden items-center space-x-6 lg:flex">
          <Link href="/" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#00A99D]">
            Home
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#00A99D]">
            About Us
          </Link>
          <Link href="/prescription" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#00A99D]">
            Scan
          </Link>
          <Link href="/rackManagement" className="text-sm font-medium text-gray-600 transition-colors hover:text-[#00A99D]">
            Rack Management
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link href="/login">
            <button className="rounded-xl border border-[#00A99D] bg-white px-4 py-2 text-sm font-semibold text-[#008f85] transition hover:bg-[#ecfffd] sm:px-5 sm:text-base">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="rounded-xl bg-[#00A99D] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#00A99D]/30 transition hover:bg-[#008f85] hover:shadow-lg hover:shadow-[#00A99D]/35 sm:px-5 sm:text-base">
              Get Started
            </button>
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;