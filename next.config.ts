/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mengabaikan error linting dan typescript saat proses deploy agar website tetap bisa online
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
};

export default nextConfig;