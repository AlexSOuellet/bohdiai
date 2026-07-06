/**
 * Main Street — the one place fallback and structural strings live.
 *
 * The rule: everything a maker or customer might SEE that isn't authored by the
 * copywriter for that specific build passes through here. Section headings,
 * intros, and body prose stay authored — if a build lands with one missing,
 * that's a copywriter bug. Fallback labels, empty-state copy, aria strings,
 * count words, and structural markers (Nav, Footer, Cart) live here.
 *
 * One map, one import. Enforced by an ESLint rule on lib/archetypes/**  and
 * app/storefront/** that blocks raw string literals in JSX and inline
 * style={{...}} attributes. See eslint.config.mjs.
 *
 * When a niche needs different copy for these, that's a future editor door;
 * the maker overrides via a real content field, never by digging into code.
 */
export const DEFAULT_STRINGS = {
  // ─── Empty states ─────────────────────────────────────────────────────────
  /** Shop / collection detail — no products yet. */
  emptyShop: 'New pieces are on the way — check back soon.',
  /** Collections index — no collections yet. */
  emptyCollections: 'New collections are on the way — check back soon.',
  /** Testimonials page — reviews not authored yet. */
  emptyReviews: 'The kind words are still coming in — check back soon.',
  /** Events page — no upcoming dates. */
  emptyEvents: 'No upcoming dates just yet — check back soon to see where we will be next.',
  /** Calendar treatment — empty state for the currently-viewed month. */
  emptyMonth: 'No dates this month — check back soon.',

  // ─── Product page ─────────────────────────────────────────────────────────
  productAddToCart: 'Add to cart',
  productSoldOut: 'Sold out',
  productDetailsLabel: 'Details',

  // ─── Contact form ─────────────────────────────────────────────────────────
  contactFormName: 'Name',
  contactFormEmail: 'Email',
  contactFormMessage: 'Message',
  contactFormSend: 'Send message',
  contactFormSending: 'Sending…',
  contactFormSent: 'Thanks — your message is on its way.',
  contactFormError: 'Something went wrong — try again.',

  // ─── Nav labels (structural — every storefront needs a way to reach these) ─
  navShop: 'Shop',
  navAbout: 'About',
  navEvents: 'Events',
  navContact: 'Contact',
  navCart: 'Cart',

  // ─── Footer labels ────────────────────────────────────────────────────────
  footerHome: 'Home',
  footerIntro: 'Intro',
  footerPrivacy: 'Privacy',
  footerTerms: 'Terms',

  // ─── Fallback link labels ─────────────────────────────────────────────────
  /** GoodsBeat "see everything" cue when the copywriter didn't author one. */
  fallbackSeeAllGoods: 'See the full catalog',
  /** FounderBeat "read more" cue when unauthored. */
  fallbackReadFullStory: 'Read the full story',
  /** FindUsBeat "see all dates" cue when unauthored. */
  fallbackSeeAllDates: 'See all dates',
  /** CollectionsBeat treatment cta when unauthored. */
  fallbackExploreCollection: 'Explore',
  /** GoodsLookbook per-piece link. */
  fallbackViewPiece: 'View the piece',

  // ─── Structural section labels ─────────────────────────────────────────────
  /** Calendar treatment heading for the currently-viewed month. */
  eventsThisMonth: 'This month',
  /** Next-Stop treatment heading for the "other upcoming dates" list. */
  findUsAlsoComingUp: 'Also coming up',
  /** FounderBeats postscript token before the about-page cue. */
  founderPostscript: 'P.S.',

  // ─── Attribution / footnotes ─────────────────────────────────────────────
  reviewsTextsAttribution: 'real messages, shared with permission',

  // ─── Aria labels (accessibility — screen-reader only, do not skimp) ───────
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  ariaPreviousMonth: 'Previous month',
  ariaNextMonth: 'Next month',
  ariaSlides: 'Slides',
  ariaSiteNav: 'Site',
  ariaMenu: 'Menu',
  ariaMarqueeHighlights: 'Highlights',
  ariaCollageMoments: 'A few moments from the shop',
} as const;

export type DefaultStringKey = keyof typeof DEFAULT_STRINGS;

/**
 * Pluralized count formatters. Each returns "1 piece" / "N pieces"-style
 * strings. Kept as functions so English pluralization stays in one place —
 * when a maker's locale changes, one file changes.
 */
export const DEFAULT_COUNTS = {
  /** "1 piece" / "3 pieces" — used by collection eyebrows + tiles. */
  pieces: (n: number): string => `${n} ${n === 1 ? 'piece' : 'pieces'}`,
  /** "1 item" / "3 items" — used by cupboard / lanes count suffix. */
  items: (n: number): string => `${n} ${n === 1 ? 'item' : 'items'}`,
  /** "1 review" / "12 reviews" — reviews aggregate. */
  reviews: (n: number): string => `${n} ${n === 1 ? 'review' : 'reviews'}`,
  /** "5 out of 5" — rating treatment. */
  outOfFive: (n: number): string => `${n} out of 5`,
  /** Screen-reader label "Show testimonial 3" — pull-quote treatment. */
  showTestimonial: (n: number): string => `Show testimonial ${n}`,
  /** "No. 3" — lookbook eyebrow. */
  numberOf: (n: number): string => `No. ${n}`,
} as const;
