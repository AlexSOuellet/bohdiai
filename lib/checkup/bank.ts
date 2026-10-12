import type { Answer, AskedQuestion, QuestionKind, Turn } from './transcript';

/**
 * Every question the checkup can ask after the opening, word for word
 * (Project-Docs/Checkup-Question-Bank.md). The model only chooses which one
 * comes next and writes the short reaction line above it; it can't change the
 * wording or the choices.
 */

export interface BankQuestion {
  readonly id: string;
  readonly kind: QuestionKind;
  readonly prompt: string;
  readonly aside?: string;
  readonly options?: readonly string[];
  /** Choices come from the visitor's own picks on another question. */
  readonly optionsFrom?: string;
  /** False hides the "Something else, or anything to add" line. Default true for tap questions. */
  readonly note?: boolean;
  readonly placeholder?: string;
  readonly optional?: boolean;
  /** Code rule: may this be asked, given the answers so far? */
  readonly when?: (t: Turns) => boolean;
  /** Code rule: must this be answered before the checkup can finish (when it applies)? */
  readonly must?: boolean | ((t: Turns) => boolean);
  /** A plain hint for the model about when this question is most useful. */
  readonly hint?: string;
}

/** Reads answers by question id. */
export class Turns {
  constructor(readonly list: readonly Turn[]) {}

  answer(id: string): Answer | undefined {
    return this.list.find((t) => t.question.id === id)?.answer;
  }

  asked(id: string): boolean {
    return this.list.some((t) => t.question.id === id);
  }

  /** True when the visitor picked `option` on question `id` (with or without a typed note). */
  chose(id: string, option: string): boolean {
    const a = this.answer(id);
    if (a === undefined) return false;
    if (typeof a === 'string') return a === option || a.startsWith(`${option} (also:`);
    return a.includes(option);
  }

  /** How many listed choices they picked on a pick-all question. */
  picks(id: string, options: readonly string[]): string[] {
    const a = this.answer(id);
    if (a === undefined) return [];
    const list = typeof a === 'string' ? [a] : a;
    return options.filter((o) => list.includes(o) || list.some((v) => v.startsWith(`${o} (also:`)));
  }
}

// ---------------------------------------------------------------------------
// Reading the answers

export const GOALS = {
  cover: 'Pay for itself, maybe a little extra',
  test: 'Bring in real money, so I can see if this could be more',
  business: 'Become a real business',
} as const;

const NOT_SOLD = 'I haven’t sold anything yet';

export const SOURCES = [
  'Friends and family',
  'Friends of friends',
  'Craft shows and markets',
  'Etsy',
  'Facebook Marketplace',
  'Facebook buy/sell or local groups',
  'My own Facebook business page',
  'Instagram or TikTok',
  'My own website',
  'Local shops',
] as const;

const goalIs = (g: keyof typeof GOALS) => (t: Turns): boolean => t.chose('goal', GOALS[g]);
const growing = (t: Turns): boolean => goalIs('test')(t) || goalIs('business')(t);
const sold = (t: Turns): boolean => t.asked('stage') && !t.chose('stage', NOT_SOLD);
const notSold = (t: Turns): boolean => t.chose('stage', NOT_SOLD);
const source = (s: string) => (t: Turns): boolean => t.chose('sources', s);
const atMarkets = (t: Turns): boolean =>
  source('Craft shows and markets')(t) || t.chose('first_place', 'A local market or craft fair');
const inPerson = (t: Turns): boolean => atMarkets(t) || source('Local shops')(t);
const hasPageOrAccount = (t: Turns): boolean =>
  source('My own Facebook business page')(t) || source('Instagram or TikTok')(t);
const hasSite = source('My own website');
const openToOnline = (t: Turns): boolean =>
  t.chose('where', 'A mix of in person and online') ||
  t.chose('where', 'Mostly online') ||
  t.chose('where', 'I’m not sure yet');

// ---------------------------------------------------------------------------
// The bank

