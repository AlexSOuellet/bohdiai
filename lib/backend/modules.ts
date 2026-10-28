/**
 * What each feature contributes to the backend menu (spec §2: nothing assumes a
 * shop). The menu is assembled from the modules whose feature is on; modules with
 * feature null are always present.
 *
 * The redesign (2026-10-27): the menu is a short list in the maker's own words,
 * one entry per group. A group's screens show as tabs across the top of the
 * screen; My site is one page showing every part of her site, and each part opens
 * from there (HUBS).
 */
import type { FeatureKey } from './features';

export type NavItem = { label: string; href: string };
export type BackendModule = { feature: FeatureKey | null; section: string; items: NavItem[] };
export type NavSection = { section: string; items: NavItem[] };

/** The My site page: every part of her site, each opening its own screen. */
export const MY_SITE_PATH = '/manage/site';

/** Groups that open on a page of their own, which leads to the group's screens. */
/** Full: the people with an account at her shop, and her switch for those accounts. */
export const CUSTOMERS_PATH = '/manage/customers';
export const CUSTOMER_ACCOUNTS_PATH = '/manage/customer-accounts';

export const HUBS: Readonly<Record<string, string>> = { 'My site': MY_SITE_PATH };

export const BACKEND_MODULES: BackendModule[] = [
  // Home stands alone at the top (no group name).
  { feature: null, section: '', items: [{ label: 'Home', href: '/manage' }] },
  { feature: 'catalog', section: 'Products', items: [{ label: 'Products', href: '/manage/products' }] },
  { feature: 'collections', section: 'Products', items: [{ label: 'Collections', href: '/manage/collections' }] },
  // Showcase: the catalog in the backend (no collections, no shop); its ticks pick the gallery.
  { feature: 'gallery_pieces', section: 'Products', items: [{ label: 'Products', href: '/manage/products' }] },
  // Events (Alex, 2026-10-22): the schedule, the till, market sales and results.
  // Showcase has only its Schedule.
  { feature: 'market_dates', section: 'Events', items: [{ label: 'Schedule', href: '/manage/markets' }] },
  { feature: 'market_shop', section: 'Events', items: [{ label: 'Sales', href: '/manage/sales' }] },
  { feature: 'market_records', section: 'Events', items: [{ label: 'Results', href: '/manage/markets/results' }] },
  { feature: 'market_shop', section: 'Events', items: [{ label: 'Market POS', href: '/manage/pos' }] },
  // Tools on every plan (Alex, 2026-10-24), their own menu entry after Events, each
  // tool its own screen run on its own (Alex, 2026-10-28).
  {
    feature: null,
    section: 'Tools',
    items: [
      { label: 'Cost to make', href: '/manage/tools/cost' },
      { label: 'Price it', href: '/manage/tools/price' },
      { label: 'Is it worth it?', href: '/manage/tools/market' },
      { label: 'Monthly goal', href: '/manage/tools/goal' },
      { label: 'Shipping', href: '/manage/tools/shipping' },
      { label: 'Describe it', href: '/manage/tools/describe' },
    ],
  },
  // What to bring reads what sold through the market app (Alex, 2026-10-28).
  { feature: 'market_shop', section: 'Tools', items: [{ label: 'What to bring', href: '/manage/tools/bring' }] },
  // Full's online selling: orders sent from the cart and promotions.
  { feature: 'cart', section: 'Orders', items: [{ label: 'Orders', href: '/manage/orders' }] },
  { feature: 'promotions', section: 'Orders', items: [{ label: 'Promotions', href: '/manage/promotions' }] },
  // Full: the people with an account at her shop, their own entry (Alex, 2026-10-27).
  // It shows only while her Customer accounts switch is on (lib/backend/menu.ts).
  { feature: 'buyer_accounts', section: 'Customers', items: [{ label: 'Customers', href: CUSTOMERS_PATH }] },
  // My site: the parts of her site, in the order a visitor meets them.
  { feature: 'headline', section: 'My site', items: [{ label: 'Headline', href: '/manage/headline' }] },
  { feature: 'background', section: 'My site', items: [{ label: 'Background', href: '/manage/background' }] },
  {
    feature: 'profile',
    section: 'My site',
    items: [
      { label: 'About you', href: '/manage/profile' },
      { label: 'Scrolling line', href: '/manage/marquee' },
      { label: 'Contact information', href: '/manage/contact' },
      { label: 'Socials', href: '/manage/socials' },
    ],
  },
  { feature: 'gallery', section: 'My site', items: [{ label: 'Gallery', href: '/manage/gallery' }] },
  { feature: 'testimonials', section: 'My site', items: [{ label: 'Testimonials', href: '/manage/testimonials' }] },
  { feature: 'try_on', section: 'My site', items: [{ label: 'Try on a look', href: '/manage/looks' }] },
  { feature: 'qr_codes', section: 'My site', items: [{ label: 'QR code', href: '/manage/qr' }] },
  // Her switch for customer accounts: it adds Account to her site's menu (Alex, 2026-10-27).
  { feature: 'buyer_accounts', section: 'My site', items: [{ label: 'Customer accounts', href: CUSTOMER_ACCOUNTS_PATH }] },
  { feature: 'plan', section: 'Account', items: [{ label: 'Your plan', href: '/manage/plan' }, { label: 'Billing', href: '/manage/billing' }] },
  // Set up once, so it sits with the account (Alex, 2026-10-22).
  { feature: 'market_shop', section: 'Account', items: [{ label: 'Getting paid', href: '/manage/payments' }] },
  // Help: on every backend, last.
  { feature: null, section: 'Help', items: [{ label: 'Contact support', href: '/manage/support' }] },
];

/** Map key for an item that stands alone (no group name can start with it). */
const STANDALONE = 'standalone:';

/** A module with no group name (Home) is its own item on the main menu, in module
 *  order, never merged into a group. */
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

/** Whether a screen's path is this item's screen or one inside it (Home only exact). */
export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/manage' && pathname.startsWith(`${href}/`));
}

/** The menu entry a section shows: its name (or its one item's), and where it opens. */
export function entryFor(section: NavSection): NavItem {
  const first = section.items[0] ?? { label: section.section, href: '/manage' };
  if (section.section === '') return first;
  return { label: section.section, href: HUBS[section.section] ?? first.href };
}

/** The item a path belongs to, most specific first (Results sits inside Schedule's path). */
export function currentItem(section: NavSection, pathname: string): NavItem | null {
  const hits = section.items.filter((i) => isCurrent(pathname, i.href));
  return hits.sort((a, b) => b.href.length - a.href.length)[0] ?? null;
}

/** The group holding the screen at this path, if any. */
export function sectionFor(nav: readonly NavSection[], pathname: string): NavSection | null {
  return nav.find((s) => (HUBS[s.section] !== undefined && pathname === HUBS[s.section]) || currentItem(s, pathname) !== null) ?? null;
}
