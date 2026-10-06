/**
 * Boutique, nursery design — the one home for the UI strings the renderer paints
 * itself. Everything the owner wrote (story, headline, babies, dates) comes from
 * the backend, never from here.
 */
export const NURSERY_STRINGS = {
  nav: {
    label: 'Main',
    nursery: 'The nursery',
    artist: 'The artist',
    visit: 'Visiting hours',
    touch: 'Ask about a baby',
    home: 'Home',
  },
  hero: { meet: 'Meet the babies', from: (price: string) => `Adoption from ${price}` },
  card: {
    hello: 'Hello, my name is',
    fee: 'Adoption fee',
    ready: 'Ready to go home',
    adopted: 'Adopted',
    open: (name: string) => `Meet ${name}`,
  },
  nursery: {
    tag: 'In the nursery now',
    title: 'Waiting to go home',
    count: (n: number) => (n === 1 ? 'One baby waiting' : `${n} babies waiting`),
    all: (n: number) => `Meet all ${n} babies`,
    empty: 'The nursery is quiet right now. New babies are on the way.',
  },
  artist: { tag: 'From the artist' },
  visit: { tag: 'Visiting hours', title: 'Come say hello in person', locale: 'en-US' },
  touch: {
    tag: 'Ask about a baby',
    title: 'Fell in love with someone?',
    lede: 'Tell me which baby caught your eye, and I’ll answer every question.',
    call: 'Call or text',
    facebook: 'Find me on Facebook',
    instagram: 'Instagram',
  },
  certificate: {
    title: 'Certificate of Birth',
    name: 'Name',
    about: 'About this baby',
    born: 'Born at',
    artist: 'Artist',
    fee: 'Adoption fee',
    status: 'Status',
    adopt: (name: string) => `Ask to adopt ${name}`,
    back: 'Back to the nursery',
    photo: (name: string, n: number) => `${name}, photo ${n}`,
    showPhoto: (n: number) => `Show photo ${n}`,
  },
  shop: { title: 'The nursery' },
  footer: {
    empowered: 'Empowered by BohdiAI',
    year: (y: number, name: string) => `© ${y} ${name}`,
  },
} as const;
