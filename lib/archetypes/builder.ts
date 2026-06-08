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
import type { ReactElement, ReactNode } from 'react';
import type { ProductView } from './content';
import type { PortableStore } from './portable';

/** Which page of a multi-page archetype to paint. The home is the default; the
 *  rest are the storefront's standard pages. A maker-added custom page renders
 *  through `content` for the generic template (handled by the route, not here). */
export type ArchetypePage = 'home' | 'shop' | 'about' | 'events' | 'contact';

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
  /** True when the image depicts the maker (or a person standing in for them),
   *  so the engine can match the subject to the maker's name. */
  subjectIsPerson?: boolean;
}

export type ParseResult<T> =
  | { ok: true; authored: T }
  | { ok: false; issues: Array<{ path: string; message: string }> };

/** Final content + catalog for persistence/render. Products are a separate
 *  catalog of rows — the archetype never authors the catalog. */
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
   *  A STRUCTURAL gate, not aesthetic steering — an archetype can declare a
   *  minimum catalog it needs to be viable. Catalog size limits which shapes are
   *  on the menu; everything past that stays Bohdi's choice. */
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
   *  selection even though the home shows only a sampling. `page` selects WHICH
   *  page to paint — the archetype is multi-page; it defaults to the home. */
  render(args: {
    content: unknown;
    lookKey: string;
    products: ProductView[];
    mood?: string | undefined;
    catalogSize?: number | undefined;
    page?: ArchetypePage | undefined;
    /** The tenant's uploaded logo URL, if any — shown in the chrome. Injected from
     *  tenant data at render (not authored), so it's separate from `content`. */
    logoUrl?: string | undefined;
    /** The tenant's id — needed by interactive sub-pages (e.g. the contact form
     *  posts it to /api/contact). Injected from tenant data, not authored. */
    tenantId?: string | undefined;
  }): ReactElement;

  /** Paint a single product's detail page in the archetype's chrome. The product
   *  is a row (ProductView); `content` is the stored envelope content (for skin
   *  identity/footer). Optional — an archetype without a product page omits it. */
  renderProduct?(args: { content: unknown; lookKey: string; product: ProductView; logoUrl?: string | undefined }): ReactElement;

  /** Paint a plain content page (legal docs, maker-added pages) in the archetype's
   *  chrome. Pass `body` for authored paragraphs or `html` for pre-rendered markup
   *  (legal docs carry their own headings). Optional. */
  renderContentPage?(args: { content: unknown; lookKey: string; title?: string | undefined; body?: string[] | undefined; html?: string | undefined; logoUrl?: string | undefined }): ReactElement;

  /** Wrap arbitrary children in the archetype's shell (skin bridge + nav + footer).
   *  For functional pages (cart, collections, subscriptions) whose body is bespoke
   *  but which must wear the store's chrome. Optional. */
  renderShell?(args: { content: unknown; lookKey: string; children: ReactNode; logoUrl?: string | undefined }): ReactElement;
}
