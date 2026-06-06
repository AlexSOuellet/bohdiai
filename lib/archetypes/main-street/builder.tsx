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
import { mainStreetArchetype } from './index';
import { MainStreetContentSchema, type MainStreetContent } from './schemas';
import { MAIN_STREET_SKINS } from './skins';
import { GOODS_TREATMENT_MENU } from './goods';
import { sceneToPrompt } from './scene-prompt';

const SKIN_DESCRIPTIONS: Record<string, string> = {
  // Hearth — warm, handmade, domestic
  'main-street-ember': 'warm cream and ember, a soft serif — homey, cozy, hand-baked',
  'main-street-orchard': 'golden amber and terracotta, a warm hand-cut serif — harvest evening',
  'main-street-pantry': 'bright kitchen cream and garden green, a sturdy slab — fresh and farm-direct',
  'main-street-hearthstone': 'candlelit dark with ember amber, a high-contrast serif — cozy after dark',
  // Workshop — rugged, made-to-last
  'main-street-tannery': 'dark brown-black leather with aged brass, a sturdy slab — rugged and warm',
  'main-street-forge': 'cold blue-charcoal with mustard, condensed industrial caps — metal and machine',
  'main-street-anvil': 'near-black with a single blood red, heavy blunt caps — butcher-sign bold',
  'main-street-sawdust': 'light oak and wood-stain brown, a clean slab — the daylight woodshop',
  // Fine — refined, quiet, luxe
  'main-street-porcelain': 'blush white and aubergine, a fine hairline serif — romantic and delicate',
  'main-street-atelier': 'paper white with ink and thin gold, a sharp didone — clean modern luxury',
  'main-street-gild': 'black and thin gold, a high-contrast serif — the lit jewel case',
  // Garden — botanical, earthy, seasonal
  'main-street-botanical': 'oat and deep forest green, a soft optical serif — earthy and seasonal',
  'main-street-conservatory': 'pale leaf-white and garden green, an airy roman serif — the glasshouse',
  'main-street-wildflower': 'warm meadow cream and cosmos pink, a blowsy display serif — bright and seasonal',
  // Studio — art-forward, the goods are the art
  'main-street-studio': 'bone-white gallery wall, huge ink type, one hot vermillion — quiet room, loud art',
  'main-street-darkroom': 'charcoal wall and cold slate, a characterful grotesque — moody gallery',
  'main-street-pigment': 'bright white and hot magenta, a big bold grotesque — for vivid, colorful work',
  // Mystic — esoteric, moody, celestial
  'main-street-nightshade': 'violet-black and electric amethyst with a gold hairline, a carved gothic — deep occult',
  'main-street-celestine': 'pale dawn-lilac and dusk violet, an engraved roman — soft and celestial',
  'main-street-ritual': 'near-black and a single blood red, a dramatic serif — candlelit and intense',
  // Playroom — playful, bright, friendly
  'main-street-confetti': 'butter cream with poppy and grape, a rounded heavy display — bright and playful',
  'main-street-bubblegum': 'cotton-candy white with bubblegum pink and pool cyan, a rounded display — candy loud',
  'main-street-sprout': 'soft pistachio and warm apricot, a gentle rounded sans — the friendly, quiet end of playful',
  // Press — graphic, inky, urban
  'main-street-pressroom': 'bone paper with off-register riso red and blue, condensed poster caps — screenprint',
  'main-street-marquee': 'black with one neon-lime, a wall of poster caps — streetwear and bold',
  'main-street-broadside': 'newsprint gray with stamped red, condensed caps — the raw zine',
  // Relic — vintage, nostalgic, aged
  'main-street-heirloom': 'faded ochre paper, sepia ink, worn teal and oxblood, an old Caslon — found, not made',
  'main-street-curiosity': 'deep wood and brass with a bottle-green band, a Victorian display — the vintage cabinet',
  'main-street-postmark': 'aged paper with retro orange and teal, an ornate display serif — mid-century ephemera',
};

const looks: LookOption[] = Object.values(MAIN_STREET_SKINS).map((s) => ({
  key: s.key,
  label: s.label,
  description: SKIN_DESCRIPTIONS[s.key] ?? s.label,
}));

// Main Street holds products as separate rows (name, real price in cents, copy,
// and an image prompt). Bohdi invents them — a new store has no catalog.
const ProductSchema = z.object({
  name: z.string().min(2).max(40),
  slug: z.string().min(2).max(48),
  shortDescription: z.string().min(4).max(90),
  description: z.string().min(12).max(600),
  basePriceCents: z.number().int().min(100).max(5_000_00),
  imagePrompt: z.string().min(8).max(400),
});
const ProductsSchema = z.array(ProductSchema).min(3).max(12);
type ProductBriefT = z.infer<typeof ProductSchema>;

interface MainStreetAuthored {
  content: MainStreetContent;
  products: ProductBriefT[];
  productUrls: Array<string | null>;
}

