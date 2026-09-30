import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

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
    // middleware.ts sits in front of every request including server
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
          // Frame protection is set per-surface in middleware.ts: storefronts allow
          // framing by our own dashboard (the editor's live preview) and nobody
          // else; the dashboard, marketing, and admin stay un-frameable (DENY).
          // It can't live here because the only thing that distinguishes a
          // storefront from the marketing apex is the subdomain, which only the
          // proxy resolves.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // The emailed-link landing page carries a one-time token in its URL: no
        // Referer leak, nothing cached. Listed last so it overrides the catch-all above.
        source: '/auth/continue',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;

// Under `next dev`, give the app the same Cloudflare bindings (IMAGES, ...) it gets
// on Workers, read from wrangler.jsonc, so getCloudflareContext() works locally.
initOpenNextCloudflareForDev();
