import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: false,
  typescript: {
    // Allow production builds to succeed even with TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig;
