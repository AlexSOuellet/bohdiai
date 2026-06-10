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
 * Every text field is capped (max) as well as floored (min) so authored content
 * cannot overflow the geometry the renderer assumes.
 */
import { z } from 'zod';
import { MAIN_STREET_SKINS } from './skins';
import { GOODS_TREATMENTS } from './goods';
import { LINK_TARGETS } from './links';

/** A nav link the crew authors: a label paired with a TARGET page, so the word
 *  and the destination always agree (D46). The target is constrained to real
 *  pages by the renderer's route map — a nav item can never 404. */
export const NavItem = z.object({
  label: z.string().min(2).max(18),
  target: z.enum(LINK_TARGETS),
});
export type NavItem = z.infer<typeof NavItem>;

/** One nav entry, tolerant of legacy rows: a bare string is an OLD nav whose
 *  label was never used for routing (the renderer fell back to a fixed nav); a
 *  { label, target } object is the authored form. New builds always emit objects. */
export const NavEntry = z.union([z.string().min(2).max(18), NavItem]);
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

/** A held-media slot for the hero moment — a structured scene prompt, optionally
 *  a resolved url (+ poster for video). A still is as valid a hero as a video. */
const MediaSlot = z.object({
  kind: z.enum(['video', 'image']).default('video'),
  prompt: ScenePrompt,
  url: z.string().url().optional(),
  poster: z.string().url().optional(),
  alt: z.string().min(4),
});

/** A photo slot for the founder portrait. `prompt` feeds the image model (not
 *  rendered), so it has no length cap, only a non-empty floor. `alt` is the
 *  accessibility caption — it's read by assistive tech, never laid out, so it
 *  carries no length cap either (only a min floor): copy never fails the build (D53). */
const PhotoSlot = z.object({
  prompt: z.string().min(1),
  url: z.string().url().optional(),
  alt: z.string().min(4),
});

/** A hero story line. Capped tight so it sets large and reads in one breath, and
 *  carries NO punctuation — not even a mid-line period or comma. Punctuation makes
 *  the line staccato, and as the lines cross-fade the marks from two lines stack
 *  into a smeared double-exposure. Apostrophes and intra-word hyphens are fine
 *  ("don't", "full-grain"); periods, commas, dashes, colons, and quotes are not. */
export const StoryLine = z
  .string()
  .min(4)
  .max(48)
  .refine((s) => !/[.,!?;:…–—"“”]/.test(s), {
    message: 'story lines carry no punctuation (no periods, commas, dashes, colons, or quotes)',
  });

/** One "find us this week" row. */
export const FindUsRow = z.object({
  day: z.string().min(1).max(12),
  where: z.string().min(4).max(60),
  time: z.string().min(1).max(12),
});

/** The About-beat bodies. A tuple so the content schema and the copywriter's
 *  draft schema read the same source and can never drift apart. */
export const FOUNDER_TREATMENTS = ['quote', 'portrait', 'letter', 'card'] as const;

