/**
 * COMMITTED DESIGN REFERENCE — not a customer-facing page.
 *
 * These two hand-authored layouts are the QUALITY BAR for the FUNCTIONAL pages
 * (home, shop, about, product, cart) — the tidy, arranged "documents." They are NOT
 * the Moments engine, which is a separate layer (the brand intro / wow). The job of the
 * functional-page composition work is to get Bohdi to compose document pages to this bar
 * instead of monotonous stacked bands. Viewable in dev at /_reference/functional-studies.
 * See Project-Docs/Moments-Engine-Spec.md for the two-track split.
 */
import { compileStyleSheet, googleFontPreconnectLinks } from '@/lib/style-sheet-loader';
import { LayoutPage } from '@/components/storefront/layout/Page';
import type { StyleSheet } from '@/lib/style-sheet';
import type { Page } from '@/lib/layout';

export const SHEET: StyleSheet = {
  palette: [
    { name: 'Ink', value: '#1b140f', character: 'near-black warm ink' },
    { name: 'Cream', value: '#f6efe6', character: 'soft warm paper' },
    { name: 'Ember', value: '#c24d24', character: 'burnt terracotta accent' },
    { name: 'Gold', value: '#d8a24a', character: 'aged brass highlight' },
  ],
  fonts: [
    {
      name: 'Display',
      family: 'Fraunces',
      source: 'google',
      weights: [400, 600, 900],
      fallback: 'serif',
      character: 'high-contrast editorial serif',
    },
    {
      name: 'Body',
      family: 'Inter',
      source: 'google',
      weights: [400, 500, 600],
      fallback: 'sans-serif',
      character: 'clean neutral sans',
    },
  ],
  textures: [],
  semanticColors: { primarySeedColor: '#c24d24', scheme: 'light' },
  typeScale: {
    eyebrow: {
      fontName: 'Body',
      sizePx: 14,
      sizeMobilePx: 14,
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.18em',
      uppercase: true,
    },
    headline: { fontName: 'Display', sizePx: 72, sizeMobilePx: 40, weight: 900, lineHeight: 1.0 },
    sub: { fontName: 'Display', sizePx: 32, sizeMobilePx: 24, weight: 600, lineHeight: 1.15 },
    body: { fontName: 'Body', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
    caption: { fontName: 'Body', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4 },
    wordmark: {
      fontName: 'Display',
      sizePx: 26,
      sizeMobilePx: 22,
      weight: 600,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
    },
  },
  spacing: { unit: 8 },
};

// STUDY A — bold editorial document: overlap hero, asymmetric split, full bleed, brand grid.
export const STUDY_A: Page = {
  slug: 'study-a',
  name: 'Bold editorial',
  root: {
    type: 'stack',
    gap: 'none',
    children: [
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'md',
        children: [
          {
            type: 'row',
            align: 'center',
            justify: 'between',
            children: [
              { type: 'wordmark', kind: 'text', content: 'Ember & Oak', href: '/' },
              { type: 'navLinks' },
              { type: 'cart', variant: 'icon' },
            ],
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'inverse-surface' },
        padding: 'none',
        contentWidth: 'full',
        children: [
          {
            type: 'overlap',
            anchor: 0,
            align: 'bottom-left',
            scrim: 'dark',
            children: [
              { type: 'image', brief: 'dim studio shelf of lit candles', alt: 'Lit candles', aspect: '21:9' },
              {
                type: 'pane',
                padding: 'xl',
                child: {
                  type: 'stack',
                  gap: 'sm',
                  children: [
                    { type: 'text', role: 'eyebrow', content: 'Providence · est. 2019' },
                    { type: 'text', role: 'headline', content: 'Light that\nholds the room' },
                    { type: 'button', label: 'Shop the bench', href: '/shop', variant: 'primary' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'xl',
        children: [
          {
            type: 'split',
            direction: 'horizontal',
            ratios: [58, 42],
            gap: 'xl',
            align: 'center',
            children: [
              {
                type: 'stack',
                gap: 'sm',
                children: [
                  { type: 'text', role: 'eyebrow', content: 'The blend' },
                  {
                    type: 'text',
                    role: 'sub',
                    content: 'Coconut and apricot wax, never paraffin. Forty-five hours a jar.',
                  },
                  {
                    type: 'text',
                    role: 'body',
                    content:
                      'We pour in small runs so each scent gets the cure time it needs. Nothing leaves the bench until it throws clean cold and lit.',
                  },
                  { type: 'button', label: 'Read the process', href: '/about', variant: 'secondary' },
                ],
              },
              { type: 'image', brief: 'hands trimming a candle wick', alt: 'Trimming a wick', aspect: '4:5' },
            ],
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'none',
        children: [
          {
            type: 'bleed',
            side: 'both',
            child: { type: 'image', brief: 'wide field of poured candles cooling', alt: 'Candles cooling', aspect: '21:9' },
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'primary-container' },
        padding: 'xl',
        children: [
          {
            type: 'grid',
            columns: 3,
            gapX: 'lg',
            gapY: 'lg',
            children: [
              {
                type: 'stack',
                gap: 'xs',
                children: [
                  { type: 'text', role: 'sub', content: 'Morning' },
                  { type: 'text', role: 'body', content: 'Citrus, fig leaf, cool stone.' },
                ],
              },
              {
                type: 'stack',
                gap: 'xs',
                children: [
                  { type: 'text', role: 'sub', content: 'Golden hour' },
                  { type: 'text', role: 'body', content: 'Amber, saffron, dried rose.' },
                ],
              },
              {
                type: 'stack',
                gap: 'xs',
                children: [
                  { type: 'text', role: 'sub', content: 'After dark' },
                  { type: 'text', role: 'body', content: 'Cedar smoke, leather, clove.' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'inverse-surface' },
        padding: 'xl',
        children: [
          {
            type: 'row',
            justify: 'between',
            align: 'center',
            wrap: true,
            children: [
              {
                type: 'wordmark',
                kind: 'text',
                content: 'Ember & Oak',
                href: '/',
                gradient: { from: 'Ember', to: 'Gold', angle: 100 },
              },
              { type: 'navLinks' },
              { type: 'socialLinks', style: 'both' },
            ],
          },
        ],
      },
    ],
  },
};

// STUDY B — quiet & composed document: a SIMPLE mood done with intent, not just sparseness.
export const STUDY_B: Page = {
  slug: 'study-b',
  name: 'Quiet, composed',
  root: {
    type: 'stack',
    gap: 'none',
    children: [
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'md',
        children: [
          {
            type: 'row',
            align: 'center',
            justify: 'between',
            children: [
              { type: 'wordmark', kind: 'text', content: 'Field Notes', href: '/' },
              { type: 'navLinks' },
            ],
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'xxl',
        minHeight: 'lg',
        children: [
          {
            type: 'split',
            direction: 'horizontal',
            ratios: [32, 68],
            gap: 'lg',
            align: 'start',
            children: [
              {
                type: 'stack',
                gap: 'xs',
                children: [{ type: 'text', role: 'eyebrow', content: 'No. 01' }],
              },
              {
                type: 'stack',
                gap: 'md',
                children: [
                  { type: 'text', role: 'headline', content: 'A quieter kind of shelf.' },
                  {
                    type: 'text',
                    role: 'body',
                    content:
                      'Six objects, made slowly, photographed plainly. We would rather show you one thing well than ten things loudly.',
                  },
                  { type: 'button', label: 'See the six', href: '/shop', variant: 'link' },
                ],
              },
            ],
          },
        ],
      },
      { type: 'gutter', size: 'xxl' },
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'none',
        children: [
          {
            type: 'bleed',
            side: 'both',
            child: { type: 'image', brief: 'single ceramic vessel on linen, soft daylight', alt: 'Ceramic vessel', aspect: '16:9' },
          },
        ],
      },
      {
        type: 'band',
        intent: { surface: 'surface' },
        padding: 'xxl',
        children: [
          {
            type: 'split',
            direction: 'horizontal',
            ratios: [40, 60],
            gap: 'lg',
            align: 'start',
            children: [
              {
                type: 'stack',
                gap: 'xs',
                children: [{ type: 'text', role: 'eyebrow', content: 'What people say' }],
              },
              {
                type: 'quote',
                body: 'I bought one. Then I bought one for everyone I like.',
                attribution: 'Dana R.',
              },
            ],
          },
        ],
      },
      { type: 'gutter', size: 'xl' },
      {
        type: 'band',
        intent: { surface: 'surface-variant' },
        padding: 'lg',
        children: [
          {
            type: 'row',
            justify: 'between',
            align: 'center',
            wrap: true,
            children: [
              { type: 'wordmark', kind: 'text', content: 'Field Notes', href: '/' },
              { type: 'navLinks' },
            ],
          },
        ],
      },
    ],
  },
};

export function StudyFrame({ page }: { page: Page }) {
  const compiled = compileStyleSheet(SHEET);
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
