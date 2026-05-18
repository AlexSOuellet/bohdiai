import type { MetadataRoute } from 'next';

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/confirm', '/confirmed'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
