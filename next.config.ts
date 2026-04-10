import type { NextConfig } from 'next';

// User's custom Next.js configuration
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.example.com'],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
