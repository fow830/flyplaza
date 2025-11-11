/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Исключаем Puppeteer из серверного бандла, если нужно
      config.externals = config.externals || [];
    }
    return config;
  },
}

module.exports = nextConfig


