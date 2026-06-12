import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { writeCopy, buildCopywriterPrompt } from './copywriter';
import { CopywriterDraftSchema } from './copywriter-schema';
import type { Trajectory } from './trajectory';
import type { CrewBrief } from './types';

const brief: CrewBrief = {
  shopName: 'Tannery Row',
  nicheDisplayName: 'Leatherworker',
  nicheBody: 'People buy leather goods that outlast them and carry a story.',
  moodLabel: 'Rustic',
  moodDescription: 'warm and worn',
  productCount: 3,
  moodKey: 'rustic',
};

const trajectory: Trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them, not another that wears out',
  visualWorld: 'warm and worn, low light, deep shadow, rich texture',
  momentConcept: 'a hand resting on a worn bench, dust drifting in a slow shaft of light',
  register: 'restrained',
  momentKind: 'video',
};

// The dice the pipeline deals the copywriter. Matches the draft below so the
// existing assertions see unchanged behavior; the roll test below uses its own.
const rolls = { goods: 'procession', founder: 'quote' } as const;

// A minimal valid words-only draft (no image prompts; treatments chosen).
const draft = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: [{ label: 'Shop', target: 'shop' }, { label: 'Our story', target: 'about' }] },
  moment: {
    story: ['Built by hand', 'Made to outlast you'],
    eyebrow: 'From the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
    ctaTarget: 'goods',
  },
  goods: { title: 'The bench', treatment: 'procession' },
  founder: {
    quote: 'I would rather make one belt that lasts thirty years than ten that fall apart.',
    attribution: 'Sam, founder',
    treatment: 'quote',
  },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours', ctaTarget: 'contact' },
  about: {
    heading: 'The story',
    story: [
      'We started at a single bench with a knife and more patience than sense, and that has not changed much.',
      'Everything here is meant to be used hard and handed down, the way good things always were.',
    ],
  },
  contact: { heading: 'Say hello', intro: 'We read everything that comes in and we would love to hear what you are looking for.' },
  products: [
    { name: 'Belt', slug: 'belt', shortDescription: 'A belt for life', description: 'A belt that ages with you and never lets go.', basePriceCents: 9800 },
    { name: 'Wallet', slug: 'wallet', shortDescription: 'An everyday bifold', description: 'A bifold that gets better the longer you carry it.', basePriceCents: 6800 },
    { name: 'Tote', slug: 'tote', shortDescription: 'A roomy tote', description: 'A tote that carries the week and softens with it.', basePriceCents: 22000 },
  ],
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_copy', name: 'submit_copy', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('writeCopy (the Copywriter)', () => {
  it('returns the validated words-only draft from a valid first call', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(d.shopName).toBe('Tannery Row');
    expect(d.goods.treatment).toBe('procession');
    expect(d.founder.treatment).toBe('quote');
    expect(d.products).toHaveLength(3);
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('puts the trajectory in the prompt and forces the tool', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory, rolls);
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    expect(args.system).toContain(trajectory.feeling);
    expect(args.system).toContain(trajectory.customerWhy);
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'submit_copy' });
  });

  it('rejects a story line with punctuation, then accepts the fix', async () => {
    const bad = { ...draft, moment: { ...draft.moment, story: ['Flour. Water. Salt.', 'Time'] } };
    create.mockResolvedValueOnce(toolMsg(bad)).mockResolvedValueOnce(toolMsg(draft));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(d.moment.story).toEqual(['Built by hand', 'Made to outlast you']);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('punctuation');
  });

  it('tells the copywriter its actual length when a still-capped field overflows, then accepts the fix', async () => {
    // shortDescription stays capped (it's a card line where length is structural);
    // body prose is uncapped, so the feedback path is tested on a capped field.
    const longShort = 'x'.repeat(120); // over the 90 cap on shortDescription
    const over = { ...draft, products: [{ ...draft.products[0], shortDescription: longShort }, draft.products[1], draft.products[2]] };
    create.mockResolvedValueOnce(toolMsg(over)).mockResolvedValueOnce(toolMsg(draft));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(d.products[0]!.shortDescription).toBe(draft.products[0]!.shortDescription);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    const last = JSON.stringify(second.messages.at(-1));
    expect(last).toContain('products.0.shortDescription');
    // the actionable part: the model is told its real length (120), not just the cap
    expect(last).toContain('120');
  });

  it('throws when no valid copy is produced within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ ...draft, shopName: 'x' })); // too short
    await expect(writeCopy(brief, trajectory, rolls)).rejects.toThrow(/valid copy/);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'done' }], stop_reason: 'end_turn' });
    await expect(writeCopy(brief, trajectory, rolls)).rejects.toThrow(/did not call submit_copy/);
  });

  it('instructs the copywriter to author each link target from the real pages', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory, rolls);
    const args = create.mock.calls[0]![0] as { system: string };
    expect(args.system).toContain('target');
    // names the real pages the crew can point at
    expect(args.system).toMatch(/shop.*about.*events.*contact/s);
  });

  it('tells the copywriter headlines carry no sentence punctuation', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory, rolls);
    const args = create.mock.calls[0]![0] as { system: string };
    expect(args.system.toLowerCase()).toContain('headline');
    expect(args.system.toLowerCase()).toMatch(/no period|not a sentence|no sentence punctuation/);
  });

  it('deals the rolled treatments to the copywriter as a draw it can override', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory, { goods: 'slideshow', founder: 'card' });
    const args = create.mock.calls[0]![0] as { system: string };
    // the goods and About beats arrive with a starting treatment dealt by code...
    expect(args.system).toContain('you drew "slideshow"');
    expect(args.system).toContain('you drew "card"');
    // ...which Bohdi plays unless it truly fights the shop — he keeps the veto.
    expect(args.system).toContain('unless it genuinely fights');
  });
});

