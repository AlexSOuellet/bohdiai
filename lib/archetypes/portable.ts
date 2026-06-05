/**
 * The archetype-neutral handoff bundle. Lifting a maker out of one archetype's
 * stored content into this lets another archetype re-express the SAME maker
 * (try-on). Only the maker's content lives here — niche/mood travel separately
 * in the AuthoringBrief.
 */
export interface PortableProduct {
  name: string;
  /** Display price as written, e.g. "$48" or "from $18". */
  price: string;
  description?: string | undefined;
  /** A real photo URL if the source had one, else null. */
  photoUrl?: string | null | undefined;
}

export interface PortableStore {
  shopName: string;
  wordmark: string;
  tagline?: string | undefined;
  maker: {
    headline?: string | undefined;
    body?: string | undefined;
    photoUrl?: string | null | undefined;
  };
  products: PortableProduct[];
}