export const MainStreetContentSchema = z.object({
  /** The shop's actual name — used in the footer + as the default wordmark. */
  shopName: z.string().min(2).max(40),

  identity: z.object({
    // Up to 40 to hold the maker's full shop name verbatim (the wordmark IS the
    // shop name — the crew never renames it).
    wordmark: z.string().min(2).max(40),
    nav: z.array(NavEntry).min(2).max(4),
    /** The maker's uploaded logo, if any. NOT authored by Bohdi — injected at
     *  render from the tenant's upload, and shown beside the wordmark in the nav. */
    logoUrl: z.string().optional(),
  }),

  /** BEAT 1 — the moment is the hero. Held media + a story told one line at a
   *  time, landing on the brand + CTA. */
  moment: z.object({
    media: MediaSlot,
    /** The story lines, each cross-fading into the next. Kept tight so they set
     *  large and read in one breath. */
    story: z.array(StoryLine).min(2).max(4),
    eyebrow: z.string().min(4).max(48),
    brand: z.string().min(2).max(40),
    ctaLabel: z.string().min(3).max(24),
    /** Where the primary hero button goes — a real page (D46). Optional so rows
     *  authored before targets still parse; the renderer falls back to the goods
     *  scroll when absent. */
    ctaTarget: z.enum(LINK_TARGETS).optional(),
    secondaryCtaLabel: z.string().min(3).max(24).optional(),
    /** Where the optional secondary hero button goes. Falls back to /shop when
     *  absent (legacy behavior). */
    secondaryCtaTarget: z.enum(LINK_TARGETS).optional(),
  }),

  /** BEAT 2 — goods in motion. Just the heading; products are catalog rows. The
   *  home page shows only a SAMPLING — the full catalog lives on the Products
   *  page, reached via the view-all cue. */
  goods: z.object({
    title: z.string().min(2).max(48),
    /** Which goods body to wear. BOHDI's choice — he picks the one that fits the
     *  shop. Optional only so content authored before this field still parses
     *  (the renderer falls back to the legacy size-based pick when it is absent). */
    treatment: z.enum(GOODS_TREATMENTS).optional(),
    /** Optional small label on the heading row, e.g. "This week". */
    label: z.string().min(2).max(24).optional(),
    /** The view-all cue pointing to the Products page, in the maker's voice,
     *  e.g. "See the whole bakery" or "Shop everything". Falls back to a neutral
     *  default when omitted. */
    viewAllLabel: z.string().min(2).max(28).optional(),
  }),

  /** BEAT 3 — the founder + a real "find us this week" calendar. Required: the
   *  authority the platform is built on. */
  founder: z.object({
    quote: z.string().min(24),
    attribution: z.string().min(4).max(60),
    /** Which About look to wear — BOHDI's pick, the one that fits the maker. All
     *  maker-only; the find-us calendar is its own beat, never inside these.
     *  Optional so content authored before this field still parses. */
    treatment: z.enum(FOUNDER_TREATMENTS).optional(),
    /** Small label above the heading on the card treatment, e.g. "Since 2019". */
    eyebrow: z.string().min(2).max(24).optional(),
    /** The card treatment's heading, e.g. "Meet June". */
    heading: z.string().min(2).max(28).optional(),
    photo: PhotoSlot,
    /** The "about" cue pointing to the full bio page, in the maker's voice, e.g.
     *  "Read our story". Falls back to a neutral default when omitted. The home
     *  founder beat is a TEASER; the full bio lives on the About page. */
    aboutLabel: z.string().min(2).max(28).optional(),
    /** The "find us this week" calendar. OPTIONAL by design: a maker who does no
     *  markets or events simply has none, and the founder beat renders without it
     *  (and without its events cue) — nothing else breaks. When present it is a
     *  TEASER of upcoming dates pointing at the full Events page. */
    findUs: z
      .object({
        label: z.string().min(2).max(28),
        /** Cue to the full Events page, in the maker's voice, e.g. "See all our
         *  markets". Falls back to a neutral default. */
        eventsLabel: z.string().min(2).max(28).optional(),
        rows: z.array(FindUsRow).min(1).max(5),
      })
      .optional(),
  }),

  /** BEAT 4 — the close: a big-type sign-off + an order/pickup CTA. */
  close: z.object({
    label: z.string().min(2).max(28),
    headline: z.string().min(6).max(72),
    ctaLabel: z.string().min(3).max(24),
    /** Where the close button goes — a real page (D46). Optional so legacy rows
     *  parse; the renderer falls back to /contact when absent. */
    ctaTarget: z.enum(LINK_TARGETS).optional(),
  }),

  /** The full ABOUT page — the maker's story at length (the home founder beat is
   *  only a teaser of this). Optional so content authored before this field still
   *  parses; the About page falls back to the founder quote when it's absent. The
   *  story is where the rich, niche-specific writing lives. */
  about: z
    .object({
      heading: z.string().min(4).max(60),
      /** 2-5 real paragraphs — who the maker is, how they got here, how they work.
       *  Specific to THIS maker and niche, never generic. */
      story: z.array(z.string().min(40)).min(2).max(5),
    })
    .optional(),

  /** The CONTACT page — an authored invitation to get in touch. Optional; the
   *  page shows a neutral intro when absent. Real email/social are added by the
   *  maker later (unknown at onboarding), so this is voice, not contact details. */
  contact: z
    .object({
      heading: z.string().min(4).max(48),
      intro: z.string().min(20),
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
