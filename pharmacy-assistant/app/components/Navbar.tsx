// import React from 'react';
// import Link from 'next/link';

// const Navbar = () => {
//   return (
//     <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
//       <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
//         Logo
//         <Link href="/" className="flex items-center gap-2"> 
//           <div className="w-8 h-8 bg-[#00A99D] rounded-md"></div>
//           <span className="text-xl font-bold tracking-tight text-gray-900">
//              V<span className="text-[#00A99D]">AI</span>DIA  
            
//           </span>
//           </Link>

        

//         {/* Desktop Menu */}
//         <div className="hidden md:flex items-center space-x-8">
//           <Link href="/" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
//             Home
//           </Link>
//           <Link href="/about" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
//             About Us
//           </Link>
//           <Link href="/contact" className="text-gray-600 hover:text-[#00A99D] font-medium transition-colors">
//             Contact
//           </Link>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex items-center space-x-4">
//           <Link href="/login">
//             <button className="text-gray-900 font-medium hover:text-[#00A99D] transition-colors">
//               Log In
//             </button>
//           </Link>
//           <Link href="/signup">
//             <button className="bg-[#00A99D] hover:bg-[#008f85] text-white px-5 py-2 rounded-xl font-medium transition-colors shadow-sm">
//               Get Started
//             </button>
//           </Link>
//         </div>

//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    // This is the style you asked for: Sticky, White, Blur, with a Bottom Border
      // <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      //   <div className="container mx-auto px-6 h-16 flex items-center justify-between">
      <nav className="w-full bg-transparent backdrop-blur-md border-b sticky top-0 z-50">
       <div className="container mx-auto px-6 h-16 flex items-center justify-between">

        {/* --- LOGO SECTION START --- */}
        <Link href="/" className="flex items-center ml-5 ">
          {/* Replaced the Green Box and Text with just the Image */}
          <Image 
            src="/logo.png"       // <--- Make sure your file is named logo.png in public folder
            alt="PharmaAI Logo" 
            width={100}           // Adjust this width to make the logo bigger/smaller
            height={60}  
            className="h-20 w-auto object-contain" // Keeps the logo height constrained to the navbar
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