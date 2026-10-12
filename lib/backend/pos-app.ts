/**
 * The Market POS as a home-screen app (Alex, 2026-10-12): a maker saves it to
 * their phone and it opens full screen at the POS starting point, under their
 * shop's name. The manifest is per shop because a phone fetches it without the
 * sign-in cookie, so it can't know whose POS it is any other way.
 */
import type { Metadata, Viewport } from 'next';

export const POS_START = '/manage/pos';
/** The till's walnut, so the phone's top bar matches the screen. */
export const POS_THEME = '#231a13';
const POS_PAPER = '#efe5d9';

export function posManifest(shopName: string | null): Record<string, unknown> {
  return {
    id: POS_START,
    name: shopName === null ? 'Market POS' : `${shopName} Market POS`,
    short_name: 'Market POS',
    start_url: POS_START,
    scope: '/manage/',
    display: 'standalone',
    background_color: POS_PAPER,
    theme_color: POS_THEME,
    icons: [
      { src: '/pos/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/pos/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}

/** The page metadata that lets a POS screen be saved to the home screen. */
export function posMetadata(subdomain: string): Metadata {
  return {
    title: 'Market POS',
    manifest: `/pos-manifest/${encodeURIComponent(subdomain)}`,
    appleWebApp: { capable: true, title: 'Market POS', statusBarStyle: 'default' },
    icons: { apple: '/pos/apple-touch-icon.png' },
  };
}

export const posViewport: Viewport = { themeColor: POS_THEME, width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** Where the POS icon lands: today's market if one is on, else the list to pick from. */
export function posLanding(markets: readonly { id: string; date: string; endDate: string; canceled: boolean }[], today: string): string | null {
  const on = markets.find((m) => !m.canceled && m.date <= today && (m.endDate === '' ? m.date : m.endDate) >= today);
  return on === undefined ? null : `/manage/markets/${on.id}/day`;
}
