/**
 * The shared storefront pieces' word spots: page titles and search text, the
 * empty cart, the subscriptions page and its notify form. Only
 * the names of the spots live here; every word is the site's own, in
 * `site_words` under "shop.". A word with a blank names it: "{page} — {shop}".
 */
import type { WordShape, Words } from '@/lib/site-words/words';

export const SHOP_WORDS_PREFIX = 'shop';

export const SHOP_WORD_SPOTS = {
  /** Each route's name in its page title. */
  pages: {
    about: '',
    cart: '',
    collections: '',
    collection: '',
    contact: '',
    events: '',
    market: '',
    privacy: '',
    shop: '',
    subscriptions: '',
    terms: '',
    testimonials: '',
  },
  /** Page titles and the composed search description. */
  seo: {
    pageTitle: '',
    titleNicheAreas: '',
    titleNiche: '',
    titleAreas: '',
    serving: '',
    tailJoin: '',
    sentence: '',
    descriptionJoin: '',
    shopName: '',
  },
  /** How a list of service areas reads: full names in prose, short in a title. */
  areas: {
    listJoin: '',
    pair: '',
    listLast: '',
    shortJoin: '',
    shortLast: '',
  },
  cart: {
    eyebrow: '',
    title: '',
    body: '',
    cta: '',
  },
  subscriptions: {
    eyebrow: '',
    title: '',
    view: '',
    locale: '',
    interval: {
      week: '',
      quarter: '',
      year: '',
      month: '',
    },
  },
  notify: {
    placeholder: '',
    emailLabel: '',
    send: '',
    sending: '',
    thanks: '',
    failed: '',
    network: '',
  },
} as const satisfies WordShape;

export type ShopWords = Words<typeof SHOP_WORD_SPOTS>;

/** A route's spot for its page-title name. */
export type ShopTitleSpot = keyof ShopWords['pages'];
