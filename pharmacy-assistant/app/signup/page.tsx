"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';

// Password strength checker
const getPasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
};

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#00A99D'];

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const router = useRouter();

  const { score: pwdScore, checks: pwdChecks } = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (pwdScore < 4) {
      setError("Please choose a stronger password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full bg-white relative overflow-auto font-sans flex items-center justify-center py-10">

        {/* Background Decorative Shapes */}
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

        <div className="container mx-auto px-6 relative z-10 w-full flex flex-col md:flex-row items-start justify-between max-w-6xl">

          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8 md:sticky md:top-10">
            <div className="flex items-center space-x-4 mb-4 self-start">
              <div className="w-12 h-12 bg-gray-300 rounded-sm shrink-0"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                AI-Powered Pharmacy Assistant
              </h1>
            </div>

            <div className="relative w-full max-w-md">
              <img src="/signupImage.png" alt="Pharmacist illustration" className="w-full h-auto object-contain rounded-lg shadow-lg" />
            </div>
          </div>

          <div className="w-full md:w-5/12 mt-8 md:mt-0 md:pl-12">
            <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-medium text-black mb-6">
                {step === 1 ? 'Create a new account' : 'Verify your email'}
              </h2>

              {/* Error Alert */}
              {error && <p className="text-red-500 mb-4 text-sm font-bold bg-red-50 p-2 rounded">{error}</p>}

              {step === 1 ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                    onChange={handleChange}
                    required
                  />

                  {/* Password with strength meter */}
                  <div>
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                      onChange={handleChange}
                      required
                    />
                    {formData.password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {/* Strength bar */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-full transition-all duration-300"
                              style={{ backgroundColor: i <= pwdScore ? strengthColors[pwdScore] : '#e5e7eb' }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-medium" style={{ color: strengthColors[pwdScore] }}>
                          {strengthLabels[pwdScore]}
                        </p>
                        <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                          <li className={pwdChecks.length ? 'text-green-600' : ''}>
                            {pwdChecks.length ? '✓' : '○'} At least 8 characters
                          </li>
                          <li className={pwdChecks.uppercase ? 'text-green-600' : ''}>
                            {pwdChecks.uppercase ? '✓' : '○'} Uppercase letter (A–Z)
                          </li>
                          <li className={pwdChecks.lowercase ? 'text-green-600' : ''}>
                            {pwdChecks.lowercase ? '✓' : '○'} Lowercase letter (a–z)
                          </li>
                          <li className={pwdChecks.number ? 'text-green-600' : ''}>
                            {pwdChecks.number ? '✓' : '○'} Number (0–9)
                          </li>
                          <li className={pwdChecks.special ? 'text-green-600' : ''}>
                            {pwdChecks.special ? '✓' : '○'} Special character (!@#$...)
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 placeholder-gray-500 focus:outline-none focus:border-emerald-600 transition-colors bg-white"
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="submit"
                    disabled={pwdScore < 4}
                    className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              ) : (
                <form className="space-y-4" onSubmit={handleVerify}>
                  <p className="text-gray-600 text-sm">
                    We&apos;ve sent a 6-digit OTP to <strong>{formData.email}</strong>. Please check your inbox and enter it below.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl border-2 border-black text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors bg-white text-center text-xl tracking-widest"
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    {!otpFocused && otp === '' && (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none text-sm">
                        Enter 6-digit OTP
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#00A99D] hover:bg-[#008f85] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-2"
                  >
                    Verify &amp; Create Account
                  </button>
                  <div className="text-center mt-4">
                    <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:underline text-sm">
                      Back to Sign Up
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;