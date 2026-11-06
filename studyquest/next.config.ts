import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // API javoblari odatda shaxsiy — keshlanmaydi. Istisno: ochiq va o'zi qisqa kesh belgilaydiganlar
      // (Sayt boshqaruvi: /api/site/*; e'lonlar oynasi va kirish dizayni: /api/platform?view=news|loginDesign).
      {
        source: '/api/:path((?!site/).*)',
        missing: [{ type: 'query', key: 'view', value: '(?:news|loginDesign)' }],
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ];
  },
};
export default config;
