import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Apaga los errores de TypeScript durante el despliegue en Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Apaga los errores de ESLint durante el despliegue en Vercel
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;