/**
 * Business card — the one home for UI strings the renderer paints itself (nav,
 * buttons, form labels, states, accessible names). Everything the maker wrote
 * comes from their About you and gallery, never from here.
 */
export const CARD_STRINGS = {
  nav: { label: 'On this page', about: 'About', work: 'The work', touch: 'Get in touch' },
  skip: 'Skip to the contact form',
  seeWork: 'See the work',
  askAbout: 'Get in touch',
  about: { eyebrow: 'About', hand: 'Meet the maker' },
  dates: {
    /** Names the screen-reader list of the dates the marquee scrolls. */
    label: 'Market dates',
    locale: 'en-US',
    day: (weekday: string, month: string, day: string) => `${weekday} ${month} ${day}`,
    line: (when: string, market: string, town: string) => [when, market, town].filter((s) => s !== '').join(' · '),
  },
  work: {
    eyebrow: 'The work',
    hand: 'Fresh off the bench',
    title: 'From the workshop',
    lede: 'Tap any piece to see it up close. Want something like it? Just ask.',
    open: (caption: string, n: number) => (caption === '' ? `Open photo ${n}` : `Open photo: ${caption}`),
  },
  lightbox: { label: 'Photo viewer', close: 'Close', prev: 'Previous photo', next: 'Next photo', count: (n: number, of: number) => `${n} of ${of}` },
  touch: {
    eyebrow: 'Get in touch',
    hand: 'Got an idea?',
    title: 'Let’s talk',
    lede: 'Tell me what you have in mind and I’ll get back to you.',
    callOrText: 'Call or text',
    facebook: 'Facebook',
    instagram: 'Instagram',
    followOn: 'See what’s new',
  },
  form: {
    name: 'Your name',
    email: 'Your email',
    message: 'What are you thinking of?',
    send: 'Send message',
    sending: 'Sending…',
    sent: 'Thanks, it’s on its way. You’ll hear back soon.',
    sendAnother: 'Send another message',
    error: 'That didn’t send. Please try again in a moment.',
    errorNetwork: 'We couldn’t reach the server. Check your connection and try again.',
    /** Label on the hidden spam trap — never seen by people. */
    honeypot: 'Company',
  },
  /** The bulletin board design's own words (the maker's words still come from About you). */
  bulletin: {
    findMe: 'Find me at',
    more: 'More off the bench',
    aboutFallback: 'A little about me',
    touch: 'Tell me about it',
    tabs: 'Tear-off tabs',
    tab: (signature: string) => (signature === '' ? 'Message me' : `Message ${signature}`),
  },
  footer: {
    label: 'Site links',
    privacy: 'Privacy',
    terms: 'Terms',
    creditPrefix: 'Empowered by',
    creditBrand: 'BohdiAI',
  },
} as const;
