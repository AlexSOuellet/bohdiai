/**
 * Saltmarsh & Lace — the made-up demo shop (Saltmarsh & Lace demo spec): Lena
 * Brightman, paint counter in Bristol, decoupage across bottles, boards, boxes,
 * ornaments and oyster dishes. Starts at Showcase; later stages move it up the
 * plans. The photos are generated in the style of two Etsy shops Alex chose as
 * models, never copies. Built by scripts/build-card-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { CardSiteModule } from '../build-card-site';

export const SITE: CardSiteModule['SITE'] = {
  subdomain: 'saltmarsh-and-lace',
  businessName: 'Saltmarsh & Lace',
  // The shoreline design (its own look). Family and skin are stored but unread by it.
  design: 'shoreline',
  family: 'rustic',
  skin: 'main-street-sawdust',
  // Starts at Showcase; the plan switch (stage two) moves it up and down.
  plan: 'showcase',
  // A demo: Upgrade and Downgrade switch at once through the checkout, no card taken.
  demo: true,
};

export const PROFILE: ProfileForm = {
  kicker: 'Decoupage and altered art from Bristol, Rhode Island',
  headline: 'Bottles, boards, boxes, ornaments and oyster dishes, sealed to last',
  aboutTitle: 'From the paint counter',
  bio: [
    'By day I run the paint counter at our family hardware store in Bristol. All day long people ask me if something will stick to glass, or hold up on wood, or survive the dishwasher.',
    'I bought my first pack of decoupage papers to answer one of those questions properly. I tried it on an empty bottle behind the counter, and the customer bought the bottle.',
    'Now I work after closing in the back room, between the paint cans. Every sealer on our shelves gets tested before it goes on a piece, so what you take home holds up.',
    'Summers belong to the red, white and blue line, because Bristol’s Fourth of July is the biggest week of my year. The salt marsh past our loading dock is where the name comes from.',
  ].join('\n\n'),
  signature: 'Lena',
  makes: ['Art bottles', 'Boards and trays', 'Oyster dishes'],
  quote: '',
  quoteAttribution: '',
  marqueePhrases: [],
  phone: '',
  // Sample sites point their Facebook button at BohdiAI's own page (Alex, 2026-10-05).
  facebookUrl: 'https://www.facebook.com/bohdiai',
  instagramUrl: '',
};

/** In site order; the first opens the shelf. */
export const PHOTOS: CardSiteModule['PHOTOS'] = [
  { file: 'oyster1.jpg', caption: 'Cabbage rose oyster dish' },
  { file: 'bottle1.jpg', caption: 'The lady in amber' },
  { file: 'board1.jpg', caption: 'Lemon blossom board' },
  { file: 'oyster3.jpg', caption: 'Lighthouse ring dish' },
  { file: 'box1.jpg', caption: 'Bay chart keepsake box' },
  { file: 'ornament1.jpg', caption: 'Old Saint Nick' },
  { file: 'scallop1.jpg', caption: 'Blue toile scallop tray' },
  { file: 'patriot1.jpg', caption: 'Fourth of July bottle' },
  { file: 'tray1.jpg', caption: 'Midnight garden tray' },
  { file: 'oyster2.jpg', caption: 'Sea chart oyster trio' },
  { file: 'jar1.jpg', caption: 'Lace and roses lantern' },
  { file: 'ornament2.jpg', caption: 'Carol star' },
];

/** Made-up market dates for the sample. */
export const DATES = [
  { date: '2026-10-24', endDate: '', name: 'Harvest Fair at Colt State Park', town: 'Bristol' },
  { date: '2026-11-14', endDate: '', name: 'Holiday Makers Market', town: 'Warren' },
  { date: '2026-12-05', endDate: '2026-12-06', name: 'Christmas Fair at the Grange', town: 'Barrington' },
  { date: '2026-12-19', endDate: '', name: 'Last-Minute Gift Market', town: 'Tiverton' },
];

