/**
 * The archetype BUILD contract — what the one engine needs from any archetype so
 * BOHDI, not the engine, makes every creative call. The engine does not pick the
 * archetype, the look, the words, the products, or the images. It presents the
 * menu, runs Bohdi, generates from his prompts, and publishes. Each archetype is
 * fully self-describing: its content shape, its product model, its looks.
 *
 * A maker onboards with nothing, so Bohdi builds all of it. Product photos are
 * the only thing capped (see the engine's MAX_PRODUCT_IMAGES) — every other
 * asset generates freely; the cap is expressed per media job via `group`.
 */
import type { ReactElement } from 'react';
import type { ProductView } from './content';
import type { PortableStore } from './portable';

/** What Bohdi is told about the maker. Built from the niche + mood + onboarding. */
export interface AuthoringBrief {
  shopName: string;
  nicheDisplayName: string;
  nicheBody: string;
  moodLabel: string;
  moodDescription: string;
  productCount: number;
  makerName?: string | undefined;
}

/** One look (skin/theme) Bohdi can pick for a given archetype. */
export interface LookOption {
  key: string;
  label: string;
  description: string;
}

/** An asset to generate from Bohdi's prompt. `group: 'product'` photos are
 *  capped and recycled; `'feature'` (hero video, portraits, collections) free. */
export interface MediaJob {
  id: string;
  kind: 'video' | 'still';
  prompt: string;
  aspect: '16:9' | '1:1' | '9:16';
  durationSec?: number;
  group: 'product' | 'feature';
}

export type ParseResult<T> =
  | { ok: true; authored: T }
  | { ok: false; issues: Array<{ path: string; message: string }> };

/** Final content + catalog for persistence/render. Products may be a separate
 *  catalog (Main Street) or already embedded in content (Gallery → empty here). */
export interface RenderPayload {
  content: unknown;
  products: ProductView[];
}

/** Everything the engine needs to let Bohdi build (and later render) one
 *  archetype. Generic over the archetype's authored submission type T. */
export interface ArchetypeBuildSpec<T = unknown> {
  key: string;
  label: string;
  /** One line for the menu: what this archetype IS / when it fits. Bohdi reads
   *  this to choose; it must not steer toward any niche. */
  menuDescription: string;
  /** Whether this archetype is structurally viable for a catalog of this size.
   *  A STRUCTURAL gate, not aesthetic steering — e.g. the Gallery's wall needs a
   *  dense catalog, so a tiny shop can't fill it. Catalog size limits which
   *  shapes are on the menu; everything past that stays Bohdi's choice. */
  fitsCatalog(productCount: number): boolean;
  /** The looks Bohdi may pick for this archetype (its own skins/themes). */
  looks: LookOption[];
  /** The fields Bohdi authors once he's chosen this archetype (incl. products,
   *  in whatever shape this archetype holds them). Returned by choose_format. */
  authoringSpec(brief: AuthoringBrief): string;
  /** Validate Bohdi's full submission for this archetype. */
  parseSubmission(raw: unknown): ParseResult<T>;
  /** Every asset to generate, derived from the submission. */
  mediaJobs(authored: T): MediaJob[];
  /** Fold generated URLs (by job id) back into the submission. */
  applyMedia(authored: T, urls: Record<string, string | null>): T;
  /** Content + catalog for persistence/render. */
  toPayload(authored: T): RenderPayload;
  /** Lift the maker's portable content out of THIS archetype's stored content,
   *  so another archetype can re-express the same maker (try-on). Optional — an
   *  archetype that can't be a try-on SOURCE omits it. */
  handOff?(content: T): PortableStore;
  /** Paint a stored store. Products come from the tenant's listing rows (empty
   *  for archetypes that embed products in content). `catalogSize` is the maker's
   *  TRUE catalog size (what they entered at onboarding), which drives treatment
   *  selection even though the home shows only a sampling. */
  render(args: {
    content: unknown;
    lookKey: string;
    products: ProductView[];
    mood?: string | undefined;
    catalogSize?: number | undefined;
  }): ReactElement;
}
