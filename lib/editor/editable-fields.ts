/**
 * The editable-field registry — the content-only lever for Bohdi's content editor.
 *
 * It lists EVERY generated text field in the home envelope so the maker can reword
 * anything we wrote (comprehensive, not a hand-picked subset — D67). Its existence
 * is also the guardrail: a path not in this registry can't be written, so Bohdi
 * stays off structure, look, nav, link destinations, the shop name, and images.
 *
 * Deliberately EXCLUDED because they aren't ours to rewrite:
 *   - the maker's own inputs — `shopName`, `moment.brand`, `identity.*`
 *   - images — every media/photo/collage slot (handled by upload, not rewording)
 *   - structure — treatments, section order, link targets (`*.ctaTarget`), skins
 *   - products — the catalog (its own listings build)
 *
 * The per-field personal-vs-not distinction (D68 — the story/founder beat needs the
 * maker's real input; the rest Bohdi may write) lives on the WALKTHROUGH STEP, not
 * here: this registry only says what is content (rewritable) vs structure (not).
 *
 * Paths root at `root.content`. Kinds:
 *   - `text`  — a single string
 *   - `lines` — a `string[]` (each element a line/paragraph)
 *   - `items` — an array of objects (reviews, collections); the whole array is the value
 *
 * `normalize` is the field's typographic role, used when a rewrite lands (see
 * `content-agent.ts`): `headline` strips terminal punctuation (headings read as
 * slop with a trailing period), `story` strips the smear-punctuation the big
 * cross-fading hero lines forbid, `plain` only trims (prose keeps its sentences).
 */
import type { SectionKey } from '@/lib/archetypes/main-street/families';

export type EditableFieldKind = 'text' | 'lines' | 'items';
export type NormalizeStyle = 'headline' | 'story' | 'plain';

export interface EditableField {
  /** Stable id, also the dotted envelope path under `root.content` (e.g. `moment.eyebrow`). */
  readonly id: string;
  /** Path segments under `root.content`. */
  readonly path: readonly string[];
  readonly kind: EditableFieldKind;
  /** Which home section this field belongs to (groups the walkthrough steps). */
  readonly section: SectionKey;
  /** The field's typographic role, driving post-rewrite normalization. */
  readonly normalize: NormalizeStyle;
  /** Plain human label for editor UI. */
  readonly label: string;
}

