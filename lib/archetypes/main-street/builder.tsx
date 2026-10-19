/**
 * Main Street as a self-describing BUILD spec. Owns its four-beat content, its
 * own product catalog (separate rows), its seven skins, and its render. Bohdi
 * picks the skin and authors everything; this file only describes the shape.
 */
import { z } from 'zod';
import type {
  ArchetypeBuildSpec,
  LookOption,
  MediaJob,
  ParseResult,
  RenderPayload,
} from '../builder';
import type { CartView, ProductView } from '../content';
import { MainStreet } from './MainStreet';
import { MainStreetProduct } from './MainStreetProduct';
import { ShopPage, EventsPage, AboutPage, ContactPage, ContentPage, CollectionsPage, CollectionPage, TestimonialsPage, MainStreetSubPage } from './pages';
import { mainStreetArchetype } from './index';
import { MainStreetContentSchema, FOUNDER_TREATMENTS, NAV_VARIANTS, type MainStreetContent, type MainStreetView, type NavVariant } from './schemas';
import { MAIN_STREET_SKINS, SKIN_DESCRIPTIONS } from './skins';
import { GOODS_TREATMENTS, type GoodsTreatment } from './goods';
import { COLLECTIONS_TREATMENTS, type CollectionsTreatment } from './collections';
import { REVIEWS_TREATMENTS, type ReviewsTreatment } from './reviews';
import { FINDUS_TREATMENTS, type FindUsTreatment } from './findus';
import type { FounderTreatment } from './founder';
import { getFamily, type Family } from './families';
import type { HeroVariantKey } from './hero-catalog';
import { readSectionResolutions } from '@/lib/editor/section-state';
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { familyViewFromHomes, holdsLegacyContent, loadFamilyHomes } from './from-homes';
import { getSiteWords } from '@/lib/site-words/queries';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { loadRunningSale } from '@/lib/storefront/promotions-load';
import { withSale, type Promotion } from '@/lib/storefront/promotions';
import { loadShopWords } from '@/lib/storefront/metadata';
import { FamilyCart } from './FamilyCart';
import { FamilyMarket } from './FamilyMarket';
import { MainStreetRoot } from './chrome';
import { getSiteScene } from '@/lib/backend/scene/queries';
import type { ScenePhoto } from './scenes';
import { Type } from './Type';
import { FAMILY_NO_WORDS, FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX, type FamilyWords } from './words';

/** Every section variant the family (or a preview override) picks for a render.
 *  Populated at the builder level from the tenant's mood + any active URL previews;
 *  passed through to the home renderer and every sub-page so they can carry the
 *  same picks the home teaser sold. */
export interface MainStreetTreatments {
  hero: HeroVariantKey;
  goods: GoodsTreatment;
  collections: CollectionsTreatment;
  reviews: ReviewsTreatment;
  founder: FounderTreatment;
  findUs: FindUsTreatment;
  nav: NavVariant;
}

/** Resolve the family from the tenant's mood, then apply any preview overrides
 *  on top. Overrides are narrowed through the as*Treatment guards so an unknown
 *  string (?goods=bogus) silently falls back to the family default. */
function resolveTreatments(mood: string | null | undefined, previews: {
  hero?: string | undefined; goods?: string | undefined; collections?: string | undefined;
  reviews?: string | undefined; founder?: string | undefined; findUs?: string | undefined;
  nav?: string | undefined;
}): MainStreetTreatments {
  const family = getFamily(mood);
  return {
    hero: asHeroVariant(previews.hero) ?? family.sectionDefaults.hero,
    goods: asGoodsTreatment(previews.goods) ?? family.sectionDefaults.goods,
    collections: asCollectionsTreatment(previews.collections) ?? family.sectionDefaults.collections,
    reviews: asReviewsTreatment(previews.reviews) ?? family.sectionDefaults.reviews,
    founder: asFounderTreatment(previews.founder) ?? family.sectionDefaults.founder,
    findUs: asFindUsTreatment(previews.findUs) ?? family.sectionDefaults.findUs,
    nav: asNavVariant(previews.nav) ?? family.sectionDefaults.nav,
  };
}

