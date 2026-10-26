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
    ],
  },
  // Showcase: the catalog in the backend (no collections, no shop); its ticks pick the gallery.
  { feature: 'collections', section: 'Catalog', items: [{ label: 'Collections', href: '/manage/collections' }] },
  { feature: 'gallery_pieces', section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
  // Events (Alex, 2026-10-22): the schedule, the till, market sales and results.
  // Showcase has only its Schedule.
  { feature: 'market_dates', section: 'Events', items: [{ label: 'Schedule', href: '/manage/markets' }] },
  { feature: 'market_shop', section: 'Events', items: [{ label: 'Market POS', href: '/manage/pos' }, { label: 'Sales', href: '/manage/sales' }] },
  { feature: 'market_records', section: 'Events', items: [{ label: 'Results', href: '/manage/markets/results' }] },
  // Full's online selling: orders sent from the cart, and promotions.
  { feature: 'cart', section: 'Online shop', items: [{ label: 'Orders', href: '/manage/orders' }] },
  { feature: 'promotions', section: 'Online shop', items: [{ label: 'Promotions', href: '/manage/promotions' }] },
  // Buyer accounts (Full): her switch and her buyers.
  { feature: 'buyer_accounts', section: 'Online shop', items: [{ label: 'Buyers', href: '/manage/buyers' }] },
  { feature: 'headline', section: 'Your site', items: [{ label: 'Headline', href: '/manage/headline' }] },
  { feature: 'background', section: 'Your site', items: [{ label: 'Background', href: '/manage/background' }] },
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
  { feature: 'testimonials', section: 'Your site', items: [{ label: 'Testimonials', href: '/manage/testimonials' }] },
  { feature: 'qr_codes', section: 'Your site', items: [{ label: 'QR code', href: '/manage/qr' }] },
  { feature: 'try_on', section: 'Your site', items: [{ label: 'Try on a look', href: '/manage/looks' }] },
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
  // Set up once, so it sits in Settings (Alex, 2026-10-22).
  { feature: 'market_shop', section: 'Settings', items: [{ label: 'Getting paid', href: '/manage/payments' }] },
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

/** The menu without one screen's item (a group left empty drops out). */
export function withoutItem(nav: readonly NavSection[], href: string): NavSection[] {
  return nav.map((s) => ({ ...s, items: s.items.filter((i) => i.href !== href) })).filter((s) => s.items.length > 0);
}
