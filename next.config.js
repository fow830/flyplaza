/** @type {import('next').NextConfig} */
const nextConfig = {
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


