/**
 * Contractor — the one home for UI strings the renderer paints itself (form
 * labels, buttons, states, accessible names). Authored copy never lives here;
 * it comes from the site's content.
 */
export const CONTRACTOR_STRINGS = {
  call: 'Call',
  callOrText: 'Call or text',
  estimateShort: 'Free estimate',
  menuLabel: 'Site',
  skipToEstimate: 'Skip to the estimate form',
  playVideo: 'Play video',
  pauseVideo: 'Pause video',
  serving: 'Serving',
  starsLabel: 'Five out of five stars',
  /** Atelier design: the estimator's UI words. */
  estimator: {
    scope: 'The job',
    size: 'How big',
    grade: 'The finish',
    range: 'Estimated range',
    send: 'Send this to us',
    groupLabel: 'Ballpark estimate',
  },
  /** Blueprint design: the one-at-a-time review quote. */
  quotes: {
    prev: 'Previous review',
    next: 'Next review',
    label: 'Customer reviews',
    position: (n: number, of: number) => `Review ${n} of ${of}`,
  },
  /** The booked-days calendar. */
  calendar: {
    booked: 'Booked',
    open: 'Open',
    weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dayLabel: (month: string, day: number, booked: boolean) => `${month} ${day}: ${booked ? 'booked' : 'open'}`,
  },
  /** Atelier design: the closing call card. */
  callNow: 'Call now',
  /** Statement design: under the sideways-scrolling work photos. */
  scrollHint: 'Swipe or scroll for more',
  form: {
    name: 'Your name',
    phone: 'Phone',
    email: 'Email',
    contactHint: 'A phone number or an email — whichever you’d like us to use.',
    town: 'Town',
    state: 'State',
    statePlaceholder: 'Choose',
    services: 'What do you need?',
    details: 'Tell us about the job',
    detailsHint: 'Size of the yard, what’s there now, when you’d like it done.',
    photos: 'Photos of the space',
    photosHint: 'Up to 5 phone photos. Wide shots help most.',
    photosChosen: (n: number) => (n === 1 ? '1 photo ready' : `${n} photos ready`),
    optional: 'optional',
    /** Label on the hidden spam trap — never seen by people. */
    honeypot: 'Company',
    submit: 'Send my request',
    sending: 'Sending…',
    successTitle: 'Got it — thank you.',
    successBody: 'Your request is on its way. Expect a call or text back soon.',
    sendAnother: 'Send another request',
    errorGeneric: 'That didn’t send. Please try again, or call us instead.',
    errorNetwork: 'We couldn’t reach the server. Check your connection and try again, or call us.',
    errorNeedContact: 'Add a phone number or an email so we can reach you.',
    errorName: 'Please add your name.',
    errorTooManyPhotos: 'Up to 5 photos, please.',
    errorPhotoTooBig: 'One of those photos is over 15MB. Try a different one.',
    errorPhotoType: 'Photos need to be JPG, PNG, or WebP.',
  },
  footer: {
    privacy: 'Privacy',
    rights: 'All rights reserved.',
    /** "2026 Empowered by BohdiAI" on sites served from a bohdiai.com address. */
    creditPrefix: 'Empowered by',
    creditBrand: 'BohdiAI',
  },
} as const;