const HERO_KEYS: readonly HeroVariantKey[] = ['story', 'split', 'split-left', 'stacked', 'typographic', 'floating-card', 'editorial-cover', 'collage', 'playbill'];
function asHeroVariant(v?: string): HeroVariantKey | undefined {
  return (HERO_KEYS as readonly string[]).includes(v ?? '') ? (v as HeroVariantKey) : undefined;
}
import { sceneToPrompt } from './scene-prompt';
import { logoTone, applyAccentOverride } from './logo-contrast';
import { applyBrandPalette, type BrandPalette } from '@/lib/color/brand-palette';
import type { ArchetypeTheme } from '../types';

const looks: LookOption[] = Object.values(MAIN_STREET_SKINS).map((s) => ({
  key: s.key,
  label: s.label,
  description: SKIN_DESCRIPTIONS[s.key] ?? s.label,
}));

// Main Street holds products as separate rows (name, real price in cents, copy,
// and an image prompt). Bohdi invents them — a new store has no catalog.
//
// Per D53 (sharpened): no length caps. The schema validates shape only; the
// renderer handles any length via CSS line-clamp on cards. Floors are .min(1)
// so a required string can't be empty — an empty product name is a broken row.
const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  basePriceCents: z.number().int().min(1),
  // Feeds the image model (not rendered) — no length cap, only a non-empty floor.
  imagePrompt: z.string().min(1),
});
const ProductsSchema = z.array(ProductSchema).min(1);
type ProductBriefT = z.infer<typeof ProductSchema>;

export interface MainStreetAuthored {
  content: MainStreetContent;
  products: ProductBriefT[];
  productUrls: Array<string | null>;
}

// The pre-crew one-shot Bohdi prompt (`authoringSpec`) was retired in Session
// 70 when the Try-On tool was removed. Onboarding runs through the Director +
// Crew now (`lib/onboarding/crew/`). The interface no longer requires it.

function parseSubmission(raw: unknown): ParseResult<MainStreetAuthored> {
  const obj = (raw ?? {}) as { content?: unknown; products?: unknown };
  const issues: Array<{ path: string; message: string }> = [];
  const c = MainStreetContentSchema.safeParse(obj.content);
  if (!c.success) for (const i of c.error.issues) issues.push({ path: `content.${i.path.join('.')}`, message: i.message });
  const p = ProductsSchema.safeParse(obj.products);
  if (!p.success) for (const i of p.error.issues) issues.push({ path: `products.${i.path.join('.')}`, message: i.message });
  if (c.success && p.success) {
    return { ok: true, authored: { content: c.data, products: p.data, productUrls: [] } };
  }
  return { ok: false, issues };
}

function mediaJobs(a: MainStreetAuthored): MediaJob[] {
  // The hero follows the authored kind — a still is an equally valid hero and
  // sidesteps the loop seam entirely. The scene is serialized for the provider:
  // JSON (+ seamless-loop intent) for video, prose for a still. A very subtle CSS
  // push-in adds cinematic time to a still at render; the generated asset is held.
  const heroKind: 'video' | 'still' =
    a.content.moment.media.kind === 'still' ? 'still' : 'video';
  const heroPrompt = sceneToPrompt(a.content.moment.media.prompt, heroKind);
  const hero: MediaJob =
    heroKind === 'video'
      ? { id: 'hero', kind: 'video', prompt: heroPrompt, aspect: '16:9', durationSec: 4, group: 'feature' }
      : { id: 'hero', kind: 'still', prompt: heroPrompt, aspect: '16:9', group: 'feature' };
  const jobs: MediaJob[] = [
    hero,
    { id: 'portrait', kind: 'still', prompt: a.content.founder.photo.prompt, aspect: '1:1', group: 'feature', subjectIsPerson: true },
  ];
  a.products.forEach((p, i) => {
    jobs.push({ id: `product:${i}`, kind: 'still', prompt: p.imagePrompt, aspect: '1:1', group: 'product' });
  });
  // The Collage hero's three stills — feature group (generated freely, not capped
  // like products), so a swap to Collage finds them ready. Square source, cropped
  // to the collage frame at render. Absent when the build authored no collage shots.
  (a.content.moment.collageShots ?? []).forEach((s, i) => {
    jobs.push({ id: `collage:${i}`, kind: 'still', prompt: sceneToPrompt(s.prompt, 'still'), aspect: '1:1', group: 'feature' });
  });
  return jobs;
}

