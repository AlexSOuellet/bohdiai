/**
 * The one builder (Modular Plan 4b, Session 105): every new site is one content
 * file plus its family and skin. This half is pure: it checks a site's content
 * file and lays out exactly what goes in each home (rows, and which photos fill
 * which spot), so nothing is written unless the whole site is right. The script
 * (scripts/build-site.ts) uploads the photos and writes the rows.
 *
 * Every word the site shows comes in the content file: the words for its design's
 * spots and the shop's spots, all of them, none left blank, none unknown.
 */
import { FAMILY_KEYS, FAMILIES, type FamilyKey } from '@/lib/archetypes/main-street/families';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from '@/lib/archetypes/main-street/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX } from '@/lib/archetypes/card/words';
import { cardSkinKey } from '@/lib/archetypes/card/paint';
import { MAIN_STREET_SKINS } from '@/lib/archetypes/main-street/skins';
import { SCENE_KEY } from '@/lib/archetypes/main-street/scenes';
import { SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX } from '@/lib/storefront/words';
import { wordKeys } from '@/lib/site-words/words';
import { buildProfileHomes, type ProfileForm, type ProfileHomes } from '@/lib/backend/profile/profile-form';
import { buildMomentRow, MOMENT_PHOTOS_LIMIT, type MomentForm, type MomentRow } from '@/lib/backend/moment/moment-form';
import { buildSectionRow, EMPTY_SECTION, SECTION_KEYS, type SectionKey, type SectionRow, type SectionWords } from '@/lib/backend/sections/sections-form';
import { buildTestimonialRow, TESTIMONIALS_LIMIT, type TestimonialRow } from '@/lib/backend/testimonials/testimonial-form';
import { buildDateRow, DATES_LIMIT, type MarketDateForm, type MarketDateRow } from '@/lib/backend/dates/dates-form';
import { CAPTION_MAX, GALLERY_LIMIT } from '@/lib/backend/gallery/gallery-form';
import { HOME_MAX, MAX_PHOTOS } from '@/lib/backend/catalog/product-form';
import { isSitePlan, type SitePlan } from '@/lib/backend/plan/plan';
import { planLinkTargets } from '@/lib/backend/plan/plan-features';
import { isReservedSubdomain } from '@/lib/reserved-subdomains';

/** Which design a site is built on: one of the families, or (until they become
 *  the Scenic and Spotlight families) the shoreline or show reel page. */
export const BUILD_DESIGNS = ['family', 'shoreline', 'showreel'] as const;
export type BuildDesign = (typeof BUILD_DESIGNS)[number];

/** A photo from the build's media folder, and what it shows. */
export type PhotoFile = { file: string; alt: string };

export type ProductFile = {
  name: string;
  /** Left out: made from the name. */
  slug?: string;
  /** In cents; null is "Ask for price". */
  priceCents: number | null;
  description: string;
  short?: string;
  /** First is the main photo. */
  photos: PhotoFile[];
  /** How many she has; left out, one. */
  stock?: number;
  onHome?: boolean;
  isNew?: boolean;
  /** Slugs of the collections it's in. */
  collections?: string[];
};

export type MarketFile = MarketDateForm & { hours?: string; address?: string; booth?: string; url?: string };

/** A site's content file. */
export type SiteFile = {
  site: {
    subdomain: string;
    businessName: string;
    design: BuildDesign;
    family: FamilyKey;
    skin: string;
    plan: SitePlan;
    /** Where the contact form and orders go. */
    contactEmail?: string;
    /** Her craft, a niche slug ("candles", "jewelry_maker"): it names the site in search results. */
    niche?: string;
  };
  profile: ProfileForm;
  portrait?: PhotoFile;
  /** The family's opening (families only). */
  moment?: MomentForm & { media?: PhotoFile & { kind: 'image' | 'video' }; poster?: PhotoFile; photos?: PhotoFile[] };
  /** Each family section's words (families only); a section left out is empty. */
  sections?: Partial<Record<SectionKey, Partial<SectionWords>>>;
  /** The photo behind a Scenic page: a library scene, or the maker's own photo. A Scenic site needs
   *  one; any other family site may have one too, so it shows its own background if it ever wears
   *  Scenic (try on a look, the looks page) and never falls back to the marsh (Alex, 2026-10-19). */
  scene?: SceneFile;
  gallery?: { file: string; caption: string }[];
  collections?: { slug: string; name: string; description?: string }[];
  products?: ProductFile[];
  markets?: MarketFile[];
  testimonials?: { quote: string; name: string; detail?: string }[];
  /** Every word the site shows, by spot ("family.cart.send" → "Send my order"). */
  words: Readonly<Record<string, string>>;
};

