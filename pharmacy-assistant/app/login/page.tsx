"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  const [otpFocused, setOtpFocused] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      // Step 1: Try signing in with email + password only
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok && !res?.error) {
        router.push("/dashboard");
        router.refresh();
      } else if (res?.error === "OTP_REQUIRED") {
        // Backend confirmed credentials are correct, send OTP
        try {
          const otpRes = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (otpRes.ok) {
            setStep(2);
          } else {
            const data = await otpRes.json();
            setError(data.message || "Failed to send OTP.");
          }
        } catch {
          setError("Server error sending OTP.");
        }
      } else if (res?.error === "UNVERIFIED") {
        setError("Your account is not verified. Please complete signup.");
      } else if (res?.error === "PENDING_ADMIN_APPROVAL") {
        setError("⏳ Your account is pending admin verification. You will be notified once approved.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } else {
      // Step 2: Submit email + password + OTP for final verification
      const res = await signIn("credentials", {
        email,
        password,
        otp,
        redirect: false,
      });

      if (res?.ok && !res?.error) {
        router.push("/dashboard");
        router.refresh();
      } else if (res?.error === "Invalid or expired OTP. Please try again.") {
        setError("Invalid or expired OTP. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full bg-white relative overflow-hidden font-sans flex items-center justify-center py-10 md:py-0">

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

        <div className="container mx-auto px-6 relative z-10 h-full flex flex-col md:flex-row items-center justify-between max-w-6xl">

          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8">
            <div className="flex items-center space-x-4 mb-4 md:mb-12 self-start">
              {/* <div className="w-12 h-12 bg-gray-300 rounded-sm shrink-0"></div> */}
              <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                AI-Powered Pharmacy Assistant
              </h1>
            </div>

            <div className="relative w-full max-w-md">
              <img
                src="/Gemini_Generated_Image_7hsiwa7hsiwa7hsi.png"
                alt="Pharmacist illustration"
                className="w-full h-auto object-contain rounded-lg shadow-lg scale-x-[-1]"
              />
            </div>
          </div>

          <div className="w-full md:w-5/12 mt-12 md:mt-0 md:pl-12">
            <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">

              <h2 className="text-2xl font-medium text-black mb-8">
                {step === 1 ? 'Sign in to your account' : 'Enter your OTP'}
              </h2>

              {/* ERROR MESSAGE DISPLAY */}
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {step === 1 ? (
                  <>
                    <div className="flex flex-col">
                      <input
                        type="email"
                        value={email}
                        placeholder="Email Address"
                        className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <input
                        type="password"
                        value={password}
                        placeholder="Password"
                        className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-4"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">
                      For your security, an OTP has been sent to <strong>{email}</strong>. Please enter it below.
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        value={otp} // Add this to make it a controlled component
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors bg-white text-center text-xl tracking-widest"
                        onFocus={() => setOtpFocused(true)}
                        onBlur={() => setOtpFocused(false)}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                      {/* Only show this if the OTP state is actually empty */}
                      {otp.length === 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none text-sm">
                          Enter 6-digit OTP
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-4"
                    >
                      Verify &amp; Sign In
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError(""); }}
                        className="text-gray-500 hover:underline text-sm"
                      >
                        Back to Login
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-[#00A99D] font-semibold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginPage;