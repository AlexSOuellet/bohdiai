/**
 * Main Street — link targets: the real pages a free link can point at, and the
 * one map from a target to its route.
 *
 * Pure (no React) so both the content schema and the renderer can share it. The
 * crew authors a TARGET from this list rather than a raw URL, so what a button
 * says and where it goes always agree and a link can never 404 (D46). Every
 * target is a real route — there is no in-page scroll target. The home is a
 * SAMPLING (D32); the full catalog lives at /shop, so "See the work" buttons
 * route to the shop page, not to a section on the home.
 */
export const LINK_TARGETS = ['home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials'] as const;
export type LinkTarget = (typeof LINK_TARGETS)[number];

const LINK_HREFS: Record<LinkTarget, string> = {
  home: '/',
  shop: '/shop',
  about: '/about',
  events: '/events',
  contact: '/contact',
  collections: '/collections',
  testimonials: '/testimonials',
};

/** The one place a link target becomes a route. The renderer owns this map, so
 *  the crew's choice is constrained to pages that exist. */
export function linkHref(target: LinkTarget): string {
  return LINK_HREFS[target];
}