function authoringSpec(b: AuthoringBrief): string {
  const target = Math.max(3, Math.min(b.productCount > 0 ? b.productCount : 6, 10));
  const treatments = (Object.entries(GOODS_TREATMENT_MENU) as Array<[string, string]>)
    .map(([k, desc]) => `    - ${k}: ${desc}`)
    .join('\n');
  const nicheSource = b.nicheBody.trim().slice(0, 12000);
  return `MAIN STREET — a paced sales page in four full-width beats: (1) THE MOMENT, a full-screen held video with a short brand story told one line at a time, cross-fading, landing on the brand and a button; (2) GOODS in motion, a moving showcase of products; (3) THE FOUNDER beside a "find us this week" calendar; (4) THE CLOSE, a big-type sign-off. Layout, fonts, color, spacing, and motion are fixed by the archetype and the skin you already chose. Author the content and write vivid generation prompts for the hero video, the founder portrait, and each product photo.

NICHE SOURCE — this is how makers in this niche actually talk, what they sell, the materials and techniques they use, and who buys from them. MINE IT. Name real products, real materials, real processes from it. The copy must sound like THIS ${b.nicheDisplayName.toLowerCase()}, not a generic shop. Do not invent niche facts that contradict it.

${nicheSource}

---

GOODS TREATMENT — pick the body the goods beat wears (goods.treatment), the one that fits THIS shop. The home shows only a small sampling of products either way, so catalog size is a hint, not a rule:
${treatments}

Call submit_store with { content, products }.

content (MAX lengths are real; stay comfortably under them):
- shopName (2-40)
- identity: { wordmark (2-28), nav (2-4 strings, each 2-18) }
- moment: { media: { kind: "video" OR "image" — a held VIDEO or a cinematic STILL. A still is an equally strong hero and has no loop seam, so prefer a still unless real ambient motion genuinely adds something; prompt: a STRUCTURED scene, fill every group with a short phrase — { composition, subject, environment, atmosphere, camera, lighting, style }. For VIDEO the subject MUST be neutral and ambient (steam rising, a flame breathing, dust drifting in a light beam, fabric settling) and the motion slow and continuous — NEVER a person performing an action and NEVER a big lighting change, because the clip loops and any action or flash jumps on the restart; alt (4-120) }, story (2-4 strings, each 4-48, NO punctuation at all — not even periods between words; apostrophes and hyphens within a word are fine): the lines together TELL ONE STORY that builds line to line and lands on the brand — not four disconnected slogans. Draw the specifics from the niche source), eyebrow (4-48), brand (2-28), ctaLabel (3-24), secondaryCtaLabel (3-24, optional) }
- goods: { title (2-48), treatment (one of: marquee | procession | switcher | slideshow — your pick from above), label (2-24, optional), viewAllLabel (2-28, optional) }
- founder: { quote (24-280, first person, ~2 sentences, specific, no AI-tell), attribution (4-60), photo: { prompt (8-400): the maker, alt (4-120) }, aboutLabel (2-28, optional), findUs (optional): { label (2-28), eventsLabel (2-28, optional), rows (1-5): { day (1-12), where (4-60), time (1-12) } } }
- close: { label (2-28), headline (6-72), ctaLabel (3-24) }

products (author ${target}; a brand-new store with no catalog, so you create it): each { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12-600, write real substance — materials, use, what makes it specific; not one thin line), basePriceCents (integer cents, e.g. 4800 = $48), imagePrompt (8-400): a clean product photo on a fitting surface }.

VOICE: specifics over platitudes; no AI-tell ("crafted with care", "every piece tells a story"); short sentences; no em-dashes or semicolons; NO terminal punctuation in headlines or the brand; the hero story lines carry NO punctuation at all (not even mid-line periods or commas — "Flour. Water. Salt. Time." is wrong; "Flour water salt time" is right). Write like THIS maker in THIS niche: name real materials, techniques, and product types from the niche source. Concrete beats abstract every time. If a line could appear on any shop's site, rewrite it.`;
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
  // The hero follows the AUTHORED kind — a still is an equally valid hero and
  // sidesteps the loop seam entirely. The scene is serialized for the provider:
  // JSON (+ seamless-loop intent) for video, prose for a still.
  const heroKind: 'video' | 'still' = a.content.moment.media.kind === 'image' ? 'still' : 'video';
  const heroPrompt = sceneToPrompt(a.content.moment.media.prompt, heroKind);
  const hero: MediaJob =
    heroKind === 'video'
      ? { id: 'hero', kind: 'video', prompt: heroPrompt, aspect: '16:9', durationSec: 6, group: 'feature' }
      : { id: 'hero', kind: 'still', prompt: heroPrompt, aspect: '16:9', group: 'feature' };
  const jobs: MediaJob[] = [
    hero,
    { id: 'portrait', kind: 'still', prompt: a.content.founder.photo.prompt, aspect: '1:1', group: 'feature', subjectIsPerson: true },
  ];
  a.products.forEach((p, i) => {
    jobs.push({ id: `product:${i}`, kind: 'still', prompt: p.imagePrompt, aspect: '1:1', group: 'product' });
  });
  return jobs;
}

function applyMedia(a: MainStreetAuthored, urls: Record<string, string | null>): MainStreetAuthored {
  const content: MainStreetContent = {
    ...a.content,
    moment: { ...a.content.moment, media: { ...a.content.moment.media, ...(urls['hero'] ? { url: urls['hero'] } : {}) } },
    founder: { ...a.content.founder, photo: { ...a.content.founder.photo, ...(urls['portrait'] ? { url: urls['portrait'] } : {}) } },
  };
  const productUrls = a.products.map((_, i) => urls[`product:${i}`] ?? null);
  return { ...a, content, productUrls };
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
  render: ({ content, lookKey, products, mood, catalogSize }) => {
    const skin = mainStreetArchetype.resolveTheme({ skinKey: lookKey });
    return (
      <MainStreet
        content={content as MainStreetContent}
        skin={skin}
        products={products}
        mood={mood}
        catalogSize={catalogSize}
      />
    );
  },
};
