/**
 * Main Street as a self-describing BUILD spec. Owns its four-beat content, its
 * own product catalog (separate rows), its seven skins, and its render. Bohdi
 * picks the skin and authors everything; this file only describes the shape.
 */
import { z } from 'zod';
import type {
  ArchetypeBuildSpec,
  AuthoringBrief,
  LookOption,
  MediaJob,
  ParseResult,
  RenderPayload,
} from '../builder';
import type { ProductView } from '../content';
import type { PortableStore } from '../portable';
import { MainStreet } from './MainStreet';
import { MainStreetProduct } from './MainStreetProduct';
import { ShopPage, EventsPage, AboutPage, ContactPage, ContentPage, CollectionsPage, CollectionPage, TestimonialsPage, MainStreetSubPage } from './pages';
import { mainStreetArchetype } from './index';
import { MainStreetContentSchema, FOUNDER_TREATMENTS, NAV_VARIANTS, type MainStreetContent, type NavVariant } from './schemas';
import { MAIN_STREET_SKINS, SKIN_DESCRIPTIONS } from './skins';
import { GOODS_TREATMENT_MENU, GOODS_TREATMENTS, type GoodsTreatment } from './goods';
import { COLLECTIONS_TREATMENTS, type CollectionsTreatment } from './collections';
import { REVIEWS_TREATMENTS, type ReviewsTreatment } from './reviews';
import { FINDUS_TREATMENTS, type FindUsTreatment } from './findus';
import type { FounderTreatment } from './founder';
import { getFamily } from './families';
import type { HeroVariantKey } from './hero-catalog';

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

const HERO_KEYS: readonly HeroVariantKey[] = ['story', 'split', 'split-left', 'stacked', 'typographic', 'floating-card', 'editorial-cover', 'collage'];
function asHeroVariant(v?: string): HeroVariantKey | undefined {
  return (HERO_KEYS as readonly string[]).includes(v ?? '') ? (v as HeroVariantKey) : undefined;
}
import { sceneToPrompt } from './scene-prompt';
import { logoTone, applyAccentOverride } from './logo-contrast';

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