function applyMedia(a: MainStreetAuthored, urls: Record<string, string | null>): MainStreetAuthored {
  const collageShots = a.content.moment.collageShots?.map((s, i) => ({
    ...s,
    ...(urls[`collage:${i}`] ? { url: urls[`collage:${i}`]! } : {}),
  }));
  const content: MainStreetContent = {
    ...a.content,
    moment: {
      ...a.content.moment,
      media: { ...a.content.moment.media, ...(urls['hero'] ? { url: urls['hero'] } : {}) },
      ...(collageShots ? { collageShots } : {}),
    },
    founder: { ...a.content.founder, photo: { ...a.content.founder.photo, ...(urls['portrait'] ? { url: urls['portrait'] } : {}) } },
  };
  const productUrls = a.products.map((_, i) => urls[`product:${i}`] ?? null);
  return { ...a, content, productUrls };
}

/** Fold the tenant's uploaded logo and brand colors (tenant facts, not authored
 *  content) into the content's identity so the chrome can show the logo and apply
 *  the correct contrast surface. No-op when neither is present. */
function withLogo(
  content: MainStreetView,
  logoUrl?: string,
  brandColors?: string[],
): MainStreetView {
  const hasLogo = logoUrl !== undefined && logoUrl !== '';
  const hasColors = brandColors !== undefined && brandColors.length > 0;
  if (!hasLogo && !hasColors) return content;
  const identity = { ...content.identity };
  if (hasLogo) identity.logoUrl = logoUrl;
  if (hasColors) identity.logoTone = logoTone(brandColors!);
  return { ...content, identity };
}

function formatPrice(cents: number): string {
  const d = cents / 100;
  return Number.isInteger(d) ? `$${d}` : `$${d.toFixed(2)}`;
}

function toPayload(a: MainStreetAuthored): RenderPayload {
  const products: ProductView[] = a.products.map((p, i) => {
    const url = a.productUrls[i] ?? null;
    return {
      slug: p.slug,
      name: p.name,
      price: formatPrice(p.basePriceCents),
      shortDescription: p.shortDescription,
      description: p.description,
      status: 'active',
      media: url ? [{ kind: 'image', url, alt: p.name }] : [],
      variations: [],
    };
  });
  return { content: a.content, products };
}

/** Narrow the free-form ?goods= preview string to a real treatment, ignoring
 *  anything not registered (an unknown value falls back to the authored/size pick). */
function asGoodsTreatment(v?: string): GoodsTreatment | undefined {
  return (GOODS_TREATMENTS as readonly string[]).includes(v ?? '') ? (v as GoodsTreatment) : undefined;
}

/** Narrow the free-form ?about= preview string to a real founder treatment, ignoring
 *  anything not registered (an unknown value falls back to the authored/quote pick). */
function asFounderTreatment(v?: string): FounderTreatment | undefined {
  return (FOUNDER_TREATMENTS as readonly string[]).includes(v ?? '') ? (v as FounderTreatment) : undefined;
}

/** Narrow the free-form ?nav= preview string to a real nav variant. */
function asNavVariant(v?: string): NavVariant | undefined {
  return (NAV_VARIANTS as readonly string[]).includes(v ?? '') ? (v as NavVariant) : undefined;
}

/** Narrow the free-form ?collections= preview string to a real treatment, ignoring
 *  anything not registered (an unknown value falls back to the authored/default band). */
function asCollectionsTreatment(v?: string): CollectionsTreatment | undefined {
  return (COLLECTIONS_TREATMENTS as readonly string[]).includes(v ?? '') ? (v as CollectionsTreatment) : undefined;
}

/** Narrow the free-form ?reviews= preview string to a real treatment, ignoring
 *  anything not registered (an unknown value falls back to the authored/default). */
