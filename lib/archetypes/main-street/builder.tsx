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
import { MainStreet } from './MainStreet';
import { mainStreetArchetype } from './index';
import { MainStreetContentSchema, type MainStreetContent } from './schemas';
import { MAIN_STREET_SKINS } from './skins';
import { GOODS_TREATMENT_MENU } from './goods';

const SKIN_DESCRIPTIONS: Record<string, string> = {
  'main-street-ember': 'warm cream and ember, a soft serif — homey, cozy, hand-baked',
  'main-street-tannery': 'dark brown-black leather with aged brass, a sturdy slab — rugged and warm',
  'main-street-forge': 'cold blue-charcoal with mustard, condensed industrial caps — metal and machine',
  'main-street-anvil': 'near-black with a single blood red, heavy blunt caps — butcher-sign bold',
  'main-street-porcelain': 'blush white and aubergine, a fine hairline serif — romantic and delicate',
  'main-street-botanical': 'oat and deep forest green, a soft optical serif — earthy and seasonal',
  'main-street-atelier': 'paper white with ink and thin gold, a sharp didone — clean modern luxury',
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
  description: z.string().min(12).max(300),
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
  return `MAIN STREET — a paced sales page in four full-width beats: (1) THE MOMENT, a full-screen held video with a short brand story told one line at a time, cross-fading, landing on the brand and a button; (2) GOODS in motion, a moving showcase of products; (3) THE FOUNDER beside a "find us this week" calendar; (4) THE CLOSE, a big-type sign-off. Layout, fonts, color, spacing, and motion are fixed by the archetype and the skin you already chose. Author the content and write vivid generation prompts for the hero video, the founder portrait, and each product photo.

GOODS TREATMENT — pick the body the goods beat wears (goods.treatment), the one that fits THIS shop. The home shows only a small sampling of products either way, so catalog size is a hint, not a rule:
${treatments}

Call submit_store with { content, products }.

content (MAX lengths are real; stay comfortably under them):
- shopName (2-40)
- identity: { wordmark (2-28), nav (2-4 strings, each 2-18) }
- moment: { media: { kind: "video", prompt (8-400): a SLOW, held, atmospheric hero video (gentle motion — hands working, light moving; never fast cuts), alt (4-120) }, story (2-4 strings, each 4-48, NO punctuation at all — not even periods between words; apostrophes and hyphens within a word are fine), eyebrow (4-48), brand (2-28), ctaLabel (3-24), secondaryCtaLabel (3-24, optional) }
- goods: { title (2-48), treatment (one of: marquee | procession | switcher | slideshow — your pick from above), label (2-24, optional), viewAllLabel (2-28, optional) }
- founder: { quote (24-280, first person, ~2 sentences, specific, no AI-tell), attribution (4-60), photo: { prompt (8-400): the maker, alt (4-120) }, aboutLabel (2-28, optional), findUs (optional): { label (2-28), eventsLabel (2-28, optional), rows (1-5): { day (1-12), where (4-60), time (1-12) } } }
- close: { label (2-28), headline (6-72), ctaLabel (3-24) }

products (author ${target}; a brand-new store with no catalog, so you create it): each { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12-300), basePriceCents (integer cents, e.g. 4800 = $48), imagePrompt (8-400): a clean product photo on a fitting surface }.

VOICE: specifics over platitudes; no AI-tell ("crafted with care", "every piece tells a story"); short sentences; no em-dashes or semicolons; NO terminal punctuation in headlines or the brand; the hero story lines carry NO punctuation at all (not even mid-line periods or commas — "Flour. Water. Salt. Time." is wrong; "Flour water salt time" is right).`;
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
  const jobs: MediaJob[] = [
    { id: 'hero', kind: 'video', prompt: a.content.moment.media.prompt, aspect: '16:9', durationSec: 6, group: 'feature' },
    { id: 'portrait', kind: 'still', prompt: a.content.founder.photo.prompt, aspect: '1:1', group: 'feature' },
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
