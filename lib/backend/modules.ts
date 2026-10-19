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
  // Home stands alone at the top (no group name); Settings sits at the bottom (Alex, 2026-10-19).
  { feature: null, section: '', items: [{ label: 'Home', href: '/manage' }] },
  {
    feature: 'catalog',
    section: 'Catalog',
    items: [
      { label: 'Products', href: '/manage/products' },
      { label: 'Collections', href: '/manage/collections' },
    ],
  },
  // Showcase: the catalog in the backend (no collections, no shop); its ticks pick the gallery.
  { feature: 'gallery_pieces', section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
  { feature: 'cart', section: 'Selling', items: [{ label: 'Orders', href: '/manage/orders' }] },
  { feature: 'promotions', section: 'Selling', items: [{ label: 'Promotions', href: '/manage/promotions' }] },
  { feature: 'market_shop', section: 'Selling', items: [{ label: 'Getting paid', href: '/manage/payments' }] },
  { feature: 'headline', section: 'Your site', items: [{ label: 'Headline', href: '/manage/headline' }] },
  {
    feature: 'profile',
    section: 'Your site',
    items: [
      { label: 'About you', href: '/manage/profile' },
      { label: 'Scrolling line', href: '/manage/marquee' },
      { label: 'Contact information', href: '/manage/contact' },
      { label: 'Socials', href: '/manage/socials' },
    ],
  },
  { feature: 'gallery', section: 'Your site', items: [{ label: 'Gallery', href: '/manage/gallery' }] },
  { feature: 'market_dates', section: 'Selling', items: [{ label: 'Markets', href: '/manage/markets' }] },
  { feature: 'market_shop', section: 'Selling', items: [{ label: 'Market POS', href: '/manage/pos' }] },
  { feature: 'testimonials', section: 'Your site', items: [{ label: 'Testimonials', href: '/manage/testimonials' }] },
  { feature: 'qr_codes', section: 'Your site', items: [{ label: 'QR code', href: '/manage/qr' }] },
  // Contact support: its own item on the main menu, every backend (Alex, 2026-10-19).
  { feature: null, section: '', items: [{ label: 'Contact support', href: '/manage/support' }] },
  {
    feature: 'plan',
    section: 'Settings',
    items: [
      { label: 'Your plan', href: '/manage/plan' },
      { label: 'Billing', href: '/manage/billing' },
    ],
  },
];

/** Map key for an item that stands alone (no group name can start with it). */
const STANDALONE = 'standalone:';

/** A module with no group name (Home, Contact support) is its own item on the main
 *  menu, in module order, never merged into a group. */
export function navFor(modules: readonly BackendModule[], on: ReadonlySet<FeatureKey>): NavSection[] {
  const sections = new Map<string, NavItem[]>();
  for (const m of modules) {
    if (m.feature !== null && !on.has(m.feature)) continue;
    if (m.section === '') {
      for (const item of m.items) sections.set(`${STANDALONE}${item.href}`, [item]);
      continue;
    }
    const have = sections.get(m.section) ?? [];
    // Two modules can open the same screen (Products from the shop or from Showcase's gallery): list it once.
    sections.set(m.section, [...have, ...m.items.filter((i) => !have.some((h) => h.href === i.href))]);
  }
  return [...sections]
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({ section: key.startsWith(STANDALONE) ? '' : key, items }));
}