function authoringSpec(b: AuthoringBrief): string {
  const target = Math.max(3, Math.min(b.productCount > 0 ? b.productCount : 6, 10));
  const treatments = (Object.entries(GOODS_TREATMENT_MENU) as Array<[string, string]>)
    .map(([k, desc]) => `    - ${k}: ${desc}`)
    .join('\n');
  // Derived from the same source as the menu above so the field spec can never
  // drift out of sync with the registered treatments.
  const treatmentKeys = GOODS_TREATMENTS.join(' | ');
  const nicheSource = b.nicheBody.trim().slice(0, 12000);
  return `MAIN STREET — a paced sales page in four full-width beats: (1) THE MOMENT, a full-screen held video with a short brand story told one line at a time, cross-fading, landing on the brand and a button; (2) GOODS in motion, a moving showcase of products; (3) THE FOUNDER beside a "find us this week" calendar; (4) THE CLOSE, a big-type sign-off. Layout, fonts, color, spacing, and motion are fixed by the archetype and the skin you already chose. Author the content and write vivid generation prompts for the hero video, the founder portrait, and each product photo.

NICHE SOURCE — context on this kind of shop and, above all, WHO buys from it and WHY. Use it to understand the customer: what they are really looking for, and what a ${b.nicheDisplayName.toLowerCase()} gives them that a store-bought version never can. Do NOT mine it for materials, techniques, or process to repeat back — the customer does not care how the work is made. Speak at the level of a "${b.nicheDisplayName.toLowerCase()}" in general (not a narrow sub-type), and never contradict the source.

${nicheSource}

---

GOODS TREATMENT — pick the body the goods beat wears (goods.treatment), the one that fits THIS shop. The home shows only a small sampling of products either way, so catalog size is a hint, not a rule:
${treatments}

ABOUT TREATMENT — pick the body the About/founder beat wears (founder.treatment). All show the maker only; the find-us calendar is its OWN separate section, never inside the About beat:
    - quote: portrait beside a pull-quote (calm, authority-forward)
    - portrait: a large contained portrait, the quote over a soft scrim (cinematic)
    - letter: the quote as a short signed note, small inset portrait (intimate)
    - card: the "meet the maker" card — eyebrow, heading, round face, a warm pull-quote (personal)

Call submit_store with { content, products }.

content (MAX lengths are real; stay comfortably under them):
- shopName (2-40)
- identity: { wordmark (2-28), nav (2-6 { label, target } items — label 2-18, target one of: home | shop | about | events | contact | collections | testimonials — pick the pages this store USES; ALWAYS include shop; include collections when you author collection items; include testimonials when you author reviews) }
- moment: { media: { kind: "video" OR "image" — prefer a held VIDEO. The Moment's signature wow is MOTION: a slow cinematic clip that breathes. Choose a still ONLY when there is genuinely nothing to animate — and almost every shop has something (a flame, steam, fabric settling, light shifting across a surface, water moving); prompt: a STRUCTURED scene, fill every group with a short phrase — { composition, subject, environment, atmosphere, camera, lighting, style }. This image is the WOW: it must be CINEMATIC and CARRY EMOTION — the opening shot of a film, evoking the same feeling your story reaches for, the thing the customer is really after. It is NOT a literal product photo and NOT the object the product sits on or in — choose atmosphere, light, and feeling over depiction. Use the groups like a cinematographer: real composition (depth, shallow focus, an evocative angle), expressive lighting (golden, low, raking, backlit), and a filmic style. A person may appear only if it deepens the feeling, and then as a fragment — hands, a silhouette, a figure from behind — never a posed portrait. For VIDEO the subject MUST be neutral and ambient (steam rising, a flame breathing, dust drifting in a light beam, fabric settling) and the motion slow and continuous — NEVER a person performing an action and NEVER a big lighting change, because the clip loops and any action or flash jumps on the restart; alt (4-120) }, story (2-4 strings, each 4-48, NO punctuation at all — not even periods between words; apostrophes and hyphens within a word are fine): the lines together TELL ONE STORY that builds line to line and lands on the brand — not four disconnected slogans. Make the customer FEEL why they want this kind of work — the desire it answers, never how it is made), eyebrow (4-48), brand (2-28), ctaLabel (3-24), secondaryCtaLabel (3-24, optional) }
- goods: { title (2-48), treatment (one of: ${treatmentKeys} — your pick from above), label (2-24, optional), viewAllLabel (2-28, ALWAYS author — the "see all" cue on the home goods teaser; the shop is the full catalog) }
- collections (ALWAYS author — collections is a page like every other. The band on the home is a teaser; the /collections page shows them all; /collections/[slug] shows the pieces in one; the maker edits later): { title (2-48 — the page/band heading), label (2-24, optional — a small eyebrow), viewAllLabel (2-28 — the "see all collections" cue), items (author EXACTLY 3 niche-appropriate collections; each: name (2-32 — plain, category-level, in the store's voice; NOT the shop name; NOT a duplicate of goods.title), description (12-140 — one sentence in the store's voice about what the collection holds), slug (2-40 lowercase-hyphen)) }
- founder: { quote (24-280, first person, ~2 sentences, about WHY they make this and what it means to the people they make for — no process detail, no AI-tell), attribution (4-60), treatment (one of: quote | portrait | letter | card — your pick from the ABOUT TREATMENT menu above), eyebrow (2-24, optional — for the card, e.g. "Since 2019"), heading (2-28, optional — for the card, e.g. "Meet Mara"), photo: { prompt (8-400): the maker, alt (4-120) }, aboutLabel (2-28, ALWAYS author — the "read the full story" cue), findUs (optional — its OWN section on the home, NOT inside the About beat; seed 1-5 plausible sample dates the maker can edit or turn off later): { title (2-48 — the Events page heading in the store's voice, e.g. "Where to find us", "This season's dates"), label (2-28), eventsLabel (2-28, ALWAYS author when findUs is authored — the "see all dates" cue), rows (1-5): { day (1-12), where (4-60), time (1-12) } } }
- reviews (ALWAYS author — reviews are a page like every other, seeded like the find-us dates): { title (2-48 — the page/band heading), label (2-24, optional), viewAllLabel (2-28 — the "read all reviews" cue on the home teaser), items (author 3-5 plausible testimonials in the customer's voice, each: quote (30-280), author (2-40 — a plausible customer name), location (2-40, optional)), summary (optional — { score (a rating like "4.9" or "5.0"), count (a small number like "142", "80+") }) }
- close: { label (2-28), headline (6-72), ctaLabel (3-24) }
- about (ALWAYS author — the CONTACT and ABOUT pages are the maker's own words; a missing field means a blank page. The full ABOUT page — the maker's story at LENGTH; the home founder beat is only a teaser of this): { heading (4-60), story (2-5 paragraphs, each 40+, no hard cap — who the maker is, how they got here, and why it matters to the people they make for; warm and personal, never process detail or generic filler) }
- contact (ALWAYS author — the CONTACT page invitation, in the maker's voice; do NOT invent an email or phone): { heading (4-48), intro (20+, no hard cap) }

products (author ${target}; a brand-new store with no catalog, so you create it): each { name (2-40, plain category-level names, not a narrow specialty), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12+, no hard cap — sell it to the customer, what it is and why they would want it, the feeling and the use; NOT how it is made, no materials or process), basePriceCents (integer cents, e.g. 4800 = $48), imagePrompt (8-400): a clean product photo on a fitting surface }.

VOICE — your job is to SELL THE STORE EMOTIONALLY: make a visitor FEEL why they want this. Write to the customer's desire, never the maker's process.
- Answer the real question: why would someone choose a ${b.nicheDisplayName.toLowerCase()}'s work over the store-bought version? What feeling, meaning, or quality is the shelf missing? Lead with THAT.
- Stay at the CATEGORY level — the universal reason people want a ${b.nicheDisplayName.toLowerCase()}, not a narrow specialty or material (a candle maker, not a "soy candle maker"; a leatherworker, not a "heritage leatherworker").
- NO process or materials jargon. Cut any line about how the work is made — hand-cut, small-batch, 20-mil, saddle-stitched, hand-trimmed. The customer does not care, and the maker will add their own specifics after the build.
- So do NOT over-specify or invent details. Write the emotional frame, true to the category, that the maker will make their own.
- No AI-tell ("crafted with care", "every piece tells a story"); short sentences; no em-dashes or semicolons; NO terminal punctuation in headlines or the brand; the hero story lines carry NO punctuation at all (not even mid-line periods or commas — "Flour. Water. Salt. Time." is wrong; "Flour water salt time" is right).`;
}

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
  content: MainStreetContent,
  logoUrl?: string,
  brandColors?: string[],
): MainStreetContent {
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

function handOff(a: MainStreetAuthored): PortableStore {
  return {
    shopName: a.content.shopName,
    wordmark: a.content.identity.wordmark,
    tagline: a.content.moment.eyebrow,
    maker: {
      body: a.content.founder.quote,
      photoUrl: a.content.founder.photo.url ?? null,
    },
    products: a.products.map((p, i) => ({
      name: p.name,
      price: formatPrice(p.basePriceCents),
      description: p.description,
      photoUrl: a.productUrls[i] ?? null,
    })),
  };
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

/** Apply a nav-variant override (the ?nav= preview) onto the content's identity, so
 *  every nav site — each hero, every sub-page header, the product page — reads it. */
function withNav(content: MainStreetContent, navVariant?: NavVariant): MainStreetContent {
  if (!navVariant) return content;
  return { ...content, identity: { ...content.identity, navVariant } };
}

export const MAIN_STREET_SPEC: ArchetypeBuildSpec<MainStreetAuthored> = {
  key: 'main-street',
  label: 'Main Street',
  menuDescription:
    'A paced sales page whose hero IS a cinematic moment — a held video with the brand story revealing line by line — then goods in motion, the founder beside a find-us calendar, and a big-type close. For a maker whose pitch is a feeling and a story, with a modest-to-large catalog shown as a sampling.',
  // Works at any catalog size — the home is a sampling, so even a few products read fine.
  fitsCatalog: () => true,
  looks,
  authoringSpec,
  parseSubmission,
  mediaJobs,
  applyMedia,
  toPayload,
  handOff,
  render: ({ content, lookKey, products, catalogSize, page, collectionSlug, logoUrl, brandColors, accentOverride, tenantId, mood, heroVariant, goodsTreatment, collections, collectionsTreatment, reviewsTreatment, findUsTreatment, founderTreatment, navVariant }) => {
    const skin = applyAccentOverride(mainStreetArchetype.resolveTheme({ skinKey: lookKey }), accentOverride);
    // Resolve the family AND its section variants from the tenant's mood, then
    // apply any preview URL overrides. Every page below wears the SAME picks so
    // a /shop teaser matches what /home advertised. The home's section ORDER
    // + on/off comes from the family's stack too. Bohdi authors CONTENT ONLY.
    const family = getFamily(mood);
    const treatments = resolveTreatments(mood, {
      hero: heroVariant, goods: goodsTreatment, collections: collectionsTreatment,
      reviews: reviewsTreatment, founder: founderTreatment, findUs: findUsTreatment, nav: navVariant,
    });
    const c = withNav(withLogo(content as MainStreetContent, logoUrl, brandColors), treatments.nav);
    switch (page) {
      case 'shop':
        return <ShopPage content={c} skin={skin} products={products} treatments={treatments} family={family} />;
      case 'events':
        return <EventsPage content={c} skin={skin} treatments={treatments} family={family} />;
      case 'about':
        return <AboutPage content={c} skin={skin} treatments={treatments} family={family} />;
      case 'contact':
        return <ContactPage content={c} skin={skin} tenantId={tenantId} family={family} />;
      case 'collections':
        return <CollectionsPage content={c} skin={skin} collections={collections ?? []} treatments={treatments} family={family} />;
      case 'collection': {
        // The route already filtered products to this collection's rows; look up
        // the collection itself so we can title the page. Falls back to a stub if
        // the slug wasn't in the list (shouldn't happen — route 404s first).
        const collection = (collections ?? []).find((x) => x.slug === collectionSlug)
          ?? { slug: collectionSlug ?? '', name: 'Collection', count: products.length };
        return <CollectionPage content={c} skin={skin} collection={collection} products={products} treatments={treatments} family={family} />;
      }
      case 'testimonials':
        return <TestimonialsPage content={c} skin={skin} treatments={treatments} family={family} />;
      default:
        return <MainStreet content={c} skin={skin} products={products} sectionStack={family.sectionStack} catalogSize={catalogSize} momentKey={tenantId} heroVariant={treatments.hero} goodsTreatment={treatments.goods} collections={collections} collectionsTreatment={treatments.collections} reviewsTreatment={treatments.reviews} findUsTreatment={treatments.findUs} founderTreatment={treatments.founder} family={family} />;
    }
  },
  renderProduct: ({ content, lookKey, product, mood, logoUrl, brandColors, accentOverride }) => {
    const skin = applyAccentOverride(mainStreetArchetype.resolveTheme({ skinKey: lookKey }), accentOverride);
    // Product pages wear the family's nav variant AND the family's wallpaper.
    const family = getFamily(mood);
    const treatments = resolveTreatments(mood, {});
    const c = withNav(withLogo(content as MainStreetContent, logoUrl, brandColors), treatments.nav);
    return <MainStreetProduct content={c} skin={skin} product={product} family={family} />;
  },
  renderContentPage: ({ content, lookKey, title, body, html, mood, logoUrl, brandColors, accentOverride }) => {
    const skin = applyAccentOverride(mainStreetArchetype.resolveTheme({ skinKey: lookKey }), accentOverride);
    const family = getFamily(mood);
    const treatments = resolveTreatments(mood, {});
    const c = withNav(withLogo(content as MainStreetContent, logoUrl, brandColors), treatments.nav);
    return <ContentPage content={c} skin={skin} title={title} body={body} html={html} family={family} />;
  },
  renderShell: ({ content, lookKey, children, mood, logoUrl, brandColors, accentOverride }) => {
    const skin = applyAccentOverride(mainStreetArchetype.resolveTheme({ skinKey: lookKey }), accentOverride);
    const family = getFamily(mood);
    const treatments = resolveTreatments(mood, {});
    const c = withNav(withLogo(content as MainStreetContent, logoUrl, brandColors), treatments.nav);
    return <MainStreetSubPage content={c} skin={skin} family={family}>{children}</MainStreetSubPage>;
  },
};
