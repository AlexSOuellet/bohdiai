/**
 * bohdiai.com's questions and answers, in Alex's voice. One list feeds the
 * /faq page, the top questions on each pricing page and the FAQ structured
 * data, so an answer can't drift between them. Prices come from plans.ts.
 * Agreed with Alex 2026-10-02 — docs/superpowers/specs/2026-10-02-bohdiai-com-faq-design.md.
 */
import { formatPrice, planById, type Audience } from './plans';

/** `link` shows after the answer, e.g. where to buy a domain. */
export type FaqItem = { id: string; q: string; a: readonly string[]; link?: { href: string; label: string } };
export type FaqGroup = { title: string; items: readonly FaqItem[] };

const p = (id: Parameters<typeof planById>[0], period: 'monthly' | 'yearly' = 'monthly'): string =>
  formatPrice(planById(id)[period]);

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    title: 'Why so low',
    items: [
      {
        id: 'why-so-low',
        q: 'Why are your prices so low compared to everyone else?',
        a: [
          'Because getting rich off small businesses was never the point.',
          'I worked in IT for more than 30 years, in the corporate world and for myself, and most of that time was spent helping people: training, support, service. When I retired, that didn’t stop. I still wanted to help.',
          'So I named the business Bohdi. Bodhi means awakening. To me, it means empowering: the moment someone realizes they can do the thing they were sure they couldn’t. The Bohdi Way is built on that. I make the hard parts easy, and you own everything.',
          'I’ve watched too many makers and small crews get quoted thousands of dollars for a website, then pay again every time they need a change. That money should be going into their business, not mine. In empowering others, all of us are enriched.',
        ],
      },
      {
        id: 'cheap-not-good',
        q: 'Does cheap mean it isn’t as good?',
        a: [
          'No. Every site is built around your own work and your own photos, in a design made to show them off. You can see every look on a real shop on the looks page, and read what Sheri, Chris and Penny say about the sites I made for them.',
          'What you’re not paying for is a big agency’s overhead, or a template you have to wrestle with every night.',
        ],
      },
    ],
  },
  {
    title: 'Getting started',
    items: [
      {
        id: 'how-it-works',
        q: 'How does it work?',
        a: [
          'Makers pick a plan and fill in the short form: what you make, 5 to 10 pieces with a photo of each, a little about you, and the mood you like. Your site is built from it and stays private until you press Publish in your own backend.',
          'A service business picks a plan or just sends me a message. We talk about your business, I build the site, and you see the real thing before it goes live. We change whatever isn’t right, then it goes up.',
        ],
      },
      {
        id: 'what-to-have-ready',
        q: 'What do I need to have ready?',
        a: [
          'Not much. Makers need 5 to 10 of their pieces with a photo of each (phone photos are fine), a few sentences about themselves and their work, and their Facebook or Instagram if they have them. A photo of you is welcome, not required.',
          'A service business needs its logo if it has one, some photos of the work, a few sentences about what you do, and your Facebook or Instagram if you have them. If you don’t have something, we figure it out together.',
        ],
      },
      {
        id: 'how-long',
        q: 'How long does it take?',
        a: [
          'A maker’s site is built from the form, usually the same day you send it.',
          'Most service sites on a plan are ready in 2 to 5 days. A custom site takes longer, and we’ll agree on the timing before I start.',
        ],
      },
    ],
  },
  {
    title: 'Prices and billing',
    items: [
      {
        id: 'built-free',
        q: 'What does “built free” mean?',
        a: [
          `For a service business, it means there’s no build fee. You don’t pay thousands up front. You pay the monthly price for your plan, starting at ${p('contractor-lite')} a month, and that’s it.`,
          `Makers have no build fee either: you pay your plan’s monthly price, starting at ${p('maker-showcase')} a month, from the day you sign up.`,
        ],
      },
      {
        id: 'when-billing-starts',
        q: 'When does billing start?',
        a: [
          'Makers pay from the day they sign up on the form.',
          'For a service business, billing starts the day your site goes live. You don’t pay anything while I’m building it.',
        ],
      },
      {
        id: 'monthly-or-yearly',
        q: 'Monthly or yearly? Can I switch?',
        a: [
          `Either. Yearly works out to about two months free (${p('maker-lite', 'yearly')} a year instead of ${p('maker-lite')} a month on Maker Market). You can switch any time, and your bill is adjusted for the time you’ve already paid for.`,
        ],
      },
      {
        id: 'other-fees',
        q: 'Are there any other fees? Do you take a cut of my sales?',
        a: [
          'No, and never. Your customers pay you directly, through your own Stripe or Square account. The only fee on a sale is your payment company’s normal card fee, the same one you’d pay anywhere.',
        ],
      },
    ],
  },
  {
    title: 'Your site',
    items: [
      {
        id: 'who-owns-it',
        q: 'Who owns my site, my customers and my money?',
        a: [
          'You do. Your words, your photos, your customer list and every dollar you earn are yours. I never sell your data, and I never lock you in.',
        ],
      },
      {
        id: 'fix-or-addition',
        q: 'What’s a fix, and what’s an addition?',
        a: [
          'A fix is something that isn’t working the way it should: a broken link, a page that looks wrong on a phone. Fixes are always on me, free.',
          'An addition is something new: a new page, a new section, a feature your plan doesn’t include. Additions are priced separately, or they come with moving up a plan. Makers keep their own words, photos, products and dates current themselves, any time, from their own backend.',
        ],
      },
      {
        id: 'own-domain',
        q: 'Can I use my own domain, like yourshop.com?',
        a: [
          'Yes. I connect it for you. If you don’t own one yet, buy it from Cloudflare: they sell domains at cost, with no markup, and it stays in your name. I don’t get anything for sending you there.',
        ],
        link: { href: 'https://www.cloudflare.com/products/registrar/', label: 'Cloudflare domains ↗' },
      },
    ],
  },
  {
    title: 'Changing plans or leaving',
    items: [
      {
        id: 'upgrade',
        q: 'Can I move up a plan?',
        a: [
          'Any time, from Showcase to Maker Market or from Maker Market to Full, and it happens right away. There’s nothing to pay up front: your bill is prorated, so you only pay the difference for the rest of your current billing period, then the new price from then on. Everything you’ve already added comes with you.',
          'On a yearly plan you can switch to monthly when you move up. The unused part of your year becomes credit that pays your next months until it runs out.',
        ],
      },
      {
        id: 'downgrade',
        q: 'Can I move down a plan?',
        a: [
          'Yes. Plenty of makers are seasonal, so moving down for the quiet months is better than leaving. The change starts at your next renewal, and you keep everything you have until then. Nothing already paid is refunded.',
          'Nothing is deleted when you move down. Your products, photos and dates are put away, not removed, and they all come back when you move up again. Moving to Showcase, you pick up to 12 of your products to show on your one page.',
        ],
      },
      {
        id: 'cancel',
        q: 'What happens if I cancel?',
        a: [
          'Your site comes down at the end of what you’ve paid for. If you’re a maker heading into a quiet season, you can move to Showcase instead and keep a simple page up at the lowest price. It’s your choice, never automatic.',
        ],
      },
      {
        id: 'contract',
        q: 'Is there a contract?',
        a: ['No. Pay monthly or yearly, and stop whenever you want.'],
      },
    ],
  },
  {
    title: 'For makers',
    items: [
      {
        id: 'must-sell-online',
        q: 'Do I have to sell online?',
        a: [
          'No. Maker Market is made for makers who sell in person: your site shows what you make, with prices, and people can ask about anything with one tap. When you’re ready to sell online, move up to Full.',
        ],
      },
      {
        id: 'point-of-sale',
        q: 'What does the point of sale do?',
        a: [
          'It runs on your phone at markets. Tap what someone’s buying, and it adds up the sale and shows your Venmo or Cash App code for them to scan. Every sale is kept, tagged to the market it happened at, so you can see which markets actually made money after the booth fee and gas.',
          'On Full it also takes cards through your own Stripe or Square.',
        ],
      },
    ],
  },
  {
    title: 'For contractors',
    items: [
      {
        id: 'estimate-requests',
        q: 'Where do estimate requests go?',
        a: [
          'Straight to you, with the customer’s photos of the job attached. On Contractor Full they also land in your own inbox on the site, where you can track each one from request to won.',
        ],
      },
      {
        id: 'pay-for-leads',
        q: 'Do I have to pay for leads?',
        a: [
          'Never. Every request that comes through your site is yours alone. Nobody else gets it, and you don’t pay a cent per lead.',
        ],
      },
    ],
  },
  {
    title: 'Something different',
    items: [
      {
        id: 'custom',
        q: 'What if I need something the plans don’t cover?',
        a: [
          'Then we talk about a custom site. That’s anything beyond what the plans include: a special layout, a feature no plan has, or a site that lives somewhere other than here. Custom sites are quoted separately, after we’ve talked about what you need.',
        ],
      },
    ],
  },
];

/** Each pricing page's three most-asked questions, shown under its comparison. */
export const TOP_QUESTIONS: Record<Audience, readonly [string, string, string]> = {
  maker: ['why-so-low', 'must-sell-online', 'other-fees'],
  contractor: ['why-so-low', 'pay-for-leads', 'when-billing-starts'],
};

export function allFaqItems(): readonly FaqItem[] {
  return FAQ_GROUPS.flatMap((g) => g.items);
}

export function faqItem(id: string): FaqItem {
  const item = allFaqItems().find((i) => i.id === id);
  if (item === undefined) throw new Error(`Unknown FAQ question ${id}`);
  return item;
}

/** schema.org FAQPage data for the /faq page. */
export function faqJsonLd(): {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: ReadonlyArray<{ '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }>;
} {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqItems().map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a.join('\n\n') },
    })),
  };
}