function asReviewsTreatment(v?: string): ReviewsTreatment | undefined {
  return (REVIEWS_TREATMENTS as readonly string[]).includes(v ?? '') ? (v as ReviewsTreatment) : undefined;
}

/** Narrow the free-form ?findus= preview string to a real treatment, ignoring
 *  anything not registered (an unknown value falls back to the authored/default). */
function asFindUsTreatment(v?: string): FindUsTreatment | undefined {
  return (FINDUS_TREATMENTS as readonly string[]).includes(v ?? '') ? (v as FindUsTreatment) : undefined;
}

/** True when a hex background is dark enough that a black texture would vanish on
 *  it — used to pick the texture blend mode (multiply on light, screen on dark).
 *  Uses perceived luminance (sRGB-weighted); threshold 0.4 splits the six
 *  families cleanly (Dark + Rustic dark; Cozy / Luxury / Cheerful / Modern light). */
function hexIsDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const digits = m?.[1];
  if (digits === undefined) return false;
  const n = Number.parseInt(digits, 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.4;
}

/** The skin a page paints in: the shop's brand palette takes over the whole skin
 *  palette when set; otherwise the mood's skin with any baked accent tint. */
function themeFor(lookKey: string, brandPalette: BrandPalette | undefined, accentOverride: string | undefined): ArchetypeTheme {
  const base = mainStreetArchetype.resolveTheme({ skinKey: lookKey });
  return brandPalette !== undefined ? applyBrandPalette(base, brandPalette) : applyAccentOverride(base, accentOverride);
}

/** The family a page paints with. Under a brand palette the family wallpaper is
 *  switched off: it paints as a colored image over the page and would wash the
 *  brand's own surface toward the mood's color. Grain stays. */
function familyFor(mood: string | undefined, brandPalette: BrandPalette | undefined): Family {
  const family = getFamily(mood);
  return brandPalette !== undefined ? { ...family, textureOpacity: 0 } : family;
}

/** Scenic: the site's chosen photo (a library scene or its own) replaces the family's default scene. */
function withScene(family: Family, scene: ScenePhoto | null): Family {
  return scene === null ? family : { ...family, wallpaperUrl: scene.url, textureFocus: scene.focus, ...(scene.tone === undefined ? {} : { textureTone: scene.tone }), ...(scene.video === undefined ? {} : { textureVideo: scene.video }) };
}

/** Apply a nav-variant override (the ?nav= preview) onto the content's identity, so
 *  every nav site — each hero, every sub-page header, the product page — reads it. */
function withNav(content: MainStreetView, navVariant?: NavVariant): MainStreetView {
  if (!navVariant) return content;
  return { ...content, identity: { ...content.identity, navVariant } };
}

/** Where a one-page site sends the pages it doesn't have. */
const ONE_PAGE_ANCHORS = { about: '/#about', events: '/#find-us', contact: '/#contact', testimonials: '/' } as const;

/** Paints a family page from its view, the site's words and the sale running today (Full promotions). */
type FamilyPaint = (view: MainStreetView, words: FamilyWords, sale: Promotion | null, scene: ScenePhoto | null) => ReactElement;

/** A family page's content comes from the site's homes. The old samples, whose
 *  page record still holds their content, read it from there until the clean-up
 *  step retires them (Modular Plan steps 3 and 6). Both paths read the site's
 *  words from `site_words`; a page with no site behind it has none to read. */
function withFamilyContent(content: unknown, tenantId: string | undefined, paint: FamilyPaint, scenic: boolean): ReactElement {
  if (tenantId === undefined) {
    if (holdsLegacyContent(content)) return paint(content as MainStreetView, FAMILY_NO_WORDS, null, null);
    notFound();
  }
  return <FamilyFromHomes content={content} tenantId={tenantId} paint={paint} scenic={scenic} />;
}