/** The photo behind a Scenic site, as the content file names it. */
export type SceneFile =
  | { library: string }
  | {
      photo: PhotoFile;
      /** How light the photo is (left out: light); a dark one takes light lettering. */
      tone?: 'light' | 'dark';
      /** A short muted clip that loops behind the page over the photo. */
      video?: PhotoFile;
    };

export type ProductPlan = {
  slug: string;
  name: string;
  short: string | null;
  description: string;
  priceCents: number | null;
  stock: number;
  onHome: boolean;
  isNew: boolean;
  photos: PhotoFile[];
  collections: string[];
};

export type MarketPlan = MarketDateRow & { hours: string | null; address: string | null; booth: string | null; url: string | null };

/** Everything the site is, home by home, ready to write. */
export type SitePlanned = {
  subdomain: string;
  businessName: string;
  contactEmail: string | null;
  niche: string | null;
  plan: SitePlan;
  /** The page record: settings only (which design, which family and skin). */
  pageRoot: Record<string, unknown>;
  /** Switches the content decides, beyond the plan's own. */
  features: { key: string; enabled: boolean }[];
  /** About the maker, split into its homes. */
  profile: ProfileHomes;
  portrait: PhotoFile | null;
  moment: { row: MomentRow; media: (PhotoFile & { kind: 'image' | 'video' }) | null; poster: PhotoFile | null; photos: PhotoFile[] } | null;
  sections: { section: SectionKey; row: SectionRow }[];
  /** The photo behind the page (Scenic only). */
  scene: SceneFile | null;
  gallery: { photo: PhotoFile; caption: string | null }[];
  collections: { slug: string; name: string; description: string | null }[];
  products: ProductPlan[];
  markets: MarketPlan[];
  testimonials: TestimonialRow[];
  words: { key: string; text: string }[];
  /** Every photo the site uses, once each, for the upload step. */
  files: string[];
};

export type PlanResult = { ok: true; plan: SitePlanned } | { ok: false; errors: string[] };

const SUBDOMAIN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Niche slugs join their words with underscores ("jewelry_maker"). */
const NICHE = /^[a-z0-9]+(_[a-z0-9]+)*$/;
const PHOTO = /\.(webp|jpe?g|png)$/i;
const VIDEO = /\.(mp4|webm)$/i;

/** A slug from a name: "Tide & Pine candle" → "tide-pine-candle". */
export function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Every spot the design shows a word in: its own spots and the shop's. */
export function designWordKeys(design: BuildDesign): string[] {
  const own = design === 'family' ? wordKeys(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX) : wordKeys(CARD_WORD_SPOTS, CARD_WORDS_PREFIX);
  return [...own, ...wordKeys(SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX)];
}

/** Every word a new site of this design gets. A mood site also carries the shoreline
 *  design's buttons and labels, because Scenic is drawn by it and any site can wear
 *  Scenic or try it on (Session 111). */
export function siteWordKeys(design: BuildDesign): string[] {
  return design === 'family' ? [...new Set([...designWordKeys('family'), ...designWordKeys('shoreline')])] : designWordKeys(design);
}

/** True when the skin is one of the family's skins (its moods include the family's public word). */
function skinFits(family: FamilyKey, skin: string): boolean {
  if (MAIN_STREET_SKINS[skin] === undefined) return false;
  return cardSkinKey(FAMILIES[family], skin) === skin;
}

function sectionWords(partial: Partial<SectionWords> | undefined): SectionWords {
  return { ...EMPTY_SECTION, ...(partial ?? {}) };
}

/** Checks a site's content file and lays out what goes in each home. Every
 *  problem is listed at once; nothing is half-built. */
