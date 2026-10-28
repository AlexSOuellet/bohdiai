/**
 * Home page section switches (Alex, 2026-10-27): she turns any section of her home
 * page on or off from My site. One row per site per section in
 * site_added_sections, on or off; no row means the design decides (every section
 * shows when it has something in it, except the gallery, which a Market or Full
 * site turns on itself).
 *
 * The keys are the site's own section names (as in site_sections) plus the
 * scrolling line. The family designs call some of them by older names (the pieces
 * are `goods`, About is `founder`, the markets are `findUs`); FAMILY_SECTION maps them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { FeatureKey } from '@/lib/backend/features';
import { getFamily, type SectionKey } from '@/lib/archetypes/main-street/families';

export const HOME_SECTIONS = ['work', 'about', 'markets', 'collections', 'reviews', 'gallery', 'contact', 'close', 'marquee'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export function isHomeSection(value: string): value is HomeSection {
  return (HOME_SECTIONS as readonly string[]).includes(value);
}

/** Each section's name in the family designs. */
export const FAMILY_SECTION: Readonly<Record<HomeSection, SectionKey>> = {
  work: 'goods',
  about: 'founder',
  markets: 'findUs',
  collections: 'collections',
  reviews: 'reviews',
  gallery: 'gallery',
  contact: 'contact',
  close: 'close',
  marquee: 'marquee',
};

/** Her switches as saved: only the sections she has flipped. */
export type HomeSwitches = ReadonlyMap<HomeSection, boolean>;

export async function loadHomeSwitches(db: SupabaseClient<Database>, tenantId: string): Promise<HomeSwitches> {
  const { data, error } = await db.from('site_added_sections').select('section, enabled').eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not read the home page switches: ${error.message}`);
  return new Map((data ?? []).flatMap((r) => (isHomeSection(r.section) ? [[r.section, r.enabled] as const] : [])));
}

/** Whether a section shows: her switch, else the design decides (the gallery waits to be turned on). */
export function sectionOn(switches: HomeSwitches, section: HomeSection): boolean {
  return switches.get(section) ?? section !== 'gallery';
}

/** The sections she turned off, by their family-design names. The gallery is left
 *  to its own loader, which already shows nothing while it is off. */
export function hiddenFamilySections(switches: HomeSwitches): SectionKey[] {
  return HOME_SECTIONS.filter((s) => s !== 'gallery' && !sectionOn(switches, s)).map((s) => FAMILY_SECTION[s]);
}

/** Scenic's home page, top to bottom (the shoreline design). */
const SCENIC_ORDER: readonly HomeSection[] = ['work', 'gallery', 'reviews', 'about', 'markets'];

/** Whether the site's plan has what the section shows. */
function planHas(section: HomeSection, on: ReadonlySet<FeatureKey>): boolean {
  switch (section) {
    case 'work':
      return on.has('catalog');
    case 'collections':
      return on.has('catalog') && on.has('collections');
    case 'reviews':
      return on.has('testimonials');
    case 'markets':
      return on.has('market_dates');
    // Showcase's gallery is the site itself (always on); Market and Full switch theirs.
    case 'gallery':
      return on.has('gallery');
    case 'marquee':
      return on.has('profile');
    default:
      return true;
  }
}

/** The sections her home page can show, in the order a visitor meets them: her
 *  design's own list (the opening always shows, so it has no switch), less what her
 *  plan doesn't have. `mood` is the page record's mood; a custom design has none. */
export function homeSectionsFor(mood: string | null, on: ReadonlySet<FeatureKey>): HomeSection[] {
  if (mood === null) return [];
  const family = getFamily(mood);
  const order =
    family.key === 'scenic'
      ? SCENIC_ORDER
      : family.sectionStack.filter((e) => e.on && e.section !== 'hero').flatMap((e) => HOME_SECTIONS.filter((s) => FAMILY_SECTION[s] === e.section));
  return order.filter((s) => planHas(s, on));
}

/** The page record's mood when the site is a family design; null for a custom design. */
export async function familyMood(db: SupabaseClient<Database>, tenantId: string): Promise<string | null> {
  const { data, error } = await db.from('content_pages').select('layout_tree').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s design: ${error.message}`);
  const root = (data?.layout_tree as { root?: { archetypeKey?: unknown; mood?: unknown } } | null | undefined)?.root;
  if (root?.archetypeKey !== 'main-street') return null;
  return typeof root.mood === 'string' ? root.mood : '';
}
