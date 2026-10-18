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
    // The two marketing arms have their own addresses (Session 108).
    ...['https://makers.bohdiai.com', 'https://service.bohdiai.com'].map((url) => ({
      url,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...['/looks', '/faq'].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];
}