export const BANK: readonly BankQuestion[] = [
  // Where they are
  {
    id: 'stage',
    kind: 'single',
    prompt: 'Where are you with selling right now?',
    options: [
      NOT_SOLD,
      'I’ve sold a few, mostly to people I know',
      'I’ve sold a few, mostly to strangers',
      'I sell fairly regularly',
      'I’m busy and struggling to keep up',
    ],
    must: true,
    hint: 'Ask first, right after the opening.',
  },
  {
    id: 'ready',
    kind: 'single',
    prompt: 'How many finished pieces do you have ready to sell?',
    options: ['Just a few', 'Enough for a small table', 'Plenty', 'I’m still building up'],
    when: notSold,
  },
  {
    id: 'first_place',
    kind: 'multi',
    prompt: 'Where would you feel most comfortable trying your first sales?',
    options: [
      'A local market or craft fair',
      'Friends and family',
      'Facebook Marketplace',
      'Etsy',
      'A local shop',
      'I’m not sure yet',
    ],
    when: notSold,
    must: notSold,
  },

  // Where sales come from
  {
    id: 'sources',
    kind: 'multi',
    prompt: 'Where have your sales come from so far?',
    options: SOURCES,
    when: sold,
    must: sold,
  },
  {
    id: 'best_source',
    kind: 'single',
    prompt: 'Which of those has brought in the most sales?',
    optionsFrom: 'sources',
    when: (t) => t.picks('sources', SOURCES).length >= 2,
    must: (t) => t.picks('sources', SOURCES).length >= 2,
    hint: 'Ask right after sources when they picked more than one.',
  },
  {
    id: 'word_back',
    kind: 'multi',
    prompt: 'What happens with the people you know who’ve bought?',
    options: ['Some come back for more', 'They send friends my way', 'They buy pieces as gifts', 'Mostly it’s been one-time'],
    when: (t) => source('Friends and family')(t) || source('Friends of friends')(t),
  },

  // Markets
  {
    id: 'market_kinds',
    kind: 'multi',
    prompt: 'What kinds of shows or markets do you sell at?',
    options: [
      'Big, busy craft shows',
      'Small local markets',
      'Farmers markets',
      'Holiday bazaars and church or school sales',
      'Pop-ups with other makers',
    ],
    when: source('Craft shows and markets'),
  },
  {
    id: 'market_often',
    kind: 'single',
    prompt: 'How often do you do a market?',
    options: ['Most weekends', 'A couple of times a month', 'About once a month', 'A few times a year'],
    when: source('Craft shows and markets'),
    // Decides whether the write-up leads with the market site or the showcase.
    must: source('Craft shows and markets'),
  },
  {
    id: 'market_table',
    kind: 'multi',
    prompt: 'When people stop at your table, what usually happens?',
    options: [
      'They say they’ve never seen anything like it',
      'They love it but walk on',
      'They hesitate at the price',
      'They buy on the spot',
      'They ask about custom pieces',
      'They ask where else they can find my work',
    ],
    when: source('Craft shows and markets'),
  },
  {
    id: 'cards',
    kind: 'single',
    prompt: 'Do you hand out business cards at your markets?',
    options: [
      'Yes, to everyone who stops',
      'Only when someone asks',
      'I have some, but I forget to put them out',
      'I don’t have cards yet',
    ],
    when: source('Craft shows and markets'),
    must: source('Craft shows and markets'),
  },
  {
    id: 'found_again',
    kind: 'single',
    prompt: 'If someone loves your work but doesn’t buy, how could they find you later?',
    options: [
      'They couldn’t, unless they asked my name',
      'Only through my personal Facebook',
      'I have a business page or account for my making',
      'I have a website',
      'My card sends them somewhere',
    ],
    when: inPerson,
    must: inPerson,
  },
  {
    id: 'market_judge',
    kind: 'multi',
    prompt: 'How do you decide if a market was worth it?',
    options: [
      'What’s left after the table fee and materials',
      'How many people stopped',
      'How the day felt',
      'Whether I sold out',
    ],
    when: source('Craft shows and markets'),
  },
  {
    id: 'market_hard',
    kind: 'multi',
    prompt: 'What’s hardest about your markets?',
    options: [
      'Slow crowds',
      'Booth fees eat the profit',
      'Lots of similar work nearby',
      'People browse but don’t buy',
      'Setting up and tearing down wears me out',
      'Lines get long when it’s busy',
    ],
    when: source('Craft shows and markets'),
  },
  {
    id: 'market_pay',
    kind: 'multi',
    prompt: 'How do people pay you at markets?',
    options: ['Cash', 'Venmo, Cash App or Zelle', 'A card reader like Square', 'I add it up by hand first'],
    when: source('Craft shows and markets'),
  },

  // Etsy
  {
    id: 'etsy_sales',
    kind: 'single',
    prompt: 'How much of your selling happens on Etsy?',
    options: ['Most of it', 'Some', 'Hardly any', 'None yet'],
    when: source('Etsy'),
  },
  {
    id: 'etsy_listings',
    kind: 'single',
    prompt: 'How many listings are in your Etsy shop?',
    options: ['Under 10', '10 to 30', '30 to 100', 'Over 100'],
    when: source('Etsy'),
  },
  {
    id: 'etsy_why',
    kind: 'multi',
    prompt: 'Why do you think Etsy isn’t selling more for you?',
    options: ['It’s too crowded', 'People can’t find my shop', 'My prices', 'My photos', 'I honestly don’t know'],
    when: (t) => source('Etsy')(t) && t.asked('etsy_sales') && !t.chose('etsy_sales', 'Most of it'),
  },
  {
    id: 'etsy_promote',
    kind: 'multi',
    prompt: 'What do you do to send people to your Etsy shop?',
    options: ['Post about it on social media', 'Put it on my cards', 'Pay for Etsy ads', 'Nothing yet'],
    when: source('Etsy'),
  },

  // Marketplace and groups
  {
    id: 'marketplace_how',
    kind: 'single',
    prompt: 'How is Facebook Marketplace or local groups working for you?',
    options: ['Steady sales', 'A sale now and then', 'Lots of questions, few sales', 'Hardly anything'],
    when: (t) => source('Facebook Marketplace')(t) || source('Facebook buy/sell or local groups')(t),
  },

  // Page or account
  {
    id: 'social_how',
    kind: 'multi',
    prompt: 'How is your page or account doing for you?',
    options: [
      'It brings in sales',
      'Mostly friends and family follow it',
      'I post but hear nothing back',
      'I don’t post much',
    ],
    when: hasPageOrAccount,
  },
  {
    id: 'post_often',
    kind: 'single',
    prompt: 'How often do you post about your work?',
    options: ['A few times a week', 'About once a week', 'Now and then', 'Hardly ever'],
    when: hasPageOrAccount,
  },

  // Website
  {
    id: 'site_built',
    kind: 'single',
    prompt: 'What is your website built on?',
    options: ['Shopify', 'Wix', 'Squarespace', 'Someone built it for me', 'I’m not sure'],
    when: hasSite,
  },
  {
    id: 'site_cost',
    kind: 'single',
    prompt: 'What does your website cost you each month, all in?',
    options: ['Under $20', '$20 to $50', '$50 to $100', 'Over $100', 'I’m not sure'],
    when: hasSite,
  },
  {
    id: 'site_sales',
    kind: 'single',
    prompt: 'How much does your website sell for you?',
    options: ['Most of my sales', 'Some', 'Hardly any'],
    when: hasSite,
  },
  {
    id: 'site_send',
    kind: 'single',
    prompt: 'Do you send people to your website?',
    options: ['Every chance I get', 'Sometimes', 'Not really'],
    when: hasSite,
  },
  {
    id: 'site_complaint',
    kind: 'multi',
    prompt: 'What bothers you most about your website?',
    options: [
      'It costs too much for what it brings in',
      'Nobody visits',
      'It’s hard to update',
      'It looks dated',
      'I can’t tell if it’s working',
    ],
    when: hasSite,
  },

  // Local shops
  {
    id: 'shop_terms',
    kind: 'single',
    prompt: 'How do the shops carry your work?',
    options: ['Consignment: they pay me when it sells', 'They buy it from me up front', 'I’m not sure of the terms'],
    when: source('Local shops'),
  },

  // Money
  {
    id: 'covers',
    kind: 'single',
    prompt: 'Do your sales cover what you spend on supplies?',
    options: ['Yes, with a bit left over', 'About even', 'Not yet', 'I haven’t kept track'],
    when: (t) => goalIs('cover')(t) && sold(t),
    must: (t) => goalIs('cover')(t) && sold(t),
  },
  {
    id: 'charge',
    kind: 'text',
    prompt: 'What do you usually charge for a typical piece?',
    aside: 'A rough number is fine. If you make a few kinds of things, name a couple.',
    placeholder: 'About…',
    when: sold,
  },
  {
    id: 'left_over',
    kind: 'single',
    prompt: 'On a typical piece, about how much is left after supplies?',
    options: ['Less than $5', '$5 to $15', '$15 to $30', 'More than $30', 'I’ve never worked it out'],
    when: (t) => growing(t) && sold(t),
    must: (t) => growing(t) && sold(t),
  },
  {
    id: 'price_how',
    kind: 'multi',
    prompt: 'How did you come up with your prices?',
    options: [
      'I looked at what others charge',
      'Supplies plus a bit',
      'What felt right',
      'Friends told me what to charge',
      'I price low so it sells',
      'I feel funny charging more',
    ],
    when: sold,
  },
  {
    id: 'time_paid',
    kind: 'single',
    prompt: 'Do your prices pay you for your time?',
    options: ['Yes, I count my hours', 'Partly', 'No, mostly just the materials', 'I’ve never thought about it'],
    when: (t) => goalIs('business')(t) && sold(t),
  },

  // What they make
  {
    id: 'standout',
    kind: 'text',
    prompt: 'What makes your work different from others who make similar things?',
    aside: 'Say it the way you would to someone at your table.',
    placeholder: 'What people notice…',
    must: true,
  },
  {
    id: 'repeat',
    kind: 'single',
    prompt: 'Can you make the same piece again?',
    options: ['Yes, the same thing over and over', 'Similar, but never identical', 'Every piece is one of a kind'],
  },
  {
    id: 'custom',
    kind: 'single',
    prompt: 'Do you take custom orders?',
    options: ['Yes, fairly often', 'Once in a while', 'I’ve been asked, but haven’t said yes', 'I haven’t offered them'],
  },
  {
    id: 'custom_block',
    kind: 'multi',
    prompt: 'What’s kept you from saying yes to custom orders?',
    options: [
      'I don’t know what to charge',
      'I worry I can’t match what they picture',
      'Time',
      'I’m not sure how to take a deposit',
    ],
    when: (t) => t.chose('custom', 'I’ve been asked, but haven’t said yes'),
  },

  // Direction
  {
    id: 'where',
    kind: 'single',
    prompt: 'Down the road, where would you like most of your selling to happen?',
    options: ['Mostly in person, at markets and locally', 'A mix of in person and online', 'Mostly online', 'I’m not sure yet'],
    when: growing,
    must: growing,
  },
  {
    id: 'shipping',
    kind: 'single',
    prompt: 'How do you feel about shipping your pieces?',
    options: [
      'I’m fine with it, I’d work out the packing',
      'Small or sturdy pieces, but not fragile ones',
      'I worry about the cost and breakage',
      'I’d rather not ship at all',
      'I’ve never tried, so I’m not sure',
    ],
    when: (t) => growing(t) && openToOnline(t),
    must: (t) => growing(t) && openToOnline(t),
  },
  {
    id: 'next',
    kind: 'multi',
    prompt: 'What would you most like to try next?',
    options: [
      'A bigger, busier show',
      'More of the small markets near me',
      'Selling on Etsy',
      'Getting my work into a local shop',
      'Taking custom orders',
      'A place online where people can see my work',
      'Teaching a class',
    ],
    when: growing,
    must: growing,
  },
  {
    id: 'hours',
    kind: 'single',
    prompt: 'How many hours a week can you really give this?',
    aside: 'Making, selling, posting, all of it.',
    options: ['Under 5', '5 to 10', '10 to 20', 'More than 20'],
    when: growing,
  },
  {
    id: 'keep_up',
    kind: 'single',
    prompt: 'If your orders doubled tomorrow, could you keep up?',
    options: ['Easily', 'Barely', 'No way'],
    when: goalIs('business'),
  },
  {
    id: 'setup',
    kind: 'single',
    prompt: 'Are you set up officially, registered and collecting sales tax?',
    options: ['Yes', 'Partly', 'Not yet'],
    when: goalIs('business'),
  },
  {
    id: 'invest',
    kind: 'single',
    prompt: 'Are you willing to spend money up front to grow?',
    options: ['Nothing right now', 'A little', 'Real money, if it makes sense'],
    when: goalIs('business'),
  },

  // Comfort and help
  {
    id: 'tech',
    kind: 'single',
    prompt: 'How do you feel about the tech side, computers and apps?',
    options: ['Comfortable', 'I get by', 'I struggle with it'],
  },
  {
    id: 'camera',
    kind: 'single',
    prompt: 'How do you feel about showing your face or your hands at work on video?',
    options: ['Happy to', 'I’d try it', 'No thanks'],
    hint: 'Only when they are heading toward social media, or you may suggest videos.',
  },
  {
    id: 'posting',
    kind: 'single',
    prompt: 'Could you post about your work regularly?',
    options: ['Yes, I can do that', 'If I remember', 'Not really my thing'],
    hint: 'Only when they are heading toward social media or a page.',
  },
  {
    id: 'help',
    kind: 'single',
    prompt: 'Who helps you most with your making business?',
    options: ['My partner', 'Family who are good with phones', 'A friend', 'It’s just me'],
  },
  {
    id: 'held',
    kind: 'multi',
    prompt: 'What’s held you back the most?',
    options: [
      'Not knowing how to price',
      'Too much competition',
      'Not knowing how to start',
      'Time',
      'The tech side',
      'Confidence in my work',
      'Money to get going',
    ],
    must: true,
  },
];

