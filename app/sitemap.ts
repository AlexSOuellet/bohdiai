import type { MetadataRoute } from 'next';

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...['/makers', '/contractors', '/faq', '/samples'].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];
}