/** Made-up customer words for the demo's Full stage (scripts/demo-reset.ts full). */
export const TESTIMONIALS = [
  { quote: 'I bought the lighthouse dish for my mother, who grew up in Jamestown. She cried. It sits on her windowsill now and she tells everyone about it.', name: 'Karen M.', detail: 'Barrington' },
  { quote: 'Lena told me exactly how to care for the cutting board, and two years later it still looks brand new.', name: 'Diane R.', detail: 'Lemon blossom board' },
  { quote: 'We give her ornaments as teacher gifts every Christmas. Every one is different, and the teachers fight over them.', name: 'Jess T.', detail: 'Warren' },
  { quote: 'Found her at the Colt State Park fair. Came home with three oyster dishes and a bottle. Worth every penny.', name: 'Mike and Ann P.', detail: 'Bristol' },
];

/**
 * Her full catalog for the demo's Full stage (scripts/demo-reset.ts full): the 12
 * pieces her gallery photos became (matched by name) get their prices and words,
 * and the rest are added with their own photos. Made up for the demo.
 */
export const CATALOG: { photo: string; extraPhotos?: string[]; name: string; short: string; description: string; priceCents: number; onHome?: boolean; isNew?: boolean }[] = [
  {
    photo: 'oyster1.jpg',
    name: 'Cabbage rose oyster dish',
    extraPhotos: ['oyster1-detail.jpg'],
    short: 'A real Narragansett Bay oyster shell with faded cabbage roses and a hand-gilded rim',
    description:
      'Every shell comes from the raw bars along the Bristol waterfront, scrubbed and cured before the paper goes on. This one carries soft pink cabbage roses over a lace pattern, with the rim gilded by hand so no two edges match.\n\nSealed with six coats, so it holds rings, earrings or a tea bag without a mark. Wipe clean with a damp cloth.',
    priceCents: 2800,
    onHome: true,
  },
  {
    photo: 'bottle1.jpg',
    name: 'The lady in amber',
    extraPhotos: ['bottle1-detail.jpg'],
    short: 'Tall amber apothecary bottle with a Victorian portrait, lace and a brass key',
    description: 'An old amber apothecary bottle dressed with a Victorian portrait and French script paper, wrapped in jute and lace, with a little brass key on the twine.\n\nThe paper is sealed under a satin finish that won’t yellow. A shelf piece, not for liquids.',
    priceCents: 4400,
    onHome: true,
  },
  {
    photo: 'board1.jpg',
    name: 'Lemon blossom board',
    short: 'Paddle board with antique lemon botanicals, sealed for the counter',
    description: 'A hardwood paddle board with an antique botanical print of lemons and blossoms. The edges are sanded and stained, and the face is sealed with a food-safe finish I tested on our own kitchen counter for a month.\n\nFor serving and display. Hand wash only.',
    priceCents: 6500,
    onHome: true,
  },
  {
    photo: 'oyster3.jpg',
    name: 'Lighthouse ring dish',
    short: 'Oyster shell with a watercolor lighthouse on a rocky point',
    description: 'A rough oyster shell with a soft blue watercolor lighthouse inside and a gilded rim. A favorite for people who grew up near the water, and for anyone who misses it.\n\nSealed and wipeable. About 4 inches across.',
    priceCents: 3200,
    onHome: true,
  },
  {
    photo: 'box1.jpg',
    name: 'Bay chart keepsake box',
    extraPhotos: ['box1-detail.jpg'],
    short: 'Wooden box with an old Narragansett Bay chart and a compass rose',
    description: 'A small wooden keepsake box with an antique chart of Narragansett Bay on the lid, distressed edges and little brass hinges. Good for letters, shells, or a ring before the wedding.\n\nThe chart is sealed under a hard satin coat.',
    priceCents: 4200,
  },
  {
    photo: 'ornament1.jpg',
    name: 'Old Saint Nick',
    short: 'Glass ornament with a Victorian Santa and a gold glitter cap',
    description: 'A clear glass ball with a Victorian Santa postcard laid on the inside curve, a gold glitter cap and a velvet ribbon to hang it.\n\nOne of my Christmas market pieces. Each one is a little different.',
    priceCents: 2200,
  },
  {
    photo: 'scallop1.jpg',
    name: 'Blue toile scallop tray',
    short: 'Scallop shell jewelry tray in blue and white toile with a gold rim',
    description: 'A real scallop shell covered in blue and white toile, with a gilded rim. Just right for a dresser or a bathroom counter.\n\nSealed against water and perfume.',
    priceCents: 3400,
  },
  {
    photo: 'patriot1.jpg',
    name: 'Fourth of July bottle',
    short: 'Wine bottle in faded stars and stripes with a navy bow',
    description: 'From my red, white and blue line, made every summer for Bristol’s Fourth of July. A clear wine bottle wrapped in a faded flag pattern, finished with a navy ribbon and a small brass star.\n\nA shelf or mantel piece. Ask about a fairy-light cork.',
    priceCents: 3800,
  },
  {
    photo: 'tray1.jpg',
    name: 'Midnight garden tray',
    extraPhotos: ['tray1-detail.jpg'],
    short: 'Serving tray with dark Dutch florals and antique gold handles',
    description: 'A wooden serving tray with dark, moody Dutch still-life florals and handles painted antique gold. Big enough for coffee for two.\n\nThe top is sealed with a heat-resistant finish, so a hot mug won’t leave a ring.',
    priceCents: 7800,
  },
  {
    photo: 'oyster2.jpg',
    name: 'Sea chart oyster trio',
    short: 'Three oyster shells with sea chart and seaweed prints, gilded rims',
    description: 'Three oyster shells, each with a different piece of old sea chart and pressed-seaweed prints, finished with gold-leaf rims. Sold as a set.\n\nSealed and wipeable.',
    priceCents: 6200,
  },
  {
    photo: 'jar1.jpg',
    name: 'Lace and roses lantern',
    short: 'Mason jar lantern with a lace doily pattern and pink roses',
    description: 'A mason jar covered in translucent rice paper with a lace doily pattern and soft pink roses. With a tea light inside, the lace throws a pattern on the wall.\n\nUse a battery tea light, or a real one with the lid off.',
    priceCents: 3200,
  },
  {
    photo: 'ornament2.jpg',
    name: 'Carol star',
    short: 'Wooden star ornament with old sheet music and a holly sprig',
    description: 'A flat wooden star covered in aged sheet music, with a tiny holly sprig, a glitter edge and a baker’s twine loop.\n\nLight enough for any branch.',
    priceCents: 1800,
  },
  {
    photo: 'quahog.jpg',
    name: 'Hydrangea quahog dish',
    short: 'A Rhode Island quahog shell with blue hydrangeas and its own purple edge',
    description: 'Quahogs are as Rhode Island as it gets, and their purple edge is too pretty to cover. This one keeps it, with soft blue hydrangeas inside and a gilded rim.\n\nSealed and wipeable. Each shell is its own size and shape.',
    priceCents: 3600,
    onHome: true,
    isNew: true,
  },
  {
    photo: 'trinketbox.jpg',
    name: 'Peony trinket box',
    short: 'Round wooden box with pink peonies and an aged gold edge',
    description: 'A small round box with a lift-off lid, covered in vintage pink peonies on cream and edged in aged gold. Made for earrings, rings and the little things that wander off.\n\nSealed inside and out.',
    priceCents: 3900,
    isNew: true,
  },
  {
    photo: 'votive.jpg',
    name: 'Seashell votive',
    short: 'Glass votive with watercolor shells and seaweed',
    description: 'A clear glass votive wrapped in soft watercolor seashells and seaweed. Lit at dusk, the shells glow like sea glass.\n\nFor tea lights. Wipe the outside only.',
    priceCents: 2400,
    isNew: true,
  },
  {
    photo: 'apothecary3.jpg',
    name: 'Garden apothecary trio',
    short: 'Three small amber bottles with vintage garden flowers, corked and tied',
    description: 'Three little amber bottles in three heights, each with a different vintage garden flower laid right on the glass, corked and tied with twine. They look best together on a windowsill.\n\nSold as a set of three. Shelf pieces, not for liquids.',
    priceCents: 4800,
  },
  {
    photo: 'snowman.jpg',
    name: 'Snowman and cardinal ornament',
    short: 'Frosted glass ball with a vintage snowman and a red cardinal',
    description: 'A frosted glass ornament with a vintage postcard snowman and a red cardinal, a silver glitter cap and a red velvet ribbon. A cardinal at Christmas is said to be someone you miss, stopping by.\n\nEach one is a little different.',
    priceCents: 2400,
  },
  {
    photo: 'roundboard.jpg',
    name: 'Hydrangea serving board',
    short: 'Round serving board with blue and white hydrangeas',
    description: 'A round wooden board covered in blue and white hydrangeas, with sanded, stained edges. Cheese, cherries, or just leaning on the counter looking pretty.\n\nThe face is sealed with a food-safe finish. Hand wash only.',
    priceCents: 6800,
  },
  {
    photo: 'coasters.jpg',
    name: 'Shell study coasters',
    short: 'Set of four wooden coasters with vintage seashell studies',
    description: 'Four square wooden coasters with vintage seashell illustrations, sealed glossy on top with cork backs so they don’t slide or scratch.\n\nSold as a set of four. Wipe clean.',
    priceCents: 3400,
  },
]

