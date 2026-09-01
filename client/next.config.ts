import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Не смешиваем dev-кэш с production build: параллельная сборка больше не
  // ломает локальные CSS/JS чанки и навигацию из-за устаревшей `.next`.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  // Для Netlify плагин сам управляет output
  output: process.env.NETLIFY ? undefined : 'standalone',
  // Monorepo (root/ + client/): tracing должен смотреть на корень репозитория
  // иначе Netlify runtime может терять части server bundle и отдавать 502.
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  images: {
    unoptimized: process.env.NETLIFY ? true : false,
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api',
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Правильный способ добавления заголовков для кэша
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    const isDev = process.env.NODE_ENV === 'development';

    return [
      { source: '/(.*)', headers: securityHeaders },
      ...(isDev
        ? [
            {
              source: '/_next/static/(.*)',
              headers: [{ key: 'Cache-Control', value: 'no-store' }],
            },
          ]
        : [
            {
              source: '/static/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
            {
              source: '/_next/static/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
            {
              source: '/fonts/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ]),
    ];
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
        permanent: true,
      },
      {
        source: '/education',
        destination: '/education-guide',
        permanent: true,
      },
      {
        source: '/student-slang',
        destination: '/education/student-slang',
        permanent: true,
      },
      {
        source: '/life',
        destination: '/life-guide',
        permanent: true,
      },
      {
        source: '/reviews',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/education/translation-centers',
        destination: '/education-guide',
        permanent: true,
      },
      { source: '/guides/life/1', destination: '/guides/life/dorm', permanent: true },
      { source: '/guides/life/2', destination: '/guides/life/inn-snils', permanent: true },
      { source: '/guides/life/3', destination: '/guides/life/lost-passport', permanent: true },
      { source: '/guides/life/4', destination: '/guides/life/call-doctor', permanent: true },
      { source: '/guides/life/5', destination: '/guides/life/transport', permanent: true },
      { source: '/guides/life/7', destination: '/guides/life/migration-registration', permanent: true },
      { source: '/guides/life/8', destination: '/guides/life/bank', permanent: true },
      { source: '/guides/life/14', destination: '/guides/life/medical-tests', permanent: true },
      { source: '/guides/education/0-main', destination: '/guides/education/how-studies-work', permanent: true },
      { source: '/guides/education/0', destination: '/guides/education/exam-vs-credit', permanent: true },
      { source: '/guides/education/1', destination: '/guides/education/session', permanent: true },
      { source: '/guides/education/2', destination: '/guides/education/gost', permanent: true },
      { source: '/guides/education/3', destination: '/guides/education/university-structure', permanent: true },
      { source: '/guides/education/4', destination: '/guides/education/coursework', permanent: true },
      { source: '/guides/education/5', destination: '/guides/education/failed-credit', permanent: true },
      { source: '/guides/education/6', destination: '/guides/education/academic-leave', permanent: true },
    ];
  },
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
