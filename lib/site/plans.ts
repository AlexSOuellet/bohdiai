/**
 * bohdiai.com's plans and the comparison shown beside them. One list feeds the
 * pricing pages, the contact form's plan chips and Alex's inquiry email, so a
 * price can't drift between them. Agreed with Alex 2026-10-02 (whole-dollar
 * prices and Maker Showcase added 2026-10-03) — see
 * docs/superpowers/specs/2026-10-02-tiers-and-pricing.md.
 */
export type Audience = 'maker' | 'contractor';

export const PLAN_IDS = ['maker-showcase', 'maker-lite', 'maker-full', 'contractor-lite', 'contractor-full'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  audience: Audience;
  tier: 'showcase' | 'lite' | 'full';
  name: string;
  forWho: string;
  monthly: number;
  yearly: number;
  /** For Full plans, read after "Everything in Lite, plus". */
  includes: readonly string[];
  /** The one plan a page lights up, with this label beside its name. */
  badge?: string;
};

export const PLANS: readonly Plan[] = [
  {
    id: 'maker-showcase',
    audience: 'maker',
    tier: 'showcase',
    name: 'Maker Showcase',
    forWho: 'For makers who want a real place to show their work',
    monthly: 5,
    yearly: 50,
    badge: 'Most popular',
    includes: [
      'A one-page site: who you are, what you make, how to reach you',
      'Up to 12 photos of your work, with captions',
      'Your story, in your own words',
      'A contact form, straight to your inbox',
      'Your phone, Facebook and Instagram',
      'Change your photos and words yourself, any time',
    ],
  },
  {
    id: 'maker-lite',
    audience: 'maker',
    tier: 'lite',
    name: 'Maker Lite',
    forWho: 'For makers who sell in person and want a place to send people',
    monthly: 15,
    yearly: 150,
    includes: [
      'Your own site: a home page and a catalog page',
      'Every product with its photo and price',
      '“Ask about this” on every product, straight to your inbox',
      'Your market dates, so people know where to find you',
      'A point of sale on your phone for markets: it adds up the sale and shows your Venmo or Cash App code',
      'Your Facebook and Instagram, front and center',
    ],
  },
  {
    id: 'maker-full',
    audience: 'maker',
    tier: 'full',
    name: 'Maker Full',
    forWho: 'For makers ready to sell online as well as in person',
    monthly: 20,
    yearly: 200,
    includes: [
      'Sell online, paid straight into your own Stripe or Square',
      'Orders and shipping in one place',
      'Take cards at markets through your own Stripe or Square',
      'Up to 12 photos and a short video for each product',
      'Digital downloads, if you sell them',
      'See which markets made money, this year against last',
    ],
  },
  {
    id: 'contractor-lite',
    audience: 'contractor',
    tier: 'lite',
    name: 'Contractor Lead Generation',
    forWho: 'For contractors who need a real site that works',
    monthly: 15,
    yearly: 150,
    includes: [
      'A one-page site built around your own job photos',
      'An estimate form where customers send photos of the job',
      'Every estimate request straight to your email',
      'Your services and the area you cover',
    ],
  },
  {
    id: 'contractor-full',
    audience: 'contractor',
    tier: 'full',
    name: 'Contractor Full',
    forWho: 'For contractors who want the site to bring in work',
    monthly: 30,
    yearly: 300,
    includes: [
      'An estimate inbox: track every job from request to won',
      'A job gallery you add to from your phone',
      'A booked-days calendar, so customers see how far out you are',
      'Review requests: one tap asks a customer for a Google review',
      'Keep your own services, questions and notices up to date',
    ],
  },
];

export function plansFor(audience: Audience): readonly Plan[] {
  return PLANS.filter((p) => p.audience === audience);
}

/** The lowest monthly price an audience can start at. */
export function fromPrice(audience: Audience): number {
  return Math.min(...plansFor(audience).map((p) => p.monthly));
}

export function isPlanId(v: string): v is PlanId {
  return (PLAN_IDS as readonly string[]).includes(v);
}

export function planById(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (plan === undefined) throw new Error(`Unknown plan ${id}`);
  return plan;
}

/** `$15`, `$150`, `$4.50` — whole dollars drop the cents. */
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export type ComparisonRow = {
  name: string;
  /** What it costs. */
  cost: string;
  /** What it means for the customer — including the work they'd do themselves. */
  you: string;
  ours?: true;
};

/**
 * Competitor figures, checked on the competitors' own pages on this date:
 * Wix Light $17.77 / Core $29.77 a month (wix.com/plans); Squarespace $19–$39
 * (squarespace.com/pricing); Shopify Basic $29–$39 plus 2% with outside payment
 * providers (shopify.com/pricing); Etsy $0.20 a listing, 6.5% transaction,
 * 3% + $0.25 processing in the US (etsy.com/legal/fees, via fee guides);
 * web designers $2,000–$8,000 typical for a small-business site and lead services
 * about $15–$100+ a lead (2026 industry price guides). Re-check before changing.
 */
export const COMPARISON_CHECKED = '2026-10-02';

const WEB_DESIGNER_COST = '$2,000 and up to build, then a monthly fee';
const SITE_BUILDER_COST = 'About $18 to $39 a month';

export const COMPARISON: Record<Audience, readonly ComparisonRow[]> = {
  maker: [
    { name: 'A web designer', cost: WEB_DESIGNER_COST, you: 'A nice site, but every change is a new bill' },
    {
      name: 'Wix or Squarespace',
      cost: SITE_BUILDER_COST,
      you: 'You pick a template, design every page, write every word and fix it when it breaks',
    },
    {
      name: 'Shopify',
      cost: '$29 to $39 a month, plus paid apps',
      you: 'All of that, plus setting up your own payments, shipping and apps',
    },
    {
      name: 'Etsy',
      cost: '20¢ a listing, 6.5% of every sale, plus payment fees',
      you: 'Your shop looks like everyone else’s, and your customers belong to Etsy',
    },
    {
      name: 'BohdiAI',
      cost: `Built free, from ${formatPrice(fromPrice('maker'))} a month`,
      you: 'I build it and write it with you. Fixes covered. Never a cut of your sales',
      ours: true,
    },
  ],
  contractor: [
    { name: 'A web designer', cost: WEB_DESIGNER_COST, you: 'A nice site, but a new photo or service is a new bill' },
    {
      name: 'Wix or Squarespace',
      cost: SITE_BUILDER_COST,
      you: 'You build it at night, after a full day on the job',
    },
    {
      name: 'Angi, HomeAdvisor or Thumbtack',
      cost: 'About $15 to $100 or more for every lead',
      you: 'You pay whether you get the job or not, and the same lead goes to your competitors',
    },
    {
      name: 'Just a Facebook page',
      cost: 'Free',
      you: 'It looks like a hobby, it gets buried, and you don’t control it',
    },
    {
      name: 'BohdiAI',
      cost: `Built free, from ${formatPrice(fromPrice('contractor'))} a month`,
      you: 'Estimate requests with photos come straight to you, and every lead is yours alone',
      ours: true,
    },
  ],
};