export const EDITABLE_FIELDS: readonly EditableField[] = [
  // BEAT 1 — the hero (moment). Excludes brand (shop name), media/collageShots
  // (images), and cta targets (link destinations).
  { id: 'moment.eyebrow', path: ['moment', 'eyebrow'], kind: 'text', section: 'hero', normalize: 'plain', label: 'Hero eyebrow' },
  { id: 'moment.story', path: ['moment', 'story'], kind: 'lines', section: 'hero', normalize: 'story', label: 'Hero story lines' },
  { id: 'moment.sub', path: ['moment', 'sub'], kind: 'text', section: 'hero', normalize: 'plain', label: 'Hero sub-line' },
  { id: 'moment.ctaLabel', path: ['moment', 'ctaLabel'], kind: 'text', section: 'hero', normalize: 'plain', label: 'Hero button label' },
  { id: 'moment.secondaryCtaLabel', path: ['moment', 'secondaryCtaLabel'], kind: 'text', section: 'hero', normalize: 'plain', label: 'Hero secondary button label' },

  // BEAT 2 — goods heading (the catalog itself is products, not authored here).
  { id: 'goods.title', path: ['goods', 'title'], kind: 'text', section: 'goods', normalize: 'headline', label: 'Goods heading' },
  { id: 'goods.label', path: ['goods', 'label'], kind: 'text', section: 'goods', normalize: 'plain', label: 'Goods label' },
  { id: 'goods.viewAllLabel', path: ['goods', 'viewAllLabel'], kind: 'text', section: 'goods', normalize: 'plain', label: 'Goods "view all" label' },

  // COLLECTIONS — heading + the authored collection blurbs (name/description).
  { id: 'collections.title', path: ['collections', 'title'], kind: 'text', section: 'collections', normalize: 'headline', label: 'Collections heading' },
  { id: 'collections.label', path: ['collections', 'label'], kind: 'text', section: 'collections', normalize: 'plain', label: 'Collections label' },
  { id: 'collections.viewAllLabel', path: ['collections', 'viewAllLabel'], kind: 'text', section: 'collections', normalize: 'plain', label: 'Collections "view all" label' },
  { id: 'collections.items', path: ['collections', 'items'], kind: 'items', section: 'collections', normalize: 'plain', label: 'Collections' },

  // REVIEWS — heading/labels + the testimonial items. (Testimonials are the maker's
  // real quotes or the section is switched off — never AI-fabricated, D68; that
  // policy lives on the reviews walkthrough step, not this registry.)
  { id: 'reviews.title', path: ['reviews', 'title'], kind: 'text', section: 'reviews', normalize: 'headline', label: 'Reviews heading' },
  { id: 'reviews.label', path: ['reviews', 'label'], kind: 'text', section: 'reviews', normalize: 'plain', label: 'Reviews label' },
  { id: 'reviews.viewAllLabel', path: ['reviews', 'viewAllLabel'], kind: 'text', section: 'reviews', normalize: 'plain', label: 'Reviews "view all" label' },
  { id: 'reviews.items', path: ['reviews', 'items'], kind: 'items', section: 'reviews', normalize: 'plain', label: 'Testimonials' },

  // MARQUEE — the authored voice lines (short, scroll large like headlines).
  { id: 'marquee.voice', path: ['marquee', 'voice'], kind: 'lines', section: 'marquee', normalize: 'headline', label: 'Marquee lines' },

  // BEAT 3 — the founder / About-the-maker beat. Personal (D68).
  { id: 'founder.quote', path: ['founder', 'quote'], kind: 'text', section: 'founder', normalize: 'plain', label: 'Founder quote' },
  { id: 'founder.attribution', path: ['founder', 'attribution'], kind: 'text', section: 'founder', normalize: 'plain', label: 'Founder attribution' },
  { id: 'founder.eyebrow', path: ['founder', 'eyebrow'], kind: 'text', section: 'founder', normalize: 'plain', label: 'Founder eyebrow' },
  { id: 'founder.heading', path: ['founder', 'heading'], kind: 'text', section: 'founder', normalize: 'headline', label: 'Founder heading' },
  { id: 'founder.aboutLabel', path: ['founder', 'aboutLabel'], kind: 'text', section: 'founder', normalize: 'plain', label: 'Founder "about" label' },

  // BEAT 4 — the close.
  { id: 'close.label', path: ['close', 'label'], kind: 'text', section: 'close', normalize: 'plain', label: 'Close label' },
  { id: 'close.headline', path: ['close', 'headline'], kind: 'text', section: 'close', normalize: 'headline', label: 'Close headline' },
  { id: 'close.ctaLabel', path: ['close', 'ctaLabel'], kind: 'text', section: 'close', normalize: 'plain', label: 'Close button label' },

  // The full ABOUT page — the maker's story at length. Personal (D68), grouped
  // with the founder beat as the story step. Prose keeps its sentences.
  { id: 'about.heading', path: ['about', 'heading'], kind: 'text', section: 'founder', normalize: 'headline', label: 'About page heading' },
  { id: 'about.story', path: ['about', 'story'], kind: 'lines', section: 'founder', normalize: 'plain', label: 'About page story' },

  // The CONTACT page invitation.
  { id: 'contact.heading', path: ['contact', 'heading'], kind: 'text', section: 'contact', normalize: 'headline', label: 'Contact heading' },
  { id: 'contact.intro', path: ['contact', 'intro'], kind: 'text', section: 'contact', normalize: 'plain', label: 'Contact intro' },
] as const;

/** Look a field up by id. */
export function getField(id: string): EditableField | undefined {
  return EDITABLE_FIELDS.find((f) => f.id === id);
}

/** Every editable field in a given home section, in registry order. */
export function fieldsForSection(section: SectionKey): readonly EditableField[] {
  return EDITABLE_FIELDS.filter((f) => f.section === section);
}

/** The home envelope is a `layout_tree` — `{ root: { content: {...} } }` — carried
 *  as a plain `Record` through the draft/staging layer, so these helpers accept and
 *  return that same loose shape and narrow at runtime. */
type Tree = Record<string, unknown>;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : undefined;
}

/** Read a field's current value from an envelope by id. Returns `undefined` for an
 *  unknown id or a path that isn't present in the envelope. */
export function getFieldValue(env: Tree, id: string): unknown {
  const field = getField(id);
  if (!field) return undefined;
  let node: unknown = asRecord(env['root'])?.['content'];
  for (const key of field.path) {
    const rec = asRecord(node);
    if (!rec) return undefined;
    node = rec[key];
  }
  return node;
}

/** Return a NEW envelope with the field set to `value`, without mutating the input.
 *  An unknown id returns the envelope unchanged (cloned). */
export function setFieldValue<T extends Tree>(env: T, id: string, value: unknown): T {
  const field = getField(id);
  const next = structuredClone(env);
  if (!field || field.path.length === 0) return next;
  const root = (asRecord(next['root']) ?? ((next as Tree)['root'] = {})) as Record<string, unknown>;
  const content = (asRecord(root['content']) ?? (root['content'] = {})) as Record<string, unknown>;
  let node: Record<string, unknown> = content;
  const path = field.path;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i] as string;
    if (!asRecord(node[key])) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[path[path.length - 1] as string] = value;
  return next;
}
