/**
 * The archetype BUILD contract — what the one engine needs from any archetype to
 * build a store. This is the seam that keeps the engine archetype-blind: the
 * engine selects an archetype, asks it for its authoring prompt, runs Bohdi
 * against its content schema, generates the media it declares, and publishes.
 * Main Street is the first archetype to implement this; the next is data, not
 * new engine code.
 *
 * A maker onboards with nothing — no copy, no products, no photos. So Bohdi
 * builds ALL of it. Products are generic across archetypes (same shape, poured
 * into whatever container the archetype renders), so they live here, not per
 * archetype. The archetype-specific parts are: the content shape, the authoring
 * voice, and which non-product media slots get generated.
 */

/** What Bohdi is told about the maker. Built from the niche + mood + onboarding. */
export interface AuthoringBrief {
  shopName: string;
  nicheDisplayName: string;
  nicheBody: string;
  moodLabel: string;
  moodDescription: string;
  /** Roughly how many products the maker sells — drives how many to author. */
  productCount: number;
  makerName?: string | undefined;
}

/** A product Bohdi invents for a brand-new store. Persisted as a real listing
 *  row; the archetype renders it from the row. Generic across all archetypes. */
export interface ProductBrief {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  basePriceCents: number;
  /** Prompt for this product's photo. Capped count of these actually generate. */
  imagePrompt: string;
}

/** A non-product asset the archetype needs generated (hero video, portrait, …).
 *  Derived from the authored content so the engine can generate without knowing
 *  the archetype's shape. NOT subject to the product-image cap. */
export interface MediaJob {
  /** Stable id used to map the generated URL back via applyMedia. */
  id: string;
  kind: 'video' | 'still';
  prompt: string;
  aspect: '16:9' | '1:1' | '9:16';
  /** Video only. Seconds (3–15). */
  durationSec?: number;
}

export type ContentParse<T> =
  | { ok: true; content: T }
  | { ok: false; issues: Array<{ path: string; message: string }> };

/** Everything the engine needs to build one archetype's store. */
export interface ArchetypeBuilder<TContent> {
  key: string;
  /** The system prompt that has Bohdi author this archetype's content (NOT the
   *  products — the engine appends a shared product brief — and NOT the skin,
   *  which selection picks). */
  buildAuthoringPrompt(brief: AuthoringBrief): string;
  /** Validate the content Bohdi submitted against the archetype's schema. */
  parseContent(raw: unknown): ContentParse<TContent>;
  /** The non-product media this archetype needs generated, from the content. */
  mediaJobs(content: TContent): MediaJob[];
  /** Fold generated media URLs (by job id) back into the content. */
  applyMedia(content: TContent, urls: Record<string, string | null>): TContent;
}
