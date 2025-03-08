/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the export output since we want to run it in dev mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;