/**
 * What each feature contributes to the backend shell (spec §2: nothing assumes a
 * shop). The menu is assembled from the modules whose feature is on; modules with
 * feature null are always present. Later plans append their modules to
 * BACKEND_MODULES (1b adds catalog's Products and Collections; the card site adds
 * About you and Gallery; 1d the domain page).
 */
import type { FeatureKey } from './features';

export type NavItem = { label: string; href: string };
export type BackendModule = { feature: FeatureKey | null; section: string; items: NavItem[] };
export type NavSection = { section: string; items: NavItem[] };

export const BACKEND_MODULES: BackendModule[] = [
  { feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
  {
    feature: 'catalog',
    section: 'Catalog',
    items: [
      { label: 'Products', href: '/manage/products' },
      { label: 'Collections', href: '/manage/collections' },
    ],
  },
  { feature: 'cart', section: 'Selling', items: [{ label: 'Orders', href: '/manage/orders' }] },
  { feature: 'promotions', section: 'Selling', items: [{ label: 'Promotions', href: '/manage/promotions' }] },
  { feature: 'profile', section: 'Your site', items: [{ label: 'About you', href: '/manage/profile' }] },
  { feature: 'gallery', section: 'Your site', items: [{ label: 'Gallery', href: '/manage/gallery' }] },
  { feature: 'market_dates', section: 'Selling', items: [{ label: 'Markets', href: '/manage/markets' }] },
  { feature: 'qr_codes', section: 'Your site', items: [{ label: 'QR code', href: '/manage/qr' }] },
];

export function navFor(modules: readonly BackendModule[], on: ReadonlySet<FeatureKey>): NavSection[] {
  const sections = new Map<string, NavItem[]>();
  for (const m of modules) {
    if (m.feature !== null && !on.has(m.feature)) continue;
    sections.set(m.section, [...(sections.get(m.section) ?? []), ...m.items]);
  }
  return [...sections].filter(([, items]) => items.length > 0).map(([section, items]) => ({ section, items }));
}
