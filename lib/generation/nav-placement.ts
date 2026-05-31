/**
 * Navbar placement policy for storefront pages.
 *
 * Per the page-architecture policy (project-docs/Page-Architecture-Policy-2026-05-31.md):
 * - Shop, About, Contact are always in the navbar, in that fixed order.
 * - Home, Privacy, Terms are footer-only — never in the navbar.
 * - Any other page a build generates (Events, Calendar, ...) defaults to the navbar,
 *   after the required pages, in the order it was built.
 *
 * Placement is a per-page property (the values written here seed each page's
 * is_in_nav / nav_label / nav_position). It is editable later from the dashboard;
 * nothing here is consulted at render time.
 */

export interface NavPlacement {
  isInNav: boolean;
  navLabel: string | null;
  navPosition: number | null;
}

/** Slugs that belong in the footer, not the navbar. Compared after normalization. */
const FOOTER_ONLY_SLUGS = new Set<string>([
  '',
  'home',
  'privacy',
  'privacy-policy',
  'terms',
  'tos',
  'terms-of-service',
]);

/** Required navbar pages and their fixed order. */
const REQUIRED_POSITION: Record<string, number> = { shop: 10, about: 20, contact: 30 };
const REQUIRED_LABEL: Record<string, string> = {
  shop: 'Shop',
  about: 'About',
  contact: 'Contact',
};

/** Generated pages start after the required three and increment by this step. */
const CUSTOM_START = 40;
const CUSTOM_STEP = 10;

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+/, '').toLowerCase();
}

/**
 * Given the pages of a storefront (in build order), return the navbar placement
 * for each, aligned to the input order.
 */
export function computeNavPlacement(pages: { slug: string; name: string }[]): NavPlacement[] {
  let nextCustomPosition = CUSTOM_START;

  return pages.map((page) => {
    const slug = normalizeSlug(page.slug);

    if (FOOTER_ONLY_SLUGS.has(slug)) {
      return { isInNav: false, navLabel: null, navPosition: null };
    }

    const requiredPosition = REQUIRED_POSITION[slug];
    if (requiredPosition !== undefined) {
      return {
        isInNav: true,
        navLabel: REQUIRED_LABEL[slug] ?? page.name,
        navPosition: requiredPosition,
      };
    }

    const position = nextCustomPosition;
    nextCustomPosition += CUSTOM_STEP;
    return { isInNav: true, navLabel: page.name, navPosition: position };
  });
}
