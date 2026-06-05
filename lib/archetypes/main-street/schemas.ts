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

/** A held-media slot for the hero moment — a generation prompt, optionally a
 *  resolved url (+ poster for video). Niche-neutral. */
const MediaSlot = z.object({
  kind: z.enum(['video', 'image']).default('video'),
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  poster: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** A photo slot for the founder portrait. */
const PhotoSlot = z.object({
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** A hero story line. Capped tight so it sets large and reads in one breath, and
 *  carries NO punctuation — not even a mid-line period or comma. Punctuation makes
 *  the line staccato, and as the lines cross-fade the marks from two lines stack
 *  into a smeared double-exposure. Apostrophes and intra-word hyphens are fine
 *  ("don't", "full-grain"); periods, commas, dashes, colons, and quotes are not. */
const StoryLine = z
  .string()
  .min(4)
  .max(48)
  .refine((s) => !/[.,!?;:…–—"“”]/.test(s), {
    message: 'story lines carry no punctuation (no periods, commas, dashes, colons, or quotes)',
  });

/** One "find us this week" row. */
const FindUsRow = z.object({
  day: z.string().min(1).max(12),
  where: z.string().min(4).max(60),
  time: z.string().min(1).max(12),
});

export const MainStreetContentSchema = z.object({
  /** The shop's actual name — used in the footer + as the default wordmark. */
  shopName: z.string().min(2).max(40),

  identity: z.object({
    wordmark: z.string().min(2).max(28),
    nav: z.array(z.string().min(2).max(18)).min(2).max(4),
  }),

  /** BEAT 1 — the moment is the hero. Held media + a story told one line at a
   *  time, landing on the brand + CTA. */
  moment: z.object({
    media: MediaSlot,
    /** The story lines, each cross-fading into the next. Kept tight so they set
     *  large and read in one breath. */
    story: z.array(StoryLine).min(2).max(4),
    eyebrow: z.string().min(4).max(48),
    brand: z.string().min(2).max(28),
    ctaLabel: z.string().min(3).max(24),
    secondaryCtaLabel: z.string().min(3).max(24).optional(),
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
    quote: z.string().min(24).max(280),
    attribution: z.string().min(4).max(60),
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
  }),
});

export type MainStreetContent = z.infer<typeof MainStreetContentSchema>;

/** The only skin choice is which curated skin to wear. Everything inside it is
 *  the archetype's, not Bohdi's. */
export const MainStreetSkinSchema = z.object({
  skinKey: z.enum(Object.keys(MAIN_STREET_SKINS) as [string, ...string[]]),
});
export type MainStreetSkinPick = z.infer<typeof MainStreetSkinSchema>;
