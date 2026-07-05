/**
 * Main Street — the one place empty-state and structural copy strings live.
 *
 * These are the strings the RENDERER falls back to when a section is genuinely
 * empty on a real live store (a new store with no pieces yet, no collections,
 * no reviews, no dates). Everything else — page titles, section headings, intros,
 * body prose — is authored by the copywriter every build. If a real build lands
 * with an authored field missing, that's a copywriter bug, not something the
 * renderer papers over with English.
 *
 * One map, one import. Any string a maker or a customer might see that isn't
 * authored by the copywriter passes through here. If a niche needs different
 * copy for these, that's a future editor door; the maker overrides via a real
 * content field, never by digging into code.
 */
export const DEFAULT_STRINGS = {
  /** Shop page shown when the maker has zero products (also used for a collection
   *  detail page when the collection is empty). */
  emptyShop: 'New pieces are on the way — check back soon.',
  /** Collections index page shown when the maker has zero collections. */
  emptyCollections: 'New collections are on the way — check back soon.',
  /** Testimonials page shown when reviews aren't yet authored. */
  emptyReviews: 'The kind words are still coming in — check back soon.',
  /** Events page shown when the maker has no upcoming dates (or turned the
   *  calendar off). */
  emptyEvents: 'No upcoming dates just yet — check back soon to see where we will be next.',
  /** Product page — the "Add to cart" button label when the product is available. */
  productAddToCart: 'Add to cart',
  /** Product page — the button label when the product is sold out. */
  productSoldOut: 'Sold out',
  /** Product page — the label above the full description block. */
  productDetailsLabel: 'Details',
  /** Contact form labels + status messages. */
  contactFormName: 'Name',
  contactFormEmail: 'Email',
  contactFormMessage: 'Message',
  contactFormSend: 'Send message',
  contactFormSending: 'Sending…',
  contactFormSent: 'Thanks — your message is on its way.',
  contactFormError: 'Something went wrong — try again.',
} as const;

export type DefaultStringKey = keyof typeof DEFAULT_STRINGS;
