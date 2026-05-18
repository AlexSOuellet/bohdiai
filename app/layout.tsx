import type { Metadata, Viewport } from 'next';
import { Newsreader } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700'],
});

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'BohdiAI — Your Business Online. Finally Made Easy.',
  description:
    'BohdiAI gives makers, bakers, vintage sellers, farm stands and service providers a professional online storefront in minutes. AI-powered, built for your specific kind of business. You keep 100% of your sales.',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'BohdiAI',
    title: 'BohdiAI — Your Business Online. Finally Made Easy.',
    description:
      'A professional online storefront, built by AI in minutes — for the way your business actually works. Beta opening soon.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'BohdiAI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BohdiAI — Your Business Online. Finally Made Easy.',
    description:
      'A professional online storefront, built by AI in minutes — for makers, bakers, vintage sellers, farm stands and service providers.',
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#f7f1e6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="paper antialiased font-sans">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-cream-50"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BohdiAI',
              url: SITE_URL,
              description:
                'AI-powered storefronts for small business owners — makers, bakers, vintage sellers, service providers, farm stands and more.',
              foundingDate: '2026',
            }),
          }}
        />
      </body>
    </html>
  );
}
