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
  /** Testimonials page — no testimonials authored yet. */
  emptyTestimonials: 'The kind words are still coming in — check back soon.',
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
  navCollections: 'Collections',
  navAbout: 'About',
  navEvents: 'Events',
  navTestimonials: 'Testimonials',
  navContact: 'Contact',
  navCart: 'Cart',

  // ─── Footer labels ────────────────────────────────────────────────────────
  footerHome: 'Home',
  footerIntro: 'Intro',
  footerTestimonials: 'Testimonials',
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
  testimonialsTextsAttribution: 'real messages, shared with permission',

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
 * Reference labels — English words used to name reference-data entries (moods,
 * families, skins). Lives here alongside DEFAULT_STRINGS so every user-visible
 * English string ships from one file. When copy changes or locale changes,
 * this is the one place. Keys are validated by tests against each registry.
 */
export const REFERENCE_LABELS = {
  moods: {
    labels: {
      dark: 'Dark',
      rustic: 'Rustic',
      cozy: 'Cozy',
      modern: 'Modern',
      elegant: 'Elegant',
      cheerful: 'Cheerful',
    },
    descriptions: {
      dark: 'Low light and deep shadow. Moody and a little mysterious, with drama where most stores play it safe.',
      rustic: 'Warm, worn, and handmade. Natural materials and the feel of things made the old way, with some age in them.',
      cozy: 'Soft, warm, and welcoming. The calm of a lamp-lit room at the end of the day.',
      modern: 'Clean, confident, and geometric. Bold and contemporary — not quiet minimalism, design that speaks up.',
      elegant: 'Refined and graceful. Quiet luxury, fine detail, the sense that every choice was considered.',
      cheerful: 'Bright and lifted, color-positive. Sun on the page — a store that smiles back.',
    },
  },
  families: {
    palettes: {
      cozy: 'Cream & Ember',
      rustic: 'Barnwood & Rust',
      dark: 'Ink & Ember',
      luxury: 'Ivory & Gold',
      cheerful: 'Confetti',
      modern: 'Paper & Ink',
    },
    typePackages: {
      cozy: 'The Journal',
      rustic: 'The Woodshop',
      dark: 'The Apothecary',
      luxury: 'The Maison',
      cheerful: 'Confetti',
      modern: 'The Grid',
    },
    textures: {
      cozy: 'Linen',
      rustic: 'Burlap',
      dark: 'Smoke',
      luxury: 'Marble',
      cheerful: 'Confetti',
      modern: 'Concrete',
    },
    wallpapers: {
      cozy: 'Cream linen',
      rustic: 'Walnut planks',
      dark: 'Dark smoke',
      luxury: 'White marble',
      cheerful: 'Paper cut-outs',
      modern: 'Concrete',
    },
    imageryGrades: {
      cozy: 'Soft & warm',
      rustic: 'Burlap blend',
      dark: 'Ember glow',
      luxury: 'Clean & bright',
      cheerful: 'On a color card',
      modern: 'Clean & cool',
    },
  },
  skins: {
    labels: {
      'main-street-ember': 'Ember',
      'main-street-orchard': 'Orchard',
      'main-street-pantry': 'Pantry',
      'main-street-hearthstone': 'Hearthstone',
      'main-street-tannery': 'Tannery',
      'main-street-forge': 'Forge',
      'main-street-anvil': 'Anvil',
      'main-street-sawdust': 'Sawdust',
      'main-street-porcelain': 'Porcelain',
      'main-street-atelier': 'Atelier',
      'main-street-gild': 'Gild',
      'main-street-botanical': 'Botanical',
      'main-street-conservatory': 'Conservatory',
      'main-street-wildflower': 'Wildflower',
      'main-street-studio': 'Studio',
      'main-street-darkroom': 'Darkroom',
      'main-street-pigment': 'Pigment',
      'main-street-nightshade': 'Nightshade',
      'main-street-celestine': 'Celestine',
      'main-street-ritual': 'Ritual',
      'main-street-confetti': 'Confetti',
      'main-street-bubblegum': 'Bubblegum',
      'main-street-sprout': 'Sprout',
      'main-street-pressroom': 'Pressroom',
      'main-street-marquee': 'Marquee',
      'main-street-broadside': 'Broadside',
      'main-street-heirloom': 'Heirloom',
      'main-street-curiosity': 'Curiosity',
      'main-street-postmark': 'Postmark',
    },
    descriptions: {
      'main-street-ember': 'warm cream and ember, a soft serif — homey, cozy, hand-baked',
      'main-street-orchard': 'golden amber and terracotta, a warm hand-cut serif — harvest evening',
      'main-street-pantry': 'bright kitchen cream and garden green, a sturdy slab — fresh and farm-direct',
      'main-street-hearthstone': 'candlelit dark with ember amber, a high-contrast serif — cozy after dark',
      'main-street-tannery': 'dark brown-black leather with aged brass, a sturdy slab — rugged and warm',
      'main-street-forge': 'cold blue-charcoal with mustard, condensed industrial caps — metal and machine',
      'main-street-anvil': 'near-black with a single blood red, heavy blunt caps — butcher-sign bold',
      'main-street-sawdust': 'light oak and wood-stain brown, a clean slab — the daylight woodshop',
      'main-street-porcelain': 'blush white and aubergine, a fine hairline serif — romantic and delicate',
      'main-street-atelier': 'bright paper with ink and thin gold, a sharp modern grotesque — clean contemporary luxury',
      'main-street-gild': 'black and thin gold, a high-contrast serif — the lit jewel case',
      'main-street-botanical': 'oat and deep forest green, a soft optical serif — earthy and seasonal',
      'main-street-conservatory': 'pale leaf-white and garden green, an airy roman serif — the glasshouse',
      'main-street-wildflower': 'warm meadow cream and cosmos pink, a blowsy display serif — bright and seasonal',
      'main-street-studio': 'bone-white gallery wall, huge ink type, one hot vermillion — quiet room, loud art',
      'main-street-darkroom': 'charcoal wall and cold slate, a characterful grotesque — moody gallery',
      'main-street-pigment': 'bright white and hot magenta, a big bold grotesque — for vivid, colorful work',
      'main-street-nightshade': 'violet-black and electric amethyst with a gold hairline, a carved gothic — deep occult',
      'main-street-celestine': 'pale dawn-lilac and dusk violet, an engraved roman — soft and celestial',
      'main-street-ritual': 'near-black and a single blood red, a dramatic serif — candlelit and intense',
      'main-street-confetti': 'butter cream with poppy and grape, a rounded heavy display — bright and cheerful',
      'main-street-bubblegum': 'cotton-candy white with bubblegum pink and pool cyan, a rounded display — candy loud',
      'main-street-sprout': 'soft pistachio and warm apricot, a gentle rounded sans — the friendly, quiet end of cheerful',
      'main-street-pressroom': 'bone paper with off-register riso red and blue, condensed poster caps — screenprint',
      'main-street-marquee': 'black with one neon-lime, a wall of poster caps — streetwear and bold',
      'main-street-broadside': 'newsprint gray with stamped red, condensed caps — the raw zine',
      'main-street-heirloom': 'faded ochre paper, sepia ink, worn teal and oxblood, an old Caslon — found, not made',
      'main-street-curiosity': 'deep wood and brass with a bottle-green band, a Victorian display — the vintage cabinet',
      'main-street-postmark': 'aged paper with retro orange and teal, an ornate display serif — mid-century ephemera',
    },
  },
} as const;

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
  /** "1 testimonial" / "12 testimonials" — testimonials aggregate. */
  testimonials: (n: number): string => `${n} ${n === 1 ? 'testimonial' : 'testimonials'}`,
  /** "5 out of 5" — rating treatment. */
  outOfFive: (n: number): string => `${n} out of 5`,
  /** Screen-reader label "Show testimonial 3" — pull-quote treatment. */
  showTestimonial: (n: number): string => `Show testimonial ${n}`,
  /** "No. 3" — lookbook eyebrow. */
  numberOf: (n: number): string => `No. ${n}`,
} as const;
