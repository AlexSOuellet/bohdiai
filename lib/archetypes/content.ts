/**
 * Shared catalog content — the maker's data, archetype-agnostic.
 *
 * This is the "shared core" that makes try-on possible. A product lives ONCE
 * (projected from the listings + variations tables), and ANY archetype reads
 * this same shape to render it in its own language. Archetypes must NOT invent
 * bespoke product shapes — they consume these types. When a maker tries on a
 * different archetype, this content flows in unchanged; only the presentation
 * differs.
 *
 * Mirrors the real model: supabase `listings` (+ media_ids) and
 * `variation_attributes` / `variation_options`. Prices are pre-formatted here
 * (from base_price_cents + currency) so renderers stay presentation-only.
 */

/** A resolved media item (media_ids → image or video). */
export interface CatalogMedia {
  kind: 'image' | 'video';
  /** Resolved URL — an image src, or a video src. */
  url?: string;
  /** Alt text for an image, or an accessible label for a video. */
  alt: string;
  /** Poster still for a video. */
  poster?: string;
}

/** A seller-defined variation axis with its options ("Size" → S / M / L). Per D4. */
export interface CatalogVariation {
  /** Attribute name as the seller wrote it: "Size", "Metal", "Scent". */
  name: string;
  options: string[];
}

export type CatalogStatus = 'active' | 'sold_out' | 'unavailable';

/** One product, projected from a listing (+ its media and variations). */
export interface ProductView {
  slug: string;
  name: string;
  /** Formatted from base_price_cents + currency, e.g. "$148" or "from $40". */
  price: string;
  shortDescription?: string;
  description: string;
  status: CatalogStatus;
  /** Ordered media resolved from media_ids — images and/or video. First is primary. */
  media: CatalogMedia[];
  /** Seller-defined variations. Empty if the product has none. */
  variations: CatalogVariation[];
}
