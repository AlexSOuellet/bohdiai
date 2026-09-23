/** Test fixture — a complete, valid contractor site. Test-only; never rendered live. */
import type { ContractorContent } from './schemas';

const img = (n: number) => `https://example.com/job-${n}.jpg`;

export const CONTRACTOR_FIXTURE: ContractorContent = {
  business: {
    name: 'Cut-Pro',
    trade: 'Lawncare & Construction',
    phone: '(401) 206-1566',
    phoneDial: '+14012061566',
    email: 'crew@example.com',
    serviceArea: ['Rhode Island', 'Massachusetts', 'Connecticut'],
  },
  hero: {
    kicker: 'Sod · Grading · Drainage · Stonework',
    marker: 'Until we lay it down…',
    headline: 'The grass will always be greener on the other side',
    highlight: 'greener',
    sub: 'In business since 2009.',
    media: { kind: 'video', url: 'https://example.com/hero.mp4', poster: img(0), alt: 'Fresh sod rolled out' },
    estimateLabel: 'Get a free estimate',
  },
  proof: [
    { figure: '2009', label: 'In business since' },
    { figure: '7:45', label: 'Arrived for an 8:00 start' },
  ],
  work: {
    eyebrow: 'The work',
    title: 'Real yards',
    items: [
      { media: { kind: 'still', url: img(1), alt: 'Striped lawn' }, caption: 'Finished lawn', tag: 'Sod' },
      { media: { kind: 'still', url: img(2), alt: 'Stone path' }, caption: 'Stone walkway' },
      { media: { kind: 'video', url: 'https://example.com/clip.mp4', poster: img(5), alt: 'Sod going down' }, caption: 'Laying sod' },
    ],
  },
  services: {
    eyebrow: 'What we do',
    title: 'Dirt to done',
    items: [
      { name: 'Grass removal', detail: 'Old turf stripped out.' },
      { name: 'New sod installs', detail: 'Laid tight.' },
    ],
    note: 'Premium turf from local growers.',
  },
  reviews: {
    eyebrow: 'Reviews',
    title: 'What customers said',
    items: [
      { quote: 'Said 8, there at 7:45.', author: 'Frank G.', job: 'Stonework and sod' },
      { quote: 'Excellent work!', author: 'Christina A.' },
    ],
    note: 'Reviews from Angi, 2024.',
  },
  crew: {
    eyebrow: 'Who shows up',
    quote: 'We listen to our customers and SHOW UP!',
    attribution: 'Chris Bullock, Owner',
    body: ['Chris comes out himself.'],
    photo: { kind: 'still', url: img(3), alt: 'Chris and crew' },
    inset: { media: { kind: 'still', url: img(4), alt: 'The dog' }, caption: 'Site supervisor' },
  },
  area: { eyebrow: 'Where we work', title: 'Three states', intro: 'RI, MA and CT.' },
  estimate: { eyebrow: 'Free estimate', title: 'Tell us about your yard', intro: 'We call back.', steps: ['You send it', 'We call'] },
};