async function FamilyFromHomes({ content, tenantId, paint, scenic }: { content: unknown; tenantId: string; paint: FamilyPaint; scenic: boolean }): Promise<ReactElement> {
  const db = supabaseAdmin();
  const legacy = holdsLegacyContent(content);
  // Scenic paints the site's own photo behind the page (a library scene or the maker's photo).
  const [words, homes, features, sale, scene] = await Promise.all([
    getSiteWords(db, tenantId, FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX),
    legacy ? Promise.resolve(null) : loadFamilyHomes(db, tenantId),
    getSiteFeatures(tenantId),
    loadRunningSale(db, tenantId),
    scenic ? getSiteScene(db, tenantId) : Promise.resolve(null),
  ]);
  // The plans, from the site's switches (old samples too): only Full sells online
  // (cart), and Showcase has no shop at all (catalog off).
  const view = homes !== null ? familyViewFromHomes(homes, words) : (content as MainStreetView);
  return paint({ ...view, identity: { ...view.identity, sellsOnline: features.has('cart'), showsShop: features.has('catalog'), onePage: !features.has('catalog') } }, words, sale, scene);
}

/** The pieces as the lists show them during a running sale: the sale price in place of the full one. */
function salePriced(products: readonly ProductView[], sale: Promotion | null): ProductView[] {
  return withSale(products, sale).map((p) => (p.salePrice === undefined ? p : { ...p, price: p.salePrice }));
}

/** The cart page's body: the cart (Full), or for a site without one the plain
 *  "nothing to buy here" page in the site's own words, so a stale cart link still lands somewhere. */
async function FamilyCartBody({ view, words, cart, tenantId }: { view: MainStreetView; words: FamilyWords; cart: CartView; tenantId: string }): Promise<ReactElement> {
  // Showcase has no shop, so no cart page either.
  if (view.identity.showsShop === false) notFound();
  if (view.identity.sellsOnline === true) return <FamilyCart cart={cart} words={words} />;
  const w = (await loadShopWords(tenantId)).cart;
  return (
    <section className="ms-simple-page">
      <div className="ms-simple-inner">
        <Type as="span" role="eyebrow" className="ms-simple-eyebrow">
          {w.eyebrow}
        </Type>
        <Type as="h1" role="closeHead" className="ms-simple-head">
          {w.title}
        </Type>
        <Type as="p" role="body" className="ms-simple-body">
          {w.body}
        </Type>
        <Type as="a" role="navLabel" href="/shop" className="ms-simple-cta">
          {w.cta}
        </Type>
      </div>
    </section>
  );
}