/**
 * Everything else the demo's Full stage fills in (scripts/demo-reset.ts full), all
 * made up for the demo. Market days are counted from the day of the reset, so the
 * demo never goes stale: negative is past, 0 is today, positive is coming up.
 */
export const FULL_DEMO = {
  download: {
    file: 'saltmarsh-sealing-guide.pdf',
    name: 'The Saltmarsh sealing guide',
    short: 'My printable guide to sealing decoupage so it holds up (PDF download)',
    description: 'Everything I learned testing every sealer on our store shelf: preparing shells, glass and wood, thin coats, which finish for which piece, gold leaf, curing, and the care card I send home with every piece.\n\nA two-page PDF you can print. Sent to you after your order.',
    priceCents: 1200,
    photo: 'board1.jpg',
  },
  pay: { venmo: 'saltmarsh-lace', cashapp: 'saltmarshlace', zelle: 'lena@saltmarshandlace.example' },
  sale: { name: 'Harvest sale', percentOff: 15, startedDaysAgo: 3, endsInDays: 11 },
  code: { name: 'Newsletter thank-you', code: 'BAY10', percentOff: 10 },
  collections: [
    { name: 'Shells', pieces: ['Cabbage rose oyster dish', 'Lighthouse ring dish', 'Sea chart oyster trio', 'Blue toile scallop tray', 'Hydrangea quahog dish'] },
    { name: 'Bottles and jars', pieces: ['The lady in amber', 'Fourth of July bottle', 'Garden apothecary trio', 'Lace and roses lantern', 'Seashell votive'] },
    { name: 'Boards and trays', pieces: ['Lemon blossom board', 'Midnight garden tray', 'Hydrangea serving board', 'Shell study coasters'] },
    { name: 'Christmas', pieces: ['Old Saint Nick', 'Carol star', 'Snowman and cardinal ornament'] },
  ],
  markets: [
    // last year
    { day: -352, name: 'Harvest Fair at Colt State Park', town: 'Bristol', hours: '10am – 4pm', address: 'Colt State Park, Hope Street, Bristol, RI', booth: '14', costs: [['Booth fee', 6000], ['Gas', 1200]], rating: 4, goBack: 'yes', review: 'Steady all day. Oyster dishes sold out by two.', sales: [['Cabbage rose oyster dish', 'cash'], ['Lighthouse ring dish', 'venmo'], ['Sea chart oyster trio', 'cashapp'], ['Carol star', 'cash'], ['Old Saint Nick', 'cash']] },
    { day: -330, name: 'Holiday Makers Market', town: 'Warren', hours: '9am – 3pm', address: 'Warren Town Hall, Main Street, Warren, RI', booth: '6', costs: [['Booth fee', 8500], ['Table rental', 1500]], rating: 3, goBack: 'maybe', review: 'Quiet morning, busy after lunch. Indoor, good light.', sales: [['Old Saint Nick', 'cash'], ['Carol star', 'venmo'], ['Blue toile scallop tray', 'zelle']] },
    { day: -310, name: 'Christmas Fair at the Grange', town: 'Barrington', hours: '10am – 5pm', address: 'Barrington Grange Hall, Barrington, RI', booth: '22', costs: [['Booth fee', 12000], ['Gas', 900]], rating: 5, goBack: 'yes', review: 'Best fair of the year. Bring twice the ornaments.', sales: [['Old Saint Nick', 'venmo'], ['Carol star', 'cash'], ['Lace and roses lantern', 'cashapp'], ['Midnight garden tray', 'venmo'], ['Bay chart keepsake box', 'cash'], ['Lemon blossom board', 'venmo']] },
    // this year
    { day: -120, name: 'Spring Craft Fair', town: 'Tiverton', hours: '10am – 3pm', address: 'Tiverton Four Corners, Tiverton, RI', booth: '3', costs: [['Booth fee', 5000], ['Gas', 1400]], rating: 2, goBack: 'no', review: 'Rained most of the day. Not worth the drive.', sales: [['Lighthouse ring dish', 'cash']] },
    { day: -96, name: 'Fourth of July Arts Market', town: 'Bristol', hours: '9am – 6pm', address: 'Independence Park, Bristol, RI', booth: '41', costs: [['Booth fee', 9000], ['Tent weights', 2500]], rating: 5, goBack: 'yes', review: 'Biggest day of my year. Every flag bottle gone by noon.', sales: [['Fourth of July bottle', 'venmo'], ['Fourth of July bottle', 'cash'], ['Sea chart oyster trio', 'cashapp'], ['Cabbage rose oyster dish', 'venmo'], ['Blue toile scallop tray', 'cash'], ['Shell study coasters', 'venmo']] },
    { day: -21, name: 'Harvest Fair at Colt State Park', town: 'Bristol', hours: '10am – 4pm', address: 'Colt State Park, Hope Street, Bristol, RI', booth: '14', costs: [['Booth fee', 6500], ['Gas', 1300]], rating: 4, goBack: 'yes', review: 'Up on last year. The quahog dishes were the talk of the row.', sales: [['Hydrangea quahog dish', 'venmo'], ['Lighthouse ring dish', 'cash'], ['Garden apothecary trio', 'cashapp'], ['Lemon blossom board', 'zelle']] },
    // today, so Sell at the table and the market's own page work live
    { day: 0, name: 'Saturday Market on the Common', town: 'Bristol', hours: '9am – 2pm', address: 'Bristol Town Common, Bristol, RI', booth: '9', costs: [['Booth fee', 4000]], bring: ['Peony trinket box', 'Seashell votive', 'Snowman and cardinal ornament', 'Hydrangea serving board', 'Carol star', 'Old Saint Nick', 'Shell study coasters', 'Blue toile scallop tray'], holds: [['Peony trinket box', 'venmo', 'Rachel'], ['Seashell votive', 'cash', 'Tom']] },
    // coming up
    { day: 21, name: 'Holiday Makers Market', town: 'Warren', hours: '9am – 3pm', address: 'Warren Town Hall, Main Street, Warren, RI', booth: '6', costs: [['Booth fee', 8500]], bring: ['Old Saint Nick', 'Carol star', 'Snowman and cardinal ornament', 'Lace and roses lantern'] },
    { day: 45, name: 'Christmas Fair at the Grange', town: 'Barrington', hours: '10am – 5pm', address: 'Barrington Grange Hall, Barrington, RI', booth: '22', costs: [] },
  ],
  orders: [
    { daysAgo: 0, name: 'Karen Mello', email: 'karen.mello@example.com', phone: '(401) 555-0142', status: 'pending', note: 'Is the quahog dish big enough for a ring and earrings? Pickup in Bristol is fine.', pieces: ['Hydrangea quahog dish', 'Peony trinket box'] },
    { daysAgo: 1, name: 'Jess Tavares', email: 'jess.t@example.com', phone: '', status: 'pending', note: 'Teacher gifts! Could you wrap them separately?', pieces: ['Carol star', 'Old Saint Nick', 'Snowman and cardinal ornament'] },
    { daysAgo: 4, name: 'Diane Rocha', email: 'drocha@example.com', phone: '(401) 555-0177', status: 'paid', note: '', pieces: ['Midnight garden tray'], code: true },
    { daysAgo: 9, name: 'Mike Pereira', email: 'mpereira@example.com', phone: '', status: 'fulfilled', note: 'Shipping to my daughter in Boston.', pieces: ['Sea chart oyster trio', 'The Saltmarsh sealing guide'] },
    { daysAgo: 15, name: 'Ann Souza', email: 'ann.souza@example.com', phone: '', status: 'canceled', note: 'Found one at the fair instead, sorry!', pieces: ['Lemon blossom board'] },
  ],
} as const;
