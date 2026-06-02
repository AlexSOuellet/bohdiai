/**
 * Gallery archetype — schemas.
 *
 * The Gallery is a maker's shop wall: a dense, browsable grid of work is the
 * centerpiece, with identity, collections, the maker's story, in-person
 * appearances, and a footer supporting it. The opposite of the broadsheet's
 * buried inventory — product and price are visible the instant you land.
 *
 * Niche-neutral by design. Every label and string is a content slot; the
 * archetype never assumes a maker is a ceramicist, a jeweler, or anything
 * else. The same Gallery wears any niche by the words Bohdi writes into it.
 *
 * Every text field is capped (max) as well as floored (min) so Bohdi cannot
 * overflow the geometry the renderer assumes — the lesson from the broadsheet,
 * where an unbounded headline broke the display.
 */
import { z } from 'zod';
import { GALLERY_THEMES } from './themes';

/** Imagery slot: a prompt for generation, optionally a pre-resolved URL. */
const PhotoSlot = z.object({
  /** What Bohdi asks the image model for. The unifying grade is the archetype's job. */
  prompt: z.string().min(8).max(400),
  /** Optional pre-generated URL (used when reusing prior generations). */
  url: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** One piece on the wall — the centerpiece of the archetype. */
const Product = z.object({
  name: z.string().min(2).max(48),
  /** Price as the maker writes it: "$42", "from $18", etc. */
  price: z.string().min(1).max(14),
  photo: PhotoSlot,
  /** Optional small marker overlaid on the tile: "Limited", "New", "1 of 1". */
  tag: z.string().min(2).max(18).optional(),
});

/** A featured collection — a grouped set of work. */
const CollectionFeature = z.object({
  name: z.string().min(2).max(40),
  photo: PhotoSlot,
});

/** An in-person appearance — a market, fair, or popup. */
const MarketEvent = z.object({
  /** Short date label, like "Jun 14" or "Sat 6/14". */
  dateLabel: z.string().min(2).max(24),
  /** Where, like "Burlington Farmers Market". */
  name: z.string().min(2).max(60),
});

/** A footer link column. */
const FooterColumn = z.object({
  title: z.string().min(2).max(24),
  items: z.array(z.string().min(1).max(28)).min(2).max(5),
});

/**
 * The complete content contract for a Gallery store. Every tenant produces
 * exactly this shape; the renderer structurally cannot consume anything else.
 */
export const GalleryContentSchema = z.object({
  /** The shop's actual name — used in the footer. */
  shopName: z.string().min(2).max(40),

  /** The identity band at the top of the page. */
  identity: z.object({
    /** The shop name as it appears in the wordmark (may equal shopName). */
    wordmark: z.string().min(2).max(28),
    /** One line of the maker's voice under the wordmark. */
    tagline: z.string().min(8).max(96),
    /** Top navigation labels. */
    nav: z.array(z.string().min(2).max(18)).min(2).max(4),
  }),

  /** The wall — the browsable grid of work, the centerpiece. */
  wall: z.object({
    products: z.array(Product).min(8).max(24),
  }),

  /** Featured collections — grouped sets on their own band. Drops out if none. */
  collections: z
    .object({
      /** Short section eyebrow naming the grouping, e.g. "Shop by collection". */
      title: z.string().min(2).max(36),
      items: z.array(CollectionFeature).min(2).max(4),
    })
    .optional(),

  /** The maker — story and face. Required: the authority the platform is built on. */
  maker: z.object({
    /** Small eyebrow, like "The Studio" or "About". */
    label: z.string().min(2).max(24),
    /** The story hook headline. */
    headline: z.string().min(6).max(52),
    /** The story paragraph. */
    body: z.string().min(40).max(480),
    photo: PhotoSlot,
    ctaLabel: z.string().min(3).max(28),
  }),

  /** In-person appearances. Drops out if the maker does no markets. */
  markets: z
    .object({
      title: z.string().min(4).max(40),
      events: z.array(MarketEvent).min(1).max(5),
    })
    .optional(),

  /** Footer — a blurb and exactly two link columns. */
  footer: z.object({
    blurb: z.string().min(8).max(90),
    columns: z.array(FooterColumn).length(2),
  }),
});

export type GalleryContent = z.infer<typeof GalleryContentSchema>;

/**
 * The only theme choice Bohdi can make for this archetype is which curated
 * theme variant to wear. Everything inside the theme — colors, fonts, scale,
 * spacing, atmosphere, motion — is the archetype's, not his.
 */
export const GalleryThemeSchema = z.object({
  themeKey: z.enum(Object.keys(GALLERY_THEMES) as [string, ...string[]]),
});

export type GalleryThemePick = z.infer<typeof GalleryThemeSchema>;