const byId = new Map(BANK.map((q) => [q.id, q]));

export function bankQuestion(id: string): BankQuestion | undefined {
  return byId.get(id);
}

function applies(q: BankQuestion, t: Turns): boolean {
  return q.when === undefined || q.when(t);
}

function required(q: BankQuestion, t: Turns): boolean {
  return typeof q.must === 'function' ? q.must(t) : q.must === true;
}

/** Questions that may come next: not asked yet, and their rule allows them now. */
export function available(turns: readonly Turn[]): BankQuestion[] {
  const t = new Turns(turns);
  return BANK.filter((q) => !t.asked(q.id) && applies(q, t));
}

/** Must-cover questions that apply and still haven't been answered. */
export function missingMust(turns: readonly Turn[]): BankQuestion[] {
  const t = new Turns(turns);
  return BANK.filter((q) => !t.asked(q.id) && applies(q, t) && required(q, t));
}

/** The model's reaction line as plain text: no markup, one short line. */
export function cleanBridge(bridge: string): string {
  return bridge.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
}

/** The bank question as the visitor sees it, with the model's reaction line on top. */
export function toAsked(q: BankQuestion, turns: readonly Turn[], bridge: string): AskedQuestion {
  const t = new Turns(turns);
  const options = q.optionsFrom !== undefined ? t.picks(q.optionsFrom, SOURCES) : (q.options ?? []);
  return {
    id: q.id,
    kind: q.kind,
    bridge: cleanBridge(bridge),
    prompt: q.prompt,
    aside: q.aside ?? (q.kind === 'multi' ? 'Pick every one that applies.' : ''),
    options,
    allowOther: q.kind !== 'text' && q.note !== false,
    placeholder: q.placeholder ?? '',
    optional: q.optional === true,
  };
}

/** The bank as the model reads it: id, wording, choices, and when it fits. */
export function bankText(): string {
  return BANK.map((q) => {
    const choices = q.optionsFrom !== undefined ? `(their picks from ${q.optionsFrom})` : (q.options ?? []).join(' | ');
    return `- ${q.id} [${q.kind}] ${q.prompt}${choices !== '' ? `\n    choices: ${choices}` : ''}${q.hint !== undefined ? `\n    note: ${q.hint}` : ''}`;
  }).join('\n');
}
