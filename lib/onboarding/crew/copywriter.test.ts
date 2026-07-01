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
  heroConcept: 'a hand resting on a worn bench, dust drifting in a slow shaft of light',
  register: 'restrained',
  heroKind: 'video',
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
    sub: 'Hand-cut leather goods built to outlast you',
    ctaLabel: 'See the work',
    ctaTarget: 'shop',
  },
  goods: { title: 'The bench', treatment: 'procession' },
  marquee: { voice: ['Small batch', 'Cut by hand', 'Made to last'] },
  reviews: {
    title: 'Kind words',
    label: 'Loved by customers',
    summary: { score: '4.9 out of 5', count: '200+ happy customers' },
    items: [
      { quote: 'These belts are the real thing and only get better with age.', author: 'Dana R.' },
      { quote: 'Worth every penny and then some.', author: 'Marcus T.', location: 'Providence, RI' },
    ],
  },
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

  it('accepts a story line with punctuation in ONE pass (no retry) — the normalize step strips the bad characters server-side, D53 sharpened', async () => {
    // The build NEVER fails on copy. Punctuation in a story line is no longer
    // a schema rejection; normalize-copy strips it after parse succeeds.
    const punctured = { ...draft, moment: { ...draft.moment, story: ['Flour. Water. Salt.', 'Time'] } };
    create.mockResolvedValueOnce(toolMsg(punctured));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(create).toHaveBeenCalledTimes(1);
    // The forbidden marks are gone; the words remain.
    expect(d.moment.story[0]).toBe('Flour Water Salt');
    expect(d.moment.story[1]).toBe('Time');
  });

  it('accepts a verbose product shortDescription in ONE pass — no length cap anywhere, the build never fails on length', async () => {
    const longShort = 'x'.repeat(220); // would have blown the old 90 cap
    const over = { ...draft, products: [{ ...draft.products[0], shortDescription: longShort }, draft.products[1], draft.products[2]] };
    create.mockResolvedValueOnce(toolMsg(over));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(create).toHaveBeenCalledTimes(1);
    expect(d.products[0]!.shortDescription).toBe(longShort);
  });

  it('accepts a verbose moment story line in ONE pass — story lines have no length cap; the build never fails on length', async () => {
    const longLine = 'x'.repeat(120); // would have blown the old 48 cap
    const over = { ...draft, moment: { ...draft.moment, story: [longLine, draft.moment.story[1]] } };
    create.mockResolvedValueOnce(toolMsg(over));
    const d = await writeCopy(brief, trajectory, rolls);
    expect(create).toHaveBeenCalledTimes(1);
    expect(d.moment.story[0]).toBe(longLine);
  });

  it('still retries on a shape failure (wrong enum, missing required field) — only shape can fail validation now', async () => {
    // A non-real link target is an enum miss — that's shape, not length. Schema rejects.
    const badEnum = { ...draft, moment: { ...draft.moment, ctaTarget: 'newsletter' as unknown as 'shop' } };
    create.mockResolvedValueOnce(toolMsg(badEnum)).mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory, rolls);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('throws when no valid copy is produced within the attempt cap (shape failures only — length never fails)', async () => {
    // Missing required field is a shape failure. Length / punctuation can no
    // longer make this throw — they are normalized away.
    const missing: Record<string, unknown> = { ...draft };
    delete missing['shopName'];
    create.mockResolvedValue(toolMsg(missing));
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

describe('buildCopywriterPrompt — story directive does NOT branch on heroKind (D54 — hero renders the brand block at rest)', () => {
  it('directs 1-4 lines regardless of heroKind (the kind chooses the cinematographer\'s shot, not the copy structure)', () => {
    const videoPrompt = buildCopywriterPrompt(brief, { ...trajectory, heroKind: 'video' as const }, rolls);
    const stillPrompt = buildCopywriterPrompt(brief, { ...trajectory, heroKind: 'still' as const }, rolls);
    expect(videoPrompt).toContain('1-4 lines');
    expect(stillPrompt).toContain('1-4 lines');
    // The old spotlight rise / cross-fade story lifecycle language is gone (D54)
    expect(videoPrompt).not.toMatch(/cross-fading|risen from black|tagline-strength line/i);
    expect(stillPrompt).not.toMatch(/cross-fading|risen from black|tagline-strength line/i);
  });
});

describe('CopywriterDraftSchema — moment.story accepts any length from 1 to 4 lines', () => {
  it('accepts a single-line moment.story', () => {
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

describe('CopywriterDraftSchema — headlines: schema accepts any string, normalize-copy strips sentence punctuation post-parse', () => {
  it('accepts a heading written as periods-between-phrases at the schema layer — normalize strips the periods after the build proceeds', async () => {
    const d = { ...draft, about: { ...draft.about, heading: 'One potter. One wheel. One kiln at a time.' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
    create.mockResolvedValueOnce(toolMsg(d));
    const written = await writeCopy(brief, trajectory, rolls);
    // Periods stripped; the remaining text reads as a phrase.
    expect(written.about.heading).not.toMatch(/[.!?]/);
    expect(written.about.heading).toContain('One potter');
  });

  it('accepts a headline that ends in terminal punctuation — normalize trims it off', async () => {
    const d = { ...draft, close: { ...draft.close, headline: 'Built to outlast us.' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
    create.mockResolvedValueOnce(toolMsg(d));
    const written = await writeCopy(brief, trajectory, rolls);
    expect(written.close.headline).toBe('Built to outlast us');
  });

  it('accepts a clean heading and allows internal commas and intra-word hyphens', () => {
    const d = { ...draft, about: { ...draft.about, heading: 'Wheel-thrown, kiln-fired, made to last' } };
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
  });
});

describe('CopywriterDraftSchema — shared hero sub-line (the pile)', () => {
  it('requires a sub-line on the moment — the plain supporting sentence every non-Story hero uses', () => {
    const m: Record<string, unknown> = { ...draft.moment };
    delete m['sub'];
    expect(CopywriterDraftSchema.safeParse({ ...draft, moment: m }).success).toBe(false);
  });

  it('accepts a draft that carries the sub-line', () => {
    expect(CopywriterDraftSchema.safeParse(draft).success).toBe(true);
    const parsed = CopywriterDraftSchema.safeParse(draft);
    if (parsed.success) expect(parsed.data.moment.sub.length).toBeGreaterThan(0);
  });
});

describe('copywriter prompt — authors the shared hero sub-line', () => {
  it('instructs the copywriter to write moment.sub (one supporting sentence the non-Story heroes use)', () => {
    const prompt = buildCopywriterPrompt(brief, trajectory, rolls);
    expect(prompt).toMatch(/moment\.sub/);
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
    heroConcept: 'hands at the bench',
    register: 'restrained',
    heroKind: 'video',
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

describe('copywriter prompt — flat catalog target', () => {
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
