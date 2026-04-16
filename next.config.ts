import type { NextConfig } from 'next';

// User's custom Next.js configuration
const nextConfig: NextConfig = {
  // Mount path for deployment (e.g., '/next-cf' for https://example.com/next-cf)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
};

export default nextConfig;
