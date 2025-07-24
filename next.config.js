/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config, { isServer }) => {
    // Disable webpack caching to prevent EIO errors
    config.cache = false;
    
    if (isServer) {
      config.externals.push('encoding');
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;