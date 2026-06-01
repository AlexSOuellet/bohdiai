/**
 * THROWAWAY PROBE — not a customer-facing page, not a kept reference.
 *
 * These hand-authored "moments" exist to PROBE THE GAP: build the intro Moment
 * (the front-door brand wow — Track 2 / Moments-Engine-Spec.md) by hand in the
 * CURRENT layout language, pushing each one until the engine gives out, so we can
 * derive the exact list of missing expressive "bricks" from RANGE, not from any one
 * example. Posy/candle-in-golden-hour are points in the range, never targets.
 *
 * This is NOT the functional pages (the tidy stacked documents — Track 1, the two
 * studies). The only thing borrowed from the studies is the render harness below.
 *
 * Delete this whole folder when the probe writeup is done.
 *
 * Viewable in dev at /moment-probe (index) and /moment-probe/<id>.
 */
import { compileStyleSheet, googleFontPreconnectLinks } from '@/lib/style-sheet-loader';
import { LayoutPage } from '@/components/storefront/layout/Page';
import type { StyleSheet } from '@/lib/style-sheet';
import type { Page } from '@/lib/layout';

export interface MomentFixture {
  id: string;
  /** Niche + mood point this moment sits at. */
  label: string;
  /** What the moment WANTS to be — the art-directed intent we author toward. */
  intent: string;
  sheet: StyleSheet;
  page: Page;
}

// ---------------------------------------------------------------------------
// 1. CANDLES · cinematic (cozy/dark) — "a candle in golden-hour light, the brand
//    name arriving, a single line of copy, an invitation to enter."
// ---------------------------------------------------------------------------

const CANDLES_SHEET: StyleSheet = {
  palette: [
    { name: 'Ink', value: '#161009', character: 'near-black warm ink, almost a burnt umber in shadow' },
    { name: 'Cream', value: '#f4ead6', character: 'soft warm candlelit paper' },
    { name: 'Ember', value: '#d2622a', character: 'lit-wick terracotta' },
    { name: 'Gold', value: '#e2a94e', character: 'low flame brass glow' },
    { name: 'Wax', value: '#c9a988', character: 'unlit beeswax' },
  ],
  fonts: [
    {
      name: 'Display',
      family: 'Fraunces',
      source: 'google',
      weights: [400, 600, 900],
      styles: ['normal', 'italic'],
      fallback: 'serif',
      character: 'high-contrast editorial serif with optical drama',
    },
    {
      name: 'Body',
      family: 'Inter',
      source: 'google',
      weights: [400, 500, 600],
      fallback: 'sans-serif',
      character: 'clean neutral sans for the quiet supporting voice',
    },
  ],
  textures: [],
  semanticColors: { primarySeedColor: '#d2622a', scheme: 'dark' },
  typeScale: {
    eyebrow: {
      fontName: 'Body',
      sizePx: 14,
      sizeMobilePx: 14,
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.22em',
      uppercase: true,
    },
    headline: { fontName: 'Display', sizePx: 76, sizeMobilePx: 40, weight: 900, lineHeight: 1.0 },
    sub: { fontName: 'Display', sizePx: 30, sizeMobilePx: 22, weight: 400, lineHeight: 1.2 },
    body: { fontName: 'Body', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
    caption: { fontName: 'Body', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4 },
    wordmark: {
      fontName: 'Display',
      sizePx: 34,
      sizeMobilePx: 24,
      weight: 600,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
    },
  },
  spacing: { unit: 8 },
};

const CANDLES_MOMENT: Page = {
  slug: 'candles-cinematic',
  name: 'Candles · cinematic',
  root: {
    // The first Moment brick: a full-viewport held stage. The photo FILLS the
    // screen behind the words (not a fixed-ratio strip), a dark scrim guarantees
    // the overlay reads, and the content flows in one node at a time.
    type: 'stage',
    minHeight: 'screen',
    align: 'bottom-left',
    scrim: 'dark',
    reveal: { motion: 'fade', stagger: 'loose' },
    media: {
      type: 'image',
      brief: 'a single lit candle in deep golden-hour light, everything else falling into shadow',
      alt: 'A lit candle in golden light',
      fill: true,
      assetUrl:
        'https://jdmizpqtpbmcpspfuihp.supabase.co/storage/v1/object/public/generated-images/hero-images/candle-bonanza/hero.jpg',
      focal: { x: 50, y: 45 },
    },
    // Authored like a simple ad: the message arrives in beats, each fading in
    // slowly over the held image. No terminal punctuation in headlines.
    content: [
      { type: 'text', role: 'eyebrow', content: 'Hand-poured in Providence' },
      { type: 'text', role: 'headline', content: 'Forty-five hours in every jar' },
      { type: 'text', role: 'headline', content: 'Made to outlast the evening' },
      { type: 'text', role: 'sub', content: 'Coconut and apricot wax, never paraffin' },
      { type: 'button', label: 'Step inside', href: '/shop', variant: 'primary' },
    ],
  },
};

// The intro: a real flickering-candle video holding the whole screen, the brand
// and a line fading in slowly over it. The video is the living wow; the text
// arrives like a held breath.
const CANDLE_INTRO: Page = {
  slug: 'flickering-candle',
  name: 'Flickering candle',
  root: {
    type: 'stage',
    minHeight: 'screen',
    align: 'center',
    scrim: 'dark',
    reveal: { motion: 'fade', stagger: 'loose' },
    media: {
      type: 'video',
      assetUrl: '/flickering-candle.mp4',
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      fill: true,
    },
    content: [
      { type: 'text', role: 'eyebrow', content: 'Hand-poured in Providence', align: 'center' },
      { type: 'text', role: 'headline', content: 'Light that holds the room', align: 'center' },
      { type: 'text', role: 'sub', content: 'Small-batch candles, made by hand', align: 'center' },
      { type: 'button', label: 'Step inside', href: '/shop', variant: 'primary' },
    ],
  },
};

// ---------------------------------------------------------------------------

export const MOMENTS: MomentFixture[] = [
  {
    id: 'flickering-candle',
    label: 'Flickering candle — the intro',
    intent:
      'A real flickering-candle video holds the full screen. The brand and a single line fade in slowly over it, like a held breath before the shop.',
    sheet: CANDLES_SHEET,
    page: CANDLE_INTRO,
  },
  {
    id: 'candles-cinematic',
    label: 'Candles · cinematic (cozy / dark)',
    intent:
      'Full-screen held image of a candle in golden-hour light. The brand name arrives, then a single line of copy fades in beneath it, then a quiet "Enter". Cinematic, dark, one held breath before the shop.',
    sheet: CANDLES_SHEET,
    page: CANDLES_MOMENT,
  },
];

export function momentById(id: string): MomentFixture | undefined {
  return MOMENTS.find((m) => m.id === id);
}

export function MomentFrame({ sheet, page }: { sheet: StyleSheet; page: Page }) {
  const compiled = compileStyleSheet(sheet);
  const preconnect = googleFontPreconnectLinks();
  return (
    <>
      {preconnect.map((l) => (
        <link
          key={l.href}
          rel={l.rel}
          href={l.href}
          {...(l.crossOrigin === 'anonymous' ? { crossOrigin: 'anonymous' as const } : {})}
        />
      ))}
      {compiled.googleFontLinks.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: compiled.cssVariables }} />
      {compiled.customFontFaces !== '' && (
        <style dangerouslySetInnerHTML={{ __html: compiled.customFontFaces }} />
      )}
      <LayoutPage page={page} />
    </>
  );
}