describe('buildCopywriterPrompt — momentKind branches the story directive', () => {
  it('prompt directs a multi-line story when trajectory.momentKind is video', () => {
    const t = { ...trajectory, momentKind: 'video' as const };
    const prompt = buildCopywriterPrompt(brief, t, rolls);
    expect(prompt).toContain('2-4 lines');
  });

  it('prompt directs ONE tagline in moment.story when trajectory.momentKind is spotlight', () => {
    const t = { ...trajectory, momentKind: 'spotlight' as const };
    const prompt = buildCopywriterPrompt(brief, t, rolls);
    expect(prompt).toContain('EXACTLY 1 line');
    expect(prompt).toContain('only entry in moment.story');
  });
});

describe('CopywriterDraftSchema — spotlight tagline: single-line moment.story', () => {
  it('accepts a single-line moment.story (spotlight tagline)', () => {
    const d = { ...draft, moment: { ...draft.moment, story: ['One brave line that lands the brand'] } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
  });
});

describe('CopywriterDraftSchema — body prose has no hard cap (the design absorbs any length)', () => {
  it('accepts a long description, quote, about paragraph, and contact intro', () => {
    const d = {
      ...draft,
      founder: { ...draft.founder, quote: 'It ages with you and never lets go. '.repeat(30) },
      about: { heading: 'The story', story: ['We started at a single bench. '.repeat(60), 'Everything is made to last. '.repeat(60)] },
      contact: { heading: 'Say hello', intro: 'We read everything that comes in. '.repeat(40) },
      products: [{ ...draft.products[0], description: 'A belt that ages with you. '.repeat(80) }, draft.products[1], draft.products[2]],
    };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
  });
});

describe('CopywriterDraftSchema — headlines carry no sentence punctuation', () => {
  it('rejects a heading written as periods-between-phrases (the AI-slop pattern)', () => {
    const d = { ...draft, about: { ...draft.about, heading: 'One potter. One wheel. One kiln at a time.' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(false);
  });

  it('rejects a headline that ends in terminal punctuation', () => {
    const d = { ...draft, close: { ...draft.close, headline: 'Built to outlast us.' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(false);
  });

  it('accepts a clean heading and allows internal commas and intra-word hyphens', () => {
    const d = { ...draft, about: { ...draft.about, heading: 'Wheel-thrown, kiln-fired, made to last' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
  });
});

describe('copywriter prompt — founder-attribution name lock', () => {
  const baseBrief: CrewBrief = {
    shopName: 'Sawdust & Stone',
    nicheDisplayName: 'Woodworker',
    nicheBody: 'A small niche body for testing.',
    moodLabel: 'Rustic',
    moodDescription: 'Warm timber and morning light.',
    productCount: 5,
    makerName: 'Wally',
    moodKey: 'rustic',
  };

  const t: Trajectory = {
    feeling: 'a quiet workshop',
    customerWhy: 'they want a piece that lasts',
    visualWorld: 'morning light, warm timber',
    momentConcept: 'hands at the bench',
    register: 'restrained',
    momentKind: 'video',
  };

  const r = { goods: 'marquee', founder: 'quote' } as const;

  it("passes the maker's first name into the prompt and locks founder.attribution to it", () => {
    const prompt = buildCopywriterPrompt(baseBrief, t, r);
    expect(prompt).toContain('Wally');
    expect(prompt).toMatch(/founder\.attribution[^\n]*Wally/);
    expect(prompt).toMatch(/do not invent/i);
  });

  it("when makerName is undefined, instructs a generic attribution rather than inventing", () => {
    const briefNoName: CrewBrief = { ...baseBrief, makerName: undefined };
    const prompt = buildCopywriterPrompt(briefNoName, t, r);
    expect(prompt).not.toMatch(/founder\.attribution[^\n]*Wally/);
    expect(prompt).toMatch(/maker'?s first name was not captured/i);
  });
});

describe('copywriter prompt — visionPerPhoto and flat catalog', () => {
  const baseBrief: CrewBrief = {
    shopName: 'Sawdust & Stone',
    nicheDisplayName: 'Woodworker',
    nicheBody: 'A small niche body for testing.',
    moodLabel: 'Rustic',
    moodDescription: 'Warm timber and morning light.',
    productCount: 5,
    makerName: 'Wally',
    moodKey: 'rustic',
  };

  it('targets exactly 5 products regardless of brief.productCount', () => {
    const b: CrewBrief = { ...baseBrief, productCount: 20 };
    const prompt = buildCopywriterPrompt(b, trajectory, rolls);
    expect(prompt).toMatch(/write 5/i);
  });

  it("threads per-photo Vision suggestions as starting hands for products 1..N", () => {
    const b: CrewBrief = {
      ...baseBrief,
      visionPerPhoto: [
        { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
        { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'a sign', suggestedDescription: 'A small carved sign.', suggestedPriceCents: 3200 },
      ],
    };
    const prompt = buildCopywriterPrompt(b, trajectory, rolls);
    expect(prompt).toContain("THE MAKER'S WORK");
    expect(prompt).toContain('turned walnut bowl');
    expect(prompt).toContain('small wooden sign');
    expect(prompt).toMatch(/products 1 through 2/i);
    expect(prompt).toMatch(/products 3 through 5.*stand-?ins/i);
  });

  it("omits the maker's-work section when visionPerPhoto is empty/undefined", () => {
    const prompt = buildCopywriterPrompt(baseBrief, trajectory, rolls);
    expect(prompt).not.toContain("THE MAKER'S WORK");
  });
});

describe('CopywriterDraftSchema — authored link targets (D46)', () => {
  it('requires nav items to carry a target page, not bare labels', () => {
    const d = { ...draft, identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(false);
  });

  it('accepts nav authored as { label, target } pairs', () => {
    expect(CopywriterDraftSchema.safeParse(draft).success).toBe(true);
  });

  it('rejects a nav target that is not a real page', () => {
    const d = { ...draft, identity: { wordmark: 'Tannery Row', nav: [{ label: 'Blog', target: 'blog' }, { label: 'Shop', target: 'shop' }] } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(false);
  });

  it('requires a target on the primary hero CTA', () => {
    const m: Record<string, unknown> = { ...draft.moment };
    delete m['ctaTarget'];
    expect(CopywriterDraftSchema.safeParse({ ...draft, moment: m }).success).toBe(false);
  });

  it('requires a target on the close CTA', () => {
    const c: Record<string, unknown> = { ...draft.close };
    delete c['ctaTarget'];
    expect(CopywriterDraftSchema.safeParse({ ...draft, close: c }).success).toBe(false);
  });
});
