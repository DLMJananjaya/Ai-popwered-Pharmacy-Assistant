import React from 'react';
import Navbar from '../components/Navbar';

const teamMembers = [
  {
    name: "Matheesha Jananjaya",
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/184282971?s=400&u=063c7db40b1c584dbd1751486f195d05cca50413&v=4",
  },
  {
    name: "Yasiru Gihan",
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/183959780?v=4",
  },
  {
    name: "Thamoda Abhishek",
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/191204063?v=4",
  },
  {
    name: "Manoli Lakshani",
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/230983451?v=4",
  },
  {
    name: "Medhavee Amarna",
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/230982327?v=4",
  },
  {
    name: "Thilini Yashoda", // Sixth member placeholder
    role: "CS Undergraduate",
    image: "https://avatars.githubusercontent.com/u/215964303?v=4",
  },
];

const AboutPage = () => {
  return (
    <>
    <Navbar />

    
    <div className="min-h-screen w-full bg-white relative overflow-auto font-sans text-black py-16">
      
      {/* --- Background Decorative Shapes --- */}
      <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none z-0 opacity-50">
        
        <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full">
          <path d="M200,0 C350,200 100,400 500,250 L500,0 Z" fill="#f0fdfa" transform="translate(50, -50) scale(1.2)" />
          <path d="M200,0 C350,200 100,400 500,300 L500,0 Z" fill="#ccfbf1" transform="translate(60, -20)" />
        </svg>
        
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
             <span className="text-[#00A99D]">AI-Powered Pharmacy Assistant</span> | About Us
          </h1>
          <div className="w-24 h-1 bg-[#00A99D] mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our team is dedicated to building intelligent solutions for the pharmaceutical industry, 
            focusing on efficiency and improved patient outcomes through AI technology.
          </p>
        </div>

        {/* --- Meet the Team Section --- */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-16">
            Meet the Team
          </h2>
          
          {/* Updated Grid for 6 members (3 per row on lg screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                
                {/* Profile Image with brand-colored border */}
                <div className="w-44 h-44 relative mb-6 rounded-full overflow-hidden border-[4px] border-[#00A99D] p-1 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                
                {/* Name & Role */}
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-[#00A99D] font-medium uppercase tracking-wider text-sm">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </>);
};

export default AboutPage;