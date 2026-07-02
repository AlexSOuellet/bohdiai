/**
 * Main Street archetype — content schema (the four-beat sales page).
 *
 * Niche-neutral by construction: every label and string is a content slot, so
 * the archetype never assumes a maker bakes, throws pots, or pours candles. The
 * four beats — the MOMENT (hero), GOODS in motion, the FOUNDER + a find-us
 * calendar, and the CLOSE — are filled in the maker's own words. Catalog rows
 * (the goods) are passed to the renderer separately as the shared ProductView
 * core; the archetype never authors the catalog.
 *
 * SCHEMA POLICY (D53 sharpened): no length caps on any string. The build NEVER
 * fails because copy was too long. Floors are .min(1) so required fields can't
 * be empty (empty buttons / blank wordmarks are broken), but anything non-empty
 * passes. The renderer absorbs any length via CSS overflow handling — line-clamp
 * on cards, ellipsis on labels, natural wrap on headlines.
 */
import { z } from 'zod';
import { MAIN_STREET_SKINS } from './skins';
import { GOODS_TREATMENTS } from './goods';
import { COLLECTIONS_TREATMENTS } from './collections';
import { REVIEWS_TREATMENTS } from './reviews';
import { FINDUS_TREATMENTS, FINDUS_KINDS } from './findus';
import { LINK_TARGETS } from './links';

/** A nav link the crew authors: a label paired with a TARGET page, so the word
 *  and the destination always agree (D46). The target is constrained to real
 *  pages by the renderer's route map — a nav item can never 404. */
export const NavItem = z.object({
  label: z.string().min(1),
  target: z.enum(LINK_TARGETS),
});
export type NavItem = z.infer<typeof NavItem>;

/** One nav entry, tolerant of legacy rows: a bare string is an OLD nav whose
 *  label was never used for routing (the renderer fell back to a fixed nav); a
 *  { label, target } object is the authored form. New builds always emit objects. */
export const NavEntry = z.union([z.string().min(1), NavItem]);
export type NavEntry = z.infer<typeof NavEntry>;

/** The hero's held media, authored as a STRUCTURED scene rather than a prose
 *  sentence — video models take direction far better from grouped fields, and a
 *  still uses the same groups joined into a description. The generation seam
 *  serializes this (JSON for video, prose for a still) and, for video, injects a
 *  seamless-loop + slow-motion intent. The groups are fixed; Bohdi fills them. */
// These groups are never rendered — they are serialized into the prompt sent to
// the image/video model (see scene-prompt.ts). So there is no layout geometry to
// protect and no length cap; only a non-empty floor, since a blank group is
// useless to the generator.
export const ScenePrompt = z.object({
  composition: z.string().min(1),
  subject: z.string().min(1),
  environment: z.string().min(1),
  atmosphere: z.string().min(1),
  camera: z.string().min(1),
  lighting: z.string().min(1),
  style: z.string().min(1),
});
export type ScenePrompt = z.infer<typeof ScenePrompt>;

/** A held-media slot for the hero — a structured scene prompt, optionally a
 *  resolved url (+ poster for video). A still is as valid a hero as a video.
 *  Video: the camera holds still, in-frame motion only, the clip loops seamlessly.
 *  Still: a cinematic scene composition (the product in its world, real light, real
 *  depth); a very subtle CSS push-in adds time at render. */
const MediaSlot = z.object({
  kind: z.enum(['video', 'still']).default('video'),
  prompt: ScenePrompt,
  url: z.string().url().optional(),
  poster: z.string().url().optional(),
  alt: z.string().min(1),
});

/** One Collage shot — a still scene the Collage hero shows (it shows ~3). Authored
 *  as a structured ScenePrompt like the hero, generated as a still at build time
 *  (NOT a frame of the hero video). `url` is absent until generation resolves it.
 *  Only the Collage hero reads these; every other hero ignores them. */
export const CollageShot = z.object({
  prompt: ScenePrompt,
  url: z.string().url().optional(),
  alt: z.string().min(1),
});
export type CollageShot = z.infer<typeof CollageShot>;

/** A photo slot for the founder portrait. `prompt` feeds the image model (not
 *  rendered) and `alt` is the accessibility caption (never laid out); both carry
 *  only a non-empty floor — copy never fails the build (D53). */
const PhotoSlot = z.object({
  prompt: z.string().min(1),
  url: z.string().url().optional(),
  alt: z.string().min(1),
});

/** A hero story line. Punctuation is forbidden at the renderer level (the lines
 *  cross-fade large and the marks read as smears), but the schema accepts any
 *  non-empty string — the normalize step (normalize-copy.ts) strips the
 *  forbidden characters server-side rather than rejecting and burning attempts.
 *  Apostrophes and intra-word hyphens stay; periods, commas, dashes, colons,
 *  and quotes get cleaned off. */
export const StoryLine = z.string().min(1);

/** One "find us this week" row. `day`/`where`/`time` are the authored human strings
 *  (also read by the events-page list + the marquee). `date` (ISO YYYY-MM-DD) is
 *  optional and lets the date-shaped treatments (Calendar, Next Stop) place + sort;
 *  `kind` tags an optional pill. Both optional so content authored before they
 *  existed still parses. Shape only — no length caps (D57). */
export const FindUsRow = z.object({
  day: z.string().min(1),
  where: z.string().min(1),
  time: z.string().min(1),
  date: z.string().min(1).optional(),
  kind: z.enum(FINDUS_KINDS).optional(),
});

/** The About-beat bodies. A tuple so the content schema and the copywriter's
 *  draft schema read the same source and can never drift apart. */
export const FOUNDER_TREATMENTS = ['quote', 'portrait', 'letter', 'card', 'workbench', 'editorial', 'signature'] as const;

/** The nav layouts a store can wear — four distinct registers, not reshuffles:
 *   - standard     — wordmark left, links right. The classic workhorse.
 *   - split-center — wordmark centered, links flanking it. Editorial / boutique.
 *   - menu-reveal  — wordmark + a "Menu" trigger; links hidden behind a click at
 *                    ALL widths. The nav recedes — gallery / luxury quiet.
 *   - cta-forward  — links plus one filled accent button (the shop). Commerce-loud.
 *  A family-level look choice (recorded for the family layer, previewable via
 *  ?nav=); default is standard. */
export const NAV_VARIANTS = ['standard', 'split-center', 'menu-reveal', 'cta-forward'] as const;
export type NavVariant = (typeof NAV_VARIANTS)[number];

export const MainStreetContentSchema = z.object({
  /** The shop's actual name — used in the footer + as the default wordmark. */
  shopName: z.string().min(1),

  identity: z.object({
    wordmark: z.string().min(1),
    nav: z.array(NavEntry).min(1),
    /** The maker's uploaded logo, if any. NOT authored by Bohdi — injected at
     *  render from the tenant's upload (set in the dashboard, not at onboarding),
     *  and shown beside the wordmark in the nav. */
    logoUrl: z.string().optional(),
    /** The dominant tone of the maker's logo ink (derived from brand_colors at
     *  render — not authored). Used by chrome to guarantee logo readability without
     *  a plate. Absent when there is no logo or the analysis produced no usable hex. */
    logoTone: z.enum(['light', 'dark', 'unknown']).optional(),
    /** Which nav layout this store wears (a family-level look choice). Optional —
     *  absent renders the standard wordmark-left bar; 'split-center' centers the
     *  wordmark with links flanking it. */
    navVariant: z.enum(NAV_VARIANTS).optional(),
  }),

  /** BEAT 1 — the moment is the hero. Held media + a story told one line at a
   *  time, landing on the brand + CTA. */
  moment: z.object({
    media: MediaSlot,
    story: z.array(StoryLine).min(1),
    eyebrow: z.string().min(1),
    brand: z.string().min(1),
    /** The shared hero SUB-LINE — one plain supporting sentence under the headline.
     *  This is the pile ingredient every NON-Story hero uses (Split, Stacked,
     *  Typographic, Floating card, Editorial cover). Story uses its fading `story`
     *  lines instead and ignores this. Optional so content authored before the
     *  modular hero work still parses; new builds always author it. */
    sub: z.string().min(1).optional(),
    /** The Collage hero's still scenes (it shows ~3). Optional so content authored
     *  before the Collage hero still parses, and so heroes that don't use them
     *  never require them. Generated as stills at build time. */
    collageShots: z.array(CollageShot).optional(),
    ctaLabel: z.string().min(1),
    /** Where the primary hero button goes — a real page (D46). Optional so rows
     *  authored before targets still parse; the renderer falls back to the goods
     *  scroll when absent. */
    ctaTarget: z.enum(LINK_TARGETS).optional(),
    secondaryCtaLabel: z.string().min(1).optional(),
    /** Where the optional secondary hero button goes. Falls back to /shop when
     *  absent (legacy behavior). */
    secondaryCtaTarget: z.enum(LINK_TARGETS).optional(),
  }),

  /** BEAT 2 — goods in motion. Just the heading; products are catalog rows. The
   *  home page shows only a SAMPLING — the full catalog lives on the Products
   *  page, reached via the view-all cue. */
  goods: z.object({
    title: z.string().min(1),
    /** Which goods body to wear. BOHDI's choice — he picks the one that fits the
     *  shop. Optional only so content authored before this field still parses
     *  (the renderer falls back to the legacy size-based pick when it is absent). */
    treatment: z.enum(GOODS_TREATMENTS).optional(),
    label: z.string().min(1).optional(),
    viewAllLabel: z.string().min(1).optional(),
  }),

  /** COLLECTIONS — the section heading + cues for the home collections teaser.
   *  The band DATA (the collections themselves) is loaded from the tenant's
   *  `collections` rows and passed to the renderer separately (like products),
   *  never authored here. Optional so content authored before this field still
   *  parses and so a shop with no collections simply omits the beat. Mirrors the
   *  `goods` shape; `treatment` is the family-level band choice (previewable via
   *  ?collections=), falling back to the documented default when absent. */
  collections: z
    .object({
      title: z.string().min(1),
      treatment: z.enum(COLLECTIONS_TREATMENTS).optional(),
      label: z.string().min(1).optional(),
      viewAllLabel: z.string().min(1).optional(),
    })
    .optional(),

  /** REVIEWS — the maker's testimonials, authored at build time and seeded like the
   *  sample find-us dates (D38): plausible, maker-editable social proof, NOT labeled
   *  "sample". At launch these are curated testimonials (verified-purchase reviews
   *  are Phase 2). `treatment` is the family-level look choice (previewable via
   *  ?reviews=); the four are a shared pool. `summary` feeds the Rating treatment's
   *  aggregate. Optional so content authored before this field still parses and so a
   *  shop with no testimonials simply omits the beat. */
  reviews: z
    .object({
      title: z.string().min(1),
      treatment: z.enum(REVIEWS_TREATMENTS).optional(),
      label: z.string().min(1).optional(),
      viewAllLabel: z.string().min(1).optional(),
      summary: z
        .object({
          score: z.string().min(1),
          count: z.string().min(1),
        })
        .optional(),
      items: z
        .array(
          z.object({
            quote: z.string().min(1),
            author: z.string().min(1),
            location: z.string().min(1).optional(),
          }),
        )
        .min(1),
    })
    .optional(),

  /** MARQUEE — the band's authored VOICE line (a few punchy brand phrases Bohdi
   *  wrote). The band's second line (live logistics — find-us dates, collections)
   *  is assembled from store data at render, never authored. Optional so content
   *  authored before this field still parses; when absent the renderer falls back
   *  to deriving the voice line from the store's other authored copy. */
  marquee: z
    .object({
      voice: z.array(z.string().min(1)).min(1),
    })
    .optional(),

  /** BEAT 3 — the founder + a real "find us this week" calendar. Required: the
   *  authority the platform is built on. */
  founder: z.object({
    quote: z.string().min(1),
    attribution: z.string().min(1),
    treatment: z.enum(FOUNDER_TREATMENTS).optional(),
    eyebrow: z.string().min(1).optional(),
    heading: z.string().min(1).optional(),
    photo: PhotoSlot,
    aboutLabel: z.string().min(1).optional(),
    findUs: z
      .object({
        label: z.string().min(1),
        /** The treatment this shop's find-us beat wears (a family-level look choice,
         *  previewable via ?findus=); the six are a shared pool. Absent → the
         *  dispatcher falls back to the documented default. */
        treatment: z.enum(FINDUS_TREATMENTS).optional(),
        eventsLabel: z.string().min(1).optional(),
        rows: z.array(FindUsRow).min(1),
      })
      .optional(),
  }),

  /** BEAT 4 — the close: a big-type sign-off + an order/pickup CTA. */
  close: z.object({
    label: z.string().min(1),
    headline: z.string().min(1),
    ctaLabel: z.string().min(1),
    ctaTarget: z.enum(LINK_TARGETS).optional(),
  }),

  /** The full ABOUT page — the maker's story at length (the home founder beat is
   *  only a teaser of this). Optional so content authored before this field still
   *  parses; the About page falls back to the founder quote when it's absent. */
  about: z
    .object({
      heading: z.string().min(1),
      story: z.array(z.string().min(1)).min(1),
    })
    .optional(),

  /** The CONTACT page — an authored invitation to get in touch. Optional; the
   *  page shows a neutral intro when absent. */
  contact: z
    .object({
      heading: z.string().min(1),
      intro: z.string().min(1),
    })
    .optional(),
});

export type MainStreetContent = z.infer<typeof MainStreetContentSchema>;

/** The only skin choice is which curated skin to wear. Everything inside it is
 *  the archetype's, not Bohdi's. */
export const MainStreetSkinSchema = z.object({
  skinKey: z.enum(Object.keys(MAIN_STREET_SKINS) as [string, ...string[]]),
});
export type MainStreetSkinPick = z.infer<typeof MainStreetSkinSchema>;
