import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Для Netlify не используем standalone output
  ...(process.env.NETLIFY ? {} : { output: 'standalone' }),
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NETLIFY ? true : false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api',
  },
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    // Правильная обработка pdfjs-dist
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
      config.externals = [...(config.externals || []), 'canvas'];
    }
    return config;
  },
}

export default nextConfig