export const MAIN_STREET_SPEC: ArchetypeBuildSpec<MainStreetAuthored> = {
  key: 'main-street',
  label: 'Main Street',
  menuDescription:
    'A paced sales page whose hero IS a cinematic moment — a held video with the brand story revealing line by line — then goods in motion, the founder beside a find-us calendar, and a big-type close. For a maker whose pitch is a feeling and a story, with a modest-to-large catalog shown as a sampling.',
  // Works at any catalog size — the home is a sampling, so even a few products read fine.
  fitsCatalog: () => true,
  usesCatalog: true,
  looks,
  parseSubmission,
  mediaJobs,
  applyMedia,
  toPayload,
  render: ({ content, lookKey, products: rawProducts, catalogSize, page, collectionSlug, logoUrl, brandColors, accentOverride, brandPalette, tenantId, mood, originalMood, heroVariant, goodsTreatment, collections, collectionsTreatment, reviewsTreatment, findUsTreatment, founderTreatment, navVariant, previewTexture, previewTextureOpacity }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    // Resolve the family AND its section variants from the tenant's mood, then
    // apply any preview URL overrides. Every page below wears the SAME picks so
    // a /shop teaser matches what /home advertised. The home's section ORDER
    // + on/off comes from the family's stack too. Bohdi authors CONTENT ONLY.
    const familyBase = familyFor(mood, brandPalette);
    // Editor Door 2 texture. These params come either from the editor preview (URL)
    // or, on a live visit, from the saved setting resolved in StorefrontPage. States:
    //   previewTexture === 'none'    → no texture at all (plain family color)
    //   previewTexture === 'default' → the family's own wallpaper, at its default
    //                                  strength or a maker-dialed opacity override
    //   previewTexture is a URL      → that texture, blended onto the bg (unproven
    //                                  blend path kept for a future curated library; D63)
    //   omitted                      → the family's own default wallpaper, untouched
    //
    // For the blend (URL) path only: the PNG is black-ink-on-transparent, so to keep
    // the maker's BACKGROUND COLOR (not repaint it) we BLEND rather than fill — multiply
    // on a light family (darkens the existing color, hue preserved), invert+screen on a
    // dark one (lightens it, hue preserved). The base color stays either way.
    const dialedOpacity = previewTextureOpacity !== undefined && Number.isFinite(previewTextureOpacity)
      ? previewTextureOpacity
      : undefined;
    let familyPainted: Family;
    if (previewTexture === 'none') {
      familyPainted = { ...familyBase, textureOpacity: 0 };
    } else if (previewTexture === 'default') {
      familyPainted = { ...familyBase, textureOpacity: dialedOpacity ?? familyBase.textureOpacity };
    } else if (previewTexture !== undefined && previewTexture !== '') {
      const bgIsDark = hexIsDark(brandPalette !== undefined ? skin.palette.bg : familyBase.palette.bg);
      familyPainted = {
        ...familyBase,
        wallpaperUrl: previewTexture,
        textureMode: bgIsDark ? 'screen' : 'multiply',
        textureOpacity: dialedOpacity ?? 0.5,
      };
    } else {
      familyPainted = familyBase;
    }
    const treatments = resolveTreatments(mood, {
      hero: heroVariant, goods: goodsTreatment, collections: collectionsTreatment,
      reviews: reviewsTreatment, founder: founderTreatment, findUs: findUsTreatment, nav: navVariant,
    });
    // The maker's walk resolutions ride on the raw envelope content alongside the
    // authored fields (old samples only). Read them here so the home render can hide
    // turned-off sections and keep seeded dates out of the marquee.
    const resolutions = readSectionResolutions(content);
    return withFamilyContent(content, tenantId, (view, words, sale, scene) => {
    const family = withScene(familyPainted, scene);
    const c = withNav(withLogo(view, logoUrl, brandColors), treatments.nav);
    // A running sale (Full) shows its price on every piece in the lists; the piece's own page shows both.
    const products = salePriced(rawProducts, sale);
    // Showcase has no shop: its shop, collections and collection pages don't exist.
    const showsShop = c.identity.showsShop !== false;
    if (!showsShop && (page === 'shop' || page === 'collections' || page === 'collection')) notFound();
    // A one-page site (Showcase) has no About, Events or Contact page: their old
    // addresses land on the section of the home page that holds them.
    if (c.identity.onePage === true && page !== undefined && page in ONE_PAGE_ANCHORS) redirect(ONE_PAGE_ANCHORS[page as keyof typeof ONE_PAGE_ANCHORS]);
    switch (page) {
      case 'shop':
        return <ShopPage content={c} skin={skin} words={words} products={products} family={family} />;
      case 'events':
        return <EventsPage content={c} skin={skin} words={words} family={family} />;
      case 'about':
        return <AboutPage content={c} skin={skin} words={words} treatments={treatments} family={family} />;
      case 'contact':
        return <ContactPage content={c} skin={skin} words={words} tenantId={tenantId} family={family} />;
      case 'collections':
        return <CollectionsPage content={c} skin={skin} words={words} collections={collections ?? []} family={family} />;
      case 'collection': {
        // The route already filtered products to this collection's rows; look up
        // the collection itself so we can title the page. Falls back to an untitled
        // stub if the slug wasn't in the list (shouldn't happen — route 404s first).
        const collection = (collections ?? []).find((x) => x.slug === collectionSlug)
          ?? { slug: collectionSlug ?? '', name: '', count: products.length };
        return <CollectionPage content={c} skin={skin} words={words} collection={collection} products={products} treatments={treatments} family={family} />;
      }
      case 'testimonials':
        return <TestimonialsPage content={c} skin={skin} words={words} family={family} />;
      default:
        return <MainStreet content={c} skin={skin} words={words} products={products} sectionStack={family.sectionStack} catalogSize={catalogSize} momentKey={tenantId} heroVariant={treatments.hero} goodsTreatment={treatments.goods} collections={collections} collectionsTreatment={treatments.collections} reviewsTreatment={treatments.reviews} findUsTreatment={treatments.findUs} founderTreatment={treatments.founder} family={family} hiddenSections={showsShop ? resolutions.hidden : [...resolutions.hidden, 'goods', 'collections']} shownSections={resolutions.shown} originalMood={originalMood} />;
    }
    }, familyPainted.key === 'scenic');
  },
  renderProduct: ({ content, lookKey, product, mood, logoUrl, brandColors, accentOverride, brandPalette, tenantId }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    // Product pages wear the family's nav variant AND the family's wallpaper.
    const familyBase = familyFor(mood, brandPalette);
    const treatments = resolveTreatments(mood, {});
    return withFamilyContent(content, tenantId, (view, words, sale, scene) => {
      const family = withScene(familyBase, scene);
      // Showcase has no shop, so no page for a piece.
      if (view.identity.showsShop === false) notFound();
      const c = withNav(withLogo(view, logoUrl, brandColors), treatments.nav);
      const [priced = product] = withSale([product], sale);
      return <MainStreetProduct content={c} skin={skin} words={words} product={priced} family={family} />;
    }, familyBase.key === 'scenic');
  },
  renderContentPage: ({ content, lookKey, title, body, html, mood, logoUrl, brandColors, accentOverride, brandPalette, tenantId }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    const familyBase = familyFor(mood, brandPalette);
    const treatments = resolveTreatments(mood, {});
    return withFamilyContent(content, tenantId, (view, words, _sale, scene) => {
      const family = withScene(familyBase, scene);
      const c = withNav(withLogo(view, logoUrl, brandColors), treatments.nav);
      return <ContentPage content={c} skin={skin} words={words} title={title} body={body} html={html} family={family} />;
    }, familyBase.key === 'scenic');
  },
  renderShell: ({ content, lookKey, children, mood, logoUrl, brandColors, accentOverride, brandPalette, tenantId }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    const familyBase = familyFor(mood, brandPalette);
    const treatments = resolveTreatments(mood, {});
    return withFamilyContent(content, tenantId, (view, words, _sale, scene) => {
      const family = withScene(familyBase, scene);
      const c = withNav(withLogo(view, logoUrl, brandColors), treatments.nav);
      return <MainStreetSubPage content={c} skin={skin} words={words} family={family}>{children}</MainStreetSubPage>;
    }, familyBase.key === 'scenic');
  },
  renderCart: ({ content, lookKey, cart, mood, logoUrl, brandColors, accentOverride, brandPalette, tenantId }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    const familyBase = familyFor(mood, brandPalette);
    const treatments = resolveTreatments(mood, {});
    return withFamilyContent(content, tenantId, (view, words, _sale, scene) => {
      const family = withScene(familyBase, scene);
      const c = withNav(withLogo(view, logoUrl, brandColors), treatments.nav);
      return (
        <MainStreetSubPage content={c} skin={skin} words={words} family={family} current="/cart">
          <FamilyCartBody view={view} words={words} cart={cart} tenantId={tenantId} />
        </MainStreetSubPage>
      );
    }, familyBase.key === 'scenic');
  },
  renderMarket: ({ content, lookKey, market, mood, accentOverride, brandPalette, tenantId }) => {
    const skin = themeFor(lookKey, brandPalette, accentOverride);
    const familyBase = familyFor(mood, brandPalette);
    return withFamilyContent(content, tenantId, (view, words, _sale, scene) => (
      <FamilyMarketPage tenantId={tenantId}>
        <MainStreetRoot skin={skin} family={withScene(familyBase, scene)}>
          <FamilyMarket shopName={view.shopName} market={market} words={words} />
        </MainStreetRoot>
      </FamilyMarketPage>
    ), familyBase.key === 'scenic');
  },
};

/** A market's page is there on Market and Full (the market shop switch), never on Showcase. */
async function FamilyMarketPage({ tenantId, children }: { tenantId: string; children: ReactElement }): Promise<ReactElement> {
  if (!(await getSiteFeatures(tenantId)).has('market_shop')) notFound();
  return children;
}
