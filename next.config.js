/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Product photo upload sends up to 5 photos × 10MB each via FormData
      // through uploadProductPhotos. Default 1MB blocks anything past one photo.
      bodySizeLimit: '55mb',
    },
    // proxy.ts (middleware) sits in front of every request including server
    // actions; Next.js caps the body it sees at 10MB by default. The proxy
    // doesn't read the body (it only resolves subdomain → tenant), so it's safe
    // to match the server-action cap. Without this, photo uploads fail with
    // "Request body exceeded 10MB / Unexpected end of form" before the action runs.
    middlewareClientMaxBodySize: '55mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jdmizpqtpbmcpspfuihp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // fal.ai direct URLs — fallback when Supabase Storage upload fails
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Frame protection is set per-surface in proxy.ts: storefronts allow
          // framing by our own dashboard (the editor's live preview) and nobody
          // else; the dashboard, marketing, and admin stay un-frameable (DENY).
          // It can't live here because the only thing that distinguishes a
          // storefront from the marketing apex is the subdomain, which only the
          // proxy resolves.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
