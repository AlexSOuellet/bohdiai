/**
 * The family designs' word spots (the main-street storefront engine). Only the
 * names of the spots live here; every word is the site's own, in `site_words`
 * under "family.". A word with a blank names it: "{n} pieces".
 */
import { wordsFrom, type WordShape, type Words } from '@/lib/site-words/words';

export const FAMILY_WORDS_PREFIX = 'family';

export const FAMILY_WORD_SPOTS = {
  emptyShop: '',
  emptyCollections: '',
  emptyTestimonials: '',
  emptyEvents: '',
  emptyMonth: '',
  productAddToCart: '',
  productAskAbout: '',
  productSoldOut: '',
  productUnavailable: '',
  productDetailsLabel: '',
  contactFormName: '',
  contactFormEmail: '',
  contactFormMessage: '',
  contactFormSend: '',
  contactFormSending: '',
  contactFormSent: '',
  contactFormError: '',
  navShop: '',
  navCollections: '',
  navAbout: '',
  navEvents: '',
  navContact: '',
  navCart: '',
  footerHome: '',
  footerIntro: '',
  footerPrivacy: '',
  footerTerms: '',
  footerCreditPrefix: '',
  footerCreditBrand: '',
  fallbackSeeAllGoods: '',
  fallbackReadFullStory: '',
  fallbackSeeAllDates: '',
  fallbackExploreCollection: '',
  fallbackViewPiece: '',
  getDirections: '',
  eventsThisMonth: '',
  findUsAlsoComingUp: '',
  founderPostscript: '',
  testimonialsTextsAttribution: '',
  ariaOpenMenu: '',
  ariaCloseMenu: '',
  ariaPreviousMonth: '',
  ariaNextMonth: '',
  ariaSlides: '',
  ariaSiteNav: '',
  ariaMenu: '',
  ariaMarqueeHighlights: '',
  ariaCollageMoments: '',
  priceFrom: '',
  choiceSoldOut: '',
  choiceUnavailable: '',
  piecesOne: '',
  pieces: '',
  itemsOne: '',
  items: '',
  showTestimonial: '',
  numberOf: '',
  marketDay: '',
  marketRange: '',
  marketCanceled: '',
  marketWhere: '',
  dateLocale: '',
  itineraryDay: '',
  nextStopDay: '',
  nextStopWhen: '',
  nextStopAccent: '',
  posterDay: '',
} as const satisfies WordShape;

export type FamilyWords = Words<typeof FAMILY_WORD_SPOTS>;

/** A page painted with no site behind it (the design previews): every spot blank. */
export const FAMILY_NO_WORDS: FamilyWords = wordsFrom(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX, new Map());
