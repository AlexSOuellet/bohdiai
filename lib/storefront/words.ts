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
    account: '',
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
  /** Buyer accounts (Full): signing in, My account, an order's page, and the reset email. */
  account: {
    /** The menu link to /account. */
    nav: '',
    signIn: {
      title: '',
      lede: '',
      email: '',
      password: '',
      submit: '',
      submitting: '',
      forgot: '',
      toCreate: '',
    },
    create: {
      title: '',
      lede: '',
      name: '',
      email: '',
      password: '',
      /** "At least {n} characters". */
      passwordHint: '',
      submit: '',
      submitting: '',
      toSignIn: '',
    },
    errors: {
      email: '',
      password: '',
      /** "Use at least {n} characters." */
      short: '',
      wrong: '',
      exists: '',
      limited: '',
      unavailable: '',
      failed: '',
      mismatch: '',
      expired: '',
    },
    forgot: {
      title: '',
      lede: '',
      submit: '',
      submitting: '',
      sent: '',
      back: '',
    },
    newPassword: {
      title: '',
      lede: '',
      password: '',
      confirm: '',
      submit: '',
      submitting: '',
    },
    mine: {
      title: '',
      /** "Hello, {name}". */
      hello: '',
      helloNoName: '',
      orders: '',
      none: '',
      browse: '',
      signOut: '',
      /** "Order {n}". */
      number: '',
      view: '',
      locale: '',
    },
    status: {
      pending: '',
      paid: '',
      fulfilled: '',
      shipped: '',
      delivered: '',
      canceled: '',
      refunded: '',
      partiallyRefunded: '',
    },
    order: {
      back: '',
      /** "Placed {date}". */
      placed: '',
      items: '',
      subtotal: '',
      discount: '',
      shipping: '',
      tax: '',
      total: '',
      reorder: '',
      reordering: '',
      reorderNone: '',
    },
    /** The password-reset email, in the shop's own words. */
    email: {
      /** "Reset your {shop} password". */
      subject: '',
      lead: '',
      action: '',
      expiry: '',
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
