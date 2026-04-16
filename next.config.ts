import type { NextConfig } from 'next';

// Get mount path for client-side use (basePath is handled by Webflow Cloud builder)
// Ensure it starts with / if not empty
const rawMountPath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.COSMIC_MOUNT_PATH || '';
const mountPath = rawMountPath && !rawMountPath.startsWith('/') ? `/${rawMountPath}` : rawMountPath;

// User's custom Next.js configuration
// NOTE: basePath is set by Webflow Cloud builder, do not set it here
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Expose mount path to client-side code for API calls
  env: {
    NEXT_PUBLIC_BASE_PATH: mountPath,
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
