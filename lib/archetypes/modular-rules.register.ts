/**
 * The register behind the modular-rules test (Modular Plan, step 1.3).
 *
 * Every word a design paints is one of two kinds (Alex, 2026-10-13):
 *
 * - SITE words belong to the site. Section names and headings, the lines under
 *   them, empty-state messages, anything in the maker's voice, and the site's own
 *   vocabulary ("Adoption fee", "Browse the shelf"). Each gets a home per site.
 *   The SITE lists below are words still sitting in code. They can only shrink:
 *   each one comes off when its home is built.
 * - PLATFORM words are how the site works, the same on every site: buttons, form
 *   labels, cart and payment mechanics, statuses, errors, screen-reader labels,
 *   date formats, footer links. They stay in the design's strings file.
 *
 * A word that appears in a strings file but in neither list fails the test, so a
 * new word can't slip in without being sorted. Patterns: an exact key path, or a
 * prefix ending in ".*" that covers everything under it.
 */

export interface WordRegister {
  /** Site words still in code, waiting for their home. Shrinks to empty. */
  site: readonly string[];
  /** Platform words that stay in code. */
  platform: readonly string[];
}

export const WORD_REGISTER: Record<string, WordRegister> = {
  'card/CARD_STRINGS': {
    site: [
      'nav.about', 'nav.work', 'nav.touch', 'seeWork', 'askAbout',
      'about.*',
      'work.eyebrow', 'work.hand', 'work.title', 'work.lede',
      'touch.eyebrow', 'touch.hand', 'touch.title', 'touch.lede', 'touch.followOn',
      'form.message',
      'bulletin.findMe', 'bulletin.more', 'bulletin.aboutFallback', 'bulletin.touch',
      'showreel.seeWork', 'showreel.findMe', 'showreel.touch', 'showreel.lede',
      'torch.about', 'torch.work', 'torch.workTitle', 'torch.find', 'torch.findTitle',
      'torch.touch', 'torch.touchTitle', 'torch.lede',
      'shoreline.work', 'shoreline.makesLabel', 'shoreline.aboutFallback', 'shoreline.find',
      'shoreline.touch', 'shoreline.lede', 'shoreline.writeCta',
      'shoreline.nav.home', 'shoreline.nav.shop', 'shoreline.nav.about', 'shoreline.nav.markets', 'shoreline.nav.contact',
      'shoreline.pageTitles.*', 'shoreline.featured', 'shoreline.kindWords',
      'shoreline.emptyShop', 'shoreline.emptyMarkets',
      'shoreline.cart.browse', 'shoreline.cart.sendLede', 'shoreline.cart.sent',
      'shoreline.market.before', 'shoreline.market.after', 'shoreline.market.canceled',
      'shoreline.market.pick', 'shoreline.market.another', 'shoreline.market.back',
      'shoreline.market.holding', 'shoreline.market.none',
    ],
    platform: [
      'nav.label', 'skip',
      'dates.*',
      'work.open',
      'lightbox.*',
      'touch.callOrText', 'touch.facebook', 'touch.instagram',
      'form.name', 'form.email', 'form.send', 'form.sending', 'form.sent', 'form.sendAnother',
      'form.error', 'form.errorNetwork', 'form.honeypot',
      'bulletin.tabs', 'bulletin.tab',
      'showreel.piece', 'showreel.datesLabel',
      'torch.scroll',
      'shoreline.findCols.*', 'shoreline.home', 'shoreline.nav.label',
      'shoreline.allPieces', 'shoreline.collectionsLabel', 'shoreline.newTag', 'shoreline.saleBanner',
      'shoreline.was', 'shoreline.seeMoreWords', 'shoreline.seeShop', 'shoreline.readStory',
      'shoreline.allMarkets', 'shoreline.askForPrice', 'shoreline.askAbout', 'shoreline.askMessage',
      'shoreline.backToShop', 'shoreline.marketCols.*', 'shoreline.marketLink', 'shoreline.directions',
      'shoreline.cart.nav', 'shoreline.cart.add', 'shoreline.cart.inCart', 'shoreline.cart.full',
      'shoreline.cart.title', 'shoreline.cart.empty', 'shoreline.cart.gone', 'shoreline.cart.remove',
      'shoreline.cart.removeLabel', 'shoreline.cart.subtotal', 'shoreline.cart.discount', 'shoreline.cart.total',
      'shoreline.cart.codeField', 'shoreline.cart.codeApply', 'shoreline.cart.codeApplying',
      'shoreline.cart.codeRemove', 'shoreline.cart.codeApplied', 'shoreline.cart.sendTitle',
      'shoreline.cart.fix', 'shoreline.cart.name', 'shoreline.cart.email', 'shoreline.cart.phone',
      'shoreline.cart.note', 'shoreline.cart.send', 'shoreline.cart.sending', 'shoreline.cart.sentTitle',
      'shoreline.cart.error', 'shoreline.cart.errorNetwork',
      'shoreline.market.where', 'shoreline.market.toShop', 'shoreline.market.noPay',
      'shoreline.market.yourName', 'shoreline.market.yourEmail', 'shoreline.market.payWith',
      'shoreline.market.continue', 'shoreline.market.payTitle', 'shoreline.market.amount',
      'shoreline.market.discount', 'shoreline.market.open', 'shoreline.market.send', 'shoreline.market.zelle',
      'shoreline.market.copy', 'shoreline.market.copied', 'shoreline.market.cash', 'shoreline.market.paid',
      'shoreline.market.sending', 'shoreline.market.doneTitle', 'shoreline.market.done',
      'shoreline.market.order', 'shoreline.market.error', 'shoreline.market.errorNetwork', 'shoreline.market.gone',
      'footer.*',
    ],
  },
  'boutique/NURSERY_STRINGS': {
    site: [
      'nav.nursery', 'nav.gone', 'nav.artist', 'nav.visit', 'nav.touch', 'nav.home',
      'hero.*',
      'card.hello', 'card.fee', 'card.ready', 'card.adopted', 'card.open',
      'nursery.*',
      'gone.tag', 'gone.title',
      'sale.banner',
      'market.tag', 'market.before', 'market.after', 'market.canceled', 'market.toSite',
      'market.pick', 'market.none', 'market.noPay', 'market.back', 'market.holding',
      'market.another', 'market.errorNetwork',
      'born.*',
      'artist.*',
      'visit.tag', 'visit.title',
      'touch.tag', 'touch.title', 'touch.lede',
      'certificate.title', 'certificate.about', 'certificate.born', 'certificate.artist',
      'certificate.fee', 'certificate.adopt', 'certificate.back',
      'shop.*',
      'cart.tag', 'cart.empty', 'cart.browse', 'cart.subtotal', 'cart.sendLede', 'cart.fix',
      'cart.errorNetwork',
    ],
    platform: [
      'nav.label', 'nav.menu', 'nav.close',
      'gone.open',
      'sale.until', 'sale.was',
      'market.where', 'market.yourName', 'market.yourEmail', 'market.payWith', 'market.continue',
      'market.payTitle', 'market.amount', 'market.discount', 'market.open', 'market.send', 'market.zelle',
      'market.copy', 'market.copied', 'market.cash', 'market.paid', 'market.sending',
      'market.doneTitle', 'market.done', 'market.order', 'market.error',
      'visit.locale', 'visit.range', 'visit.canceled', 'visit.directions', 'visit.website',
      'visit.directionsLabel', 'visit.websiteLabel',
      'touch.call', 'touch.facebook', 'touch.instagram',
      'certificate.name', 'certificate.status', 'certificate.photo', 'certificate.showPhoto',
      'cart.link', 'cart.add', 'cart.inCart', 'cart.full', 'cart.ask', 'cart.title', 'cart.remove',
      'cart.removeLabel', 'cart.gone', 'cart.total', 'cart.discount', 'cart.codeField', 'cart.codeApply',
      'cart.codeApplying', 'cart.codeRemove', 'cart.codeApplied', 'cart.sendTitle', 'cart.name',
      'cart.email', 'cart.phone', 'cart.note', 'cart.honeypot', 'cart.send', 'cart.sending',
      'cart.sentTitle', 'cart.sent', 'cart.error',
      'footer.*',
    ],
  },
  'contractor/CONTRACTOR_STRINGS': {
    site: [
      'estimateShort',
      'estimator.scope', 'estimator.size', 'estimator.grade',
      'form.details', 'form.detailsHint',
    ],
    platform: [
      'call', 'callOrText', 'menuLabel', 'skipToEstimate', 'playVideo', 'pauseVideo', 'serving',
      'starsLabel', 'callNow',
      'estimator.range', 'estimator.send', 'estimator.groupLabel',
      'quotes.*',
      'calendar.*',
      'form.name', 'form.phone', 'form.email', 'form.contactHint', 'form.town', 'form.state',
      'form.statePlaceholder', 'form.services', 'form.photos', 'form.photosHint', 'form.photosChosen',
      'form.optional', 'form.honeypot', 'form.submit', 'form.sending', 'form.successTitle',
      'form.successBody', 'form.sendAnother', 'form.errorGeneric', 'form.errorNetwork',
      'form.errorNeedContact', 'form.errorName', 'form.errorTooManyPhotos', 'form.errorPhotoTooBig',
      'form.errorPhotoType',
      'footer.*',
    ],
  },
  'main-street/DEFAULT_STRINGS': {
    site: [
      'emptyShop', 'emptyCollections', 'emptyTestimonials', 'emptyEvents', 'emptyMonth',
      'navShop', 'navCollections', 'navAbout', 'navEvents', 'navTestimonials', 'navContact',
      'fallbackSeeAllGoods', 'fallbackReadFullStory', 'fallbackSeeAllDates', 'fallbackExploreCollection',
      'fallbackViewPiece',
      'findUsAlsoComingUp', 'testimonialsTextsAttribution',
    ],
    platform: [
      'productAddToCart', 'productAskAbout', 'productSoldOut', 'productUnavailable', 'productDetailsLabel',
      'contactFormName', 'contactFormEmail', 'contactFormMessage', 'contactFormSend', 'contactFormSending',
      'contactFormSent', 'contactFormError',
      'navCart',
      'footerHome', 'footerIntro', 'footerTestimonials', 'footerPrivacy', 'footerTerms',
      'footerCreditPrefix', 'footerCreditBrand',
      'getDirections', 'eventsThisMonth', 'founderPostscript',
      'ariaOpenMenu', 'ariaCloseMenu', 'ariaPreviousMonth', 'ariaNextMonth', 'ariaSlides', 'ariaSiteNav',
      'ariaMenu', 'ariaMarqueeHighlights', 'ariaCollageMoments',
    ],
  },
  'main-street/REFERENCE_LABELS': {
    site: [],
    // The internal names of moods, families and skins: never site words.
    platform: ['moods.*', 'families.*', 'skins.*'],
  },
  'main-street/DEFAULT_COUNTS': {
    site: [],
    platform: ['priceFrom', 'choiceSoldOut', 'choiceUnavailable', 'pieces', 'items', 'testimonials', 'outOfFive', 'showTestimonial', 'numberOf'],
  },
};

