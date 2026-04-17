import type { NextConfig } from 'next';

// User's custom Next.js configuration
// NOTE: basePath is handled by Webflow Cloud builder
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    PUBLIC_API_MOUNT_PATH: process.env.PUBLIC_API_MOUNT_PATH || ''
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
