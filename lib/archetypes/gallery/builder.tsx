/**
 * Gallery as a self-describing BUILD spec. Its products live INSIDE the content
 * (the wall of 8-24 tiles, each with its own photo) and it dresses in its own
 * four curated themes. Bohdi picks a theme and authors the wall; this file only
 * describes the shape. The product-photo cap still applies — a dense wall rides
 * on ≤5 generated images, recycled across the tiles.
 */
import type {
  ArchetypeBuildSpec,
  AuthoringBrief,
  LookOption,
  MediaJob,
  ParseResult,
  RenderPayload,
} from '../builder';
import { Gallery } from './Gallery';
import { galleryArchetype } from './index';
import { GalleryContentSchema, type GalleryContent } from './schemas';
import { GALLERY_THEMES } from './themes';

const THEME_DESCRIPTIONS: Record<string, string> = {
  'gallery-bone': 'warm off-white paper, ink type — bright, calm, neutral',
  'gallery-slate': 'cool grey, crisp and architectural — modern and quiet',
  'gallery-ink': 'near-black, gallery-at-night — dramatic, work glows off the dark',
  'gallery-linen': 'soft natural linen, gentle warmth — handmade and unhurried',
};

const looks: LookOption[] = Object.values(GALLERY_THEMES).map((t) => ({
  key: t.key,
  label: t.label,
  description: THEME_DESCRIPTIONS[t.key] ?? t.label,
}));

function authoringSpec(b: AuthoringBrief): string {
  const wallTarget = Math.max(8, Math.min(b.productCount > 0 ? b.productCount : 12, 18));
  return `GALLERY — a maker's shop wall: a dense, browsable grid of work is the centerpiece, the instant inventory and price are visible. Composition (identity → wall → collections → maker → markets → footer), fonts, color, spacing, the unifying photo grade, and motion are fixed by the archetype and the theme you chose. Author the slots and write a vivid image prompt for every photo.

Call submit_store with { content } (the products ARE the wall, inside content — there is no separate products list).

content:
- shopName (2-40)
- identity: { wordmark (2-28), tagline (8-96, one line of the maker's voice), nav (2-4 strings, each 2-18) }
- wall: { products: array of ${wallTarget} (min 8, max 24): each { name (2-48), price (1-14, as written e.g. "$42" or "from $18"), photo: { prompt (8-400): a clean shot of the piece, alt (4-120) }, tag (2-18, optional, e.g. "1 of 1", "New") } }
- collections (optional): { title (2-36), items (2-4): { name (2-40), photo: { prompt (8-400), alt (4-120) } } }
- maker: { label (2-24), headline (6-52), body (40-480, the story in the maker's voice), photo: { prompt (8-400): the maker, alt (4-120) }, ctaLabel (3-28) }
- markets (optional): { title (4-40), events (1-5): { dateLabel (2-24), name (2-60) } }
- footer: { blurb (8-90), columns: exactly 2: { title (2-24), items (2-5 strings, each 1-28) } }

VOICE: specifics over platitudes; no AI-tell ("crafted with care"); short sentences; no em-dashes or semicolons; no terminal punctuation in the wordmark, tagline, or headline.`;
}

function parseSubmission(raw: unknown): ParseResult<GalleryContent> {
  const obj = (raw ?? {}) as { content?: unknown };
  const c = GalleryContentSchema.safeParse(obj.content);
  if (c.success) return { ok: true, authored: c.data };
  return { ok: false, issues: c.error.issues.map((i) => ({ path: `content.${i.path.join('.')}`, message: i.message })) };
}

function mediaJobs(content: GalleryContent): MediaJob[] {
  const jobs: MediaJob[] = [];
  content.wall.products.forEach((p, i) => {
    jobs.push({ id: `product:${i}`, kind: 'still', prompt: p.photo.prompt, aspect: '1:1', group: 'product' });
  });
  jobs.push({ id: 'maker', kind: 'still', prompt: content.maker.photo.prompt, aspect: '1:1', group: 'feature' });
  content.collections?.items.forEach((c, i) => {
    jobs.push({ id: `collection:${i}`, kind: 'still', prompt: c.photo.prompt, aspect: '1:1', group: 'feature' });
  });
  return jobs;
}

function applyMedia(content: GalleryContent, urls: Record<string, string | null>): GalleryContent {
  const wall = {
    products: content.wall.products.map((p, i) => {
      const u = urls[`product:${i}`];
      return u ? { ...p, photo: { ...p.photo, url: u } } : p;
    }),
  };
  const maker = urls['maker']
    ? { ...content.maker, photo: { ...content.maker.photo, url: urls['maker'] } }
    : content.maker;
  const collections = content.collections
    ? {
        ...content.collections,
        items: content.collections.items.map((c, i) => {
          const u = urls[`collection:${i}`];
          return u ? { ...c, photo: { ...c.photo, url: u } } : c;
        }),
      }
    : content.collections;
  return { ...content, wall, maker, ...(collections ? { collections } : {}) };
}

function toPayload(content: GalleryContent): RenderPayload {
  return { content, products: [] }; // products are embedded in the wall
}

export const GALLERY_SPEC: ArchetypeBuildSpec<GalleryContent> = {
  key: 'gallery',
  label: 'Gallery',
  menuDescription:
    "A maker's shop wall: a dense, browsable grid of work is the centerpiece, inventory and price visible the instant you land, with the maker's story and face supporting it. For a maker with a lot of visual pieces to show, where the work itself is the pitch.",
  looks,
  authoringSpec,
  parseSubmission,
  mediaJobs,
  applyMedia,
  toPayload,
  render: ({ content, lookKey }) => {
    const theme = galleryArchetype.resolveTheme({ themeKey: lookKey });
    return <Gallery content={content as GalleryContent} theme={theme} />;
  },
};