/**
 * Page-record content each design still reads (the keys of its content schema
 * beyond `design`). Shrinks to empty as each piece moves to its own home.
 */
export const PAGE_RECORD_READS: Record<string, readonly string[]> = {
  boutique: [],
  card: [],
  contractor: [
    'business', 'hero', 'services', 'work', 'crew', 'reviews', 'area', 'estimate',
    'proof', 'faq', 'notice', 'banner', 'calendar', 'estimator', 'comparison',
  ],
  'main-street': [
    'shopName', 'identity', 'moment', 'goods', 'collections', 'marquee', 'about', 'founder',
    'reviews', 'close', 'contact',
  ],
};

/**
 * Words typed straight into a design or shop page instead of coming from a
 * strings file or the site's content: file → the exact words. Shrinks to empty.
 */
export const TYPED_IN_WORDS: Record<string, readonly string[]> = {
  'lib/archetypes/contractor/QuoteRotator.tsx': ['carousel', 'slide'],
  'app/storefront/cart/page.tsx': ['Cart', 'Your cart is empty', 'Browse the shop and add a piece to get started.', 'Browse the shop'],
  'app/storefront/subscriptions/page.tsx': ['Subscriptions', 'Join a subscription', 'View'],
  'app/storefront/_components/NotifyForm.tsx': ['Thanks — we’ll let you know when this launches.', 'you@email.com', 'Email address'],
};