export function planSite(f: SiteFile): PlanResult {
  const errors: string[] = [];
  const s = f.site;
  if (!SUBDOMAIN.test(s.subdomain)) errors.push(`site: "${s.subdomain}" isn't a valid subdomain`);
  else if (isReservedSubdomain(s.subdomain)) errors.push(`site: "${s.subdomain}" is one of BohdiAI's own addresses`);
  if (s.businessName.trim() === '') errors.push('site: the business name is empty');
  if (!(BUILD_DESIGNS as readonly string[]).includes(s.design)) errors.push(`site: unknown design "${s.design}"`);
  if (!(FAMILY_KEYS as readonly string[]).includes(s.family)) errors.push(`site: unknown family "${s.family}"`);
  else if (!skinFits(s.family, s.skin)) errors.push(`site: the skin "${s.skin}" isn't one of the ${s.family} family's skins`);
  if (!isSitePlan(s.plan)) errors.push(`site: unknown plan "${s.plan}"`);
  if (s.niche !== undefined && !NICHE.test(s.niche)) errors.push(`site: "${s.niche}" isn't a niche slug`);
  const family = s.design === 'family';

  // Scenic paints a photo behind the page; no other family has one.
  const scenic = family && s.family === 'scenic';
  const scene = f.scene ?? null;
  if (scenic && scene === null) errors.push('scene: a Scenic site needs the photo behind its page (a library scene or its own photo)');
  if (!family && scene !== null) errors.push('scene: only a family site has a photo behind its page');
  if (scene !== null && 'library' in scene && !SCENE_KEY.test(scene.library)) errors.push(`scene: "${scene.library}" isn't a scene name`);
  if (scene !== null && 'photo' in scene && !PHOTO.test(scene.photo.file)) errors.push(`scene: "${scene.photo.file}" isn't a photo`);
  if (scene !== null && 'photo' in scene && scene.video !== undefined && !VIDEO.test(scene.video.file)) errors.push(`scene: "${scene.video.file}" isn't a video`);
  if (scene !== null && 'photo' in scene && scene.tone !== undefined && scene.tone !== 'light' && scene.tone !== 'dark') errors.push(`scene: "${String(scene.tone)}" is neither light nor dark`);

  // About you.
  const profile = buildProfileHomes(f.profile);
  if (!profile.ok) errors.push(`profile: ${profile.error}`);

  // The opening and the section words belong to the families.
  let moment: SitePlanned['moment'] = null;
  if (family) {
    if (f.moment === undefined) errors.push('moment: a family site needs its opening');
    else {
      const built = buildMomentRow(f.moment);
      if (!built.ok) errors.push(`moment: ${built.error}`);
      const photos = f.moment.photos ?? [];
      if (photos.length > MOMENT_PHOTOS_LIMIT) errors.push(`moment: at most ${MOMENT_PHOTOS_LIMIT} extra photos (got ${photos.length})`);
      const media = f.moment.media ?? null;
      if (media !== null && !(media.kind === 'video' ? VIDEO : PHOTO).test(media.file)) errors.push(`moment: "${media.file}" isn't a ${media.kind === 'video' ? 'video' : 'photo'}`);
      if (built.ok) moment = { row: built.row, media, poster: f.moment.poster ?? null, photos };
    }
  } else {
    if (f.moment !== undefined) errors.push(`moment: the ${s.design} design has no opening of its own (its top line is in About you)`);
    if (f.sections !== undefined) errors.push(`sections: the ${s.design} design reads its headings from its words`);
  }
  // A button may only point at a page the site's plan has (Showcase has no shop).
  if (family && isSitePlan(s.plan)) {
    const open = new Set<string>(planLinkTargets(s.plan));
    const buttons: [string, string | undefined][] = [
      ['moment: the main button', f.moment?.ctaTarget],
      ['moment: the second button', f.moment?.secondCtaTarget],
      ...Object.entries(f.sections ?? {}).map(([key, w]): [string, string | undefined] => [`sections.${key}: the link at the bottom`, w?.moreTarget]),
    ];
    for (const [where, target] of buttons) {
      if (target !== undefined && target !== '' && !open.has(target)) errors.push(`${where} points at "${target}", a page the ${s.plan} plan doesn't have`);
    }
  }
  const sections: SitePlanned['sections'] = [];
  for (const key of Object.keys(f.sections ?? {})) {
    if (!(SECTION_KEYS as readonly string[]).includes(key)) errors.push(`sections: unknown section "${key}"`);
  }
  if (family) {
    for (const key of SECTION_KEYS) {
      const built = buildSectionRow(sectionWords(f.sections?.[key]));
      if (!built.ok) errors.push(`sections.${key}: ${built.error}`);
      else sections.push({ section: key, row: built.row });
    }
  }

  // Gallery.
  const gallery = (f.gallery ?? []).map((g) => ({ photo: { file: g.file, alt: g.caption }, caption: g.caption.trim() === '' ? null : g.caption.trim() }));
  if (gallery.length > GALLERY_LIMIT) errors.push(`gallery: at most ${GALLERY_LIMIT} photos (got ${gallery.length})`);
  for (const g of f.gallery ?? []) if (g.caption.length > CAPTION_MAX) errors.push(`gallery: caption over ${CAPTION_MAX} characters: ${g.file}`);

  // Collections and products.
  const collections = (f.collections ?? []).map((c) => ({ slug: c.slug, name: c.name.trim(), description: c.description?.trim() || null }));
  const colSlugs = new Set<string>();
  for (const c of collections) {
    if (!SLUG.test(c.slug)) errors.push(`collections: "${c.slug}" isn't a valid slug`);
    if (colSlugs.has(c.slug)) errors.push(`collections: "${c.slug}" is listed twice`);
    if (c.name === '') errors.push(`collections: "${c.slug}" has no name`);
    colSlugs.add(c.slug);
  }
  const productSlugs = new Set<string>();
  const products: ProductPlan[] = (f.products ?? []).map((p) => {
    const slug = p.slug ?? slugOf(p.name);
    if (p.name.trim() === '') errors.push('products: a piece has no name');
    if (!SLUG.test(slug)) errors.push(`products: "${slug}" isn't a valid slug`);
    if (productSlugs.has(slug)) errors.push(`products: "${slug}" is listed twice`);
    productSlugs.add(slug);
    if (p.priceCents !== null && (!Number.isInteger(p.priceCents) || p.priceCents < 0)) errors.push(`products: ${slug}'s price isn't whole cents`);
    if (p.photos.length > MAX_PHOTOS) errors.push(`products: ${slug} has more than ${MAX_PHOTOS} photos`);
    for (const c of p.collections ?? []) if (!colSlugs.has(c)) errors.push(`products: ${slug} names a collection that isn't listed: "${c}"`);
    return {
      slug,
      name: p.name.trim(),
      short: p.short?.trim() || null,
      description: p.description.trim(),
      priceCents: p.priceCents,
      stock: p.stock ?? 1,
      onHome: p.onHome === true,
      isNew: p.isNew === true,
      photos: p.photos,
      collections: p.collections ?? [],
    };
  });

  const onHome = products.filter((p) => p.onHome).length;
  if (onHome > HOME_MAX) errors.push(`products: the home page shows up to ${HOME_MAX} (got ${onHome} with onHome)`);

  // Markets and testimonials.
  if ((f.markets ?? []).length > DATES_LIMIT) errors.push(`markets: at most ${DATES_LIMIT} (got ${(f.markets ?? []).length})`);
  const markets: MarketPlan[] = [];
  for (const m of f.markets ?? []) {
    const built = buildDateRow(m);
    if (!built.ok) errors.push(`markets: ${m.date} ${m.name}: ${built.error}`);
    else markets.push({ ...built.row, hours: m.hours?.trim() || null, address: m.address?.trim() || null, booth: m.booth?.trim() || null, url: m.url?.trim() || null });
  }
  if ((f.testimonials ?? []).length > TESTIMONIALS_LIMIT) errors.push(`testimonials: at most ${TESTIMONIALS_LIMIT}`);
  const testimonials: TestimonialRow[] = [];
  for (const t of f.testimonials ?? []) {
    const built = buildTestimonialRow({ id: null, quote: t.quote, name: t.name, detail: t.detail ?? '' });
    if (!built.ok) errors.push(`testimonials: ${t.name}: ${built.error}`);
    else testimonials.push(built.row);
  }

  // Words: every spot the design shows, none blank, none unknown.
  const want = siteWordKeys(s.design);
  const wanted = new Set(want);
  const missing = want.filter((k) => (f.words[k] ?? '') === '');
  if (missing.length > 0) errors.push(`words: ${missing.length} spot(s) have no word: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ', …' : ''}`);
  const unknown = Object.keys(f.words).filter((k) => !wanted.has(k));
  if (unknown.length > 0) errors.push(`words: not spots of the ${s.design} design: ${unknown.slice(0, 12).join(', ')}${unknown.length > 12 ? ', …' : ''}`);

  if (errors.length > 0 || !profile.ok) return { ok: false, errors };

  const portrait = f.portrait ?? null;
  const files = [
    ...(portrait === null ? [] : [portrait.file]),
    ...(scene !== null && 'photo' in scene ? [scene.photo.file, scene.video?.file] : []),
    ...(moment === null ? [] : [moment.media?.file, moment.poster?.file, ...moment.photos.map((p) => p.file)]),
    ...gallery.map((g) => g.photo.file),
    ...products.flatMap((p) => p.photos.map((ph) => ph.file)),
  ].filter((x): x is string => x !== undefined);

  return {
    ok: true,
    plan: {
      subdomain: s.subdomain,
      businessName: s.businessName.trim(),
      contactEmail: s.contactEmail?.trim() || null,
      niche: s.niche ?? null,
      plan: s.plan,
      pageRoot: family
        ? { kind: 'archetype', archetypeKey: 'main-street', mood: s.family, lookKey: s.skin, accentOverride: null, content: {} }
        : { kind: 'archetype', archetypeKey: 'card', mood: s.family, lookKey: s.skin, accentOverride: null, brandPalette: null, content: { design: s.design } },
      features: [
        { key: 'profile', enabled: true },
        { key: 'moment', enabled: family },
        // Markets, the gallery and the catalog screens follow the plan, never the
        // content: a maker adds markets and photos later in their backend (Alex).
      ],
      profile: profile.homes,
      portrait,
      moment,
      sections,
      scene: family ? scene : null,
      gallery,
      collections,
      products,
      markets,
      testimonials,
      words: want.map((key) => ({ key, text: f.words[key] as string })),
      files: [...new Set(files)],
    },
  };
}
