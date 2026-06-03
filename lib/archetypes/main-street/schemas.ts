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
    story: z.array(z.string().min(4).max(48)).min(2).max(5),
    eyebrow: z.string().min(4).max(48),
    brand: z.string().min(2).max(28),
    ctaLabel: z.string().min(3).max(24),
    secondaryCtaLabel: z.string().min(3).max(24).optional(),
  }),

  /** BEAT 2 — goods in motion. Just the heading; products are catalog rows. */
  goods: z.object({
    title: z.string().min(2).max(48),
    /** Optional small label on the heading row, e.g. "This week". */
    label: z.string().min(2).max(24).optional(),
  }),

  /** BEAT 3 — the founder + a real "find us this week" calendar. Required: the
   *  authority the platform is built on. */
  founder: z.object({
    quote: z.string().min(24).max(280),
    attribution: z.string().min(4).max(60),
    photo: PhotoSlot,
    findUs: z
      .object({
        label: z.string().min(2).max(28),
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
