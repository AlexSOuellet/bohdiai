import type { Metadata, Viewport } from 'next';
import {
  Inter_Tight,
  Cormorant_Garamond,
  Manrope,
  JetBrains_Mono,
  UnifrakturCook,
  Bebas_Neue,
  Fredoka,
  Caveat,
} from 'next/font/google';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '600'],
});

// Storefront-only display fonts (loaded once, used inside BrowserDemo).
// Each is a single-style display family — small footprint.
// Storefront-only fonts: not preloaded so they don't block LCP.
// Loaded when the browser first encounters them inside BrowserDemo
// (a few seconds after first paint).
const unifrakturCook = UnifrakturCook({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-gothic',
  weight: ['700'],
});

const bebas = Bebas_Neue({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-bebas',
  weight: ['400'],
});

const fredoka = Fredoka({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-fredoka',
  weight: ['400', '500', '600', '700'],
});

const caveat = Caveat({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-caveat',
  weight: ['500', '700'],
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
  themeColor: '#0a0805',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${cormorant.variable} ${manrope.variable} ${jetbrains.variable} ${unifrakturCook.variable} ${bebas.variable} ${fredoka.variable} ${caveat.variable}`}
    >
      <body className="bg-bg font-sans text-text antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-honey focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
