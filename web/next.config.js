/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid intermittent Windows pack cache corruption in Next dev.
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
