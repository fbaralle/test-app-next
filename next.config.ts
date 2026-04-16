import type { NextConfig } from 'next';

// Resolve mount path from either NEXT_PUBLIC_BASE_PATH or COSMIC_MOUNT_PATH (Webflow Cloud)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.COSMIC_MOUNT_PATH || '';

// User's custom Next.js configuration
const nextConfig: NextConfig = {
  basePath,
  output: 'standalone',
  reactStrictMode: true,
  // Expose basePath to client-side code
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
