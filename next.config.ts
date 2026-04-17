import type { NextConfig } from 'next';

// Get mount path for client-side API calls
// COSMIC_MOUNT_PATH is set by Webflow Cloud builder - expose it with a different name
// to avoid binding conflicts
const rawMountPath = process.env.COSMIC_MOUNT_PATH || '';
const mountPath = rawMountPath && !rawMountPath.startsWith('/') ? `/${rawMountPath}` : rawMountPath;

// User's custom Next.js configuration
// NOTE: basePath is set by Webflow Cloud builder via COSMIC_MOUNT_PATH
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_MOUNT_PATH: mountPath,
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
