import { describe, it, expect, vi, beforeEach } from 'vitest';

// Integration test: drive the REAL five stages + the REAL assembly + the engine's
// own parseSubmission, mocking only the model client. The five create() calls
// resolve in pipeline order: director, copywriter, cinematographer, graphic
// artist, director's cut.
const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { directAndProduce, PIPELINE_DEADLINE_MS, ROUTE_CEILING_MS, STAGE_TIMEOUTS_SUM_MS } from './pipeline';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';
import type { CrewBrief } from './types';

const brief: CrewBrief = {
  shopName: 'Tannery Row',
  nicheDisplayName: 'Leatherworker',
  nicheBody: 'People buy leather goods that outlast them.',
  moodLabel: 'Rustic',
  moodDescription: 'warm and worn',
  productCount: 3,
  moodKey: 'rustic',
};

const trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them',
  visualWorld: 'warm and worn, low light, deep shadow',
  heroConcept: 'a hand resting on a worn bench',
  register: 'restrained',
  heroKind: 'video',
};

const copy = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: [{ label: 'Shop', target: 'shop' }, { label: 'Our story', target: 'about' }] },
  moment: { story: ['Built by hand', 'Made to outlast you'], eyebrow: 'From the workshop', brand: 'Tannery Row', sub: 'Hand-cut leather goods built to outlast you', ctaLabel: 'See the work', ctaTarget: 'shop' },
  goods: { title: 'The bench', treatment: 'procession' },
  marquee: { voice: ['Small batch', 'Cut by hand', 'Made to last'] },
  reviews: { title: 'Kind words', items: [{ quote: 'These belts are the real thing and only get better with age.', author: 'Dana R.' }, { quote: 'Worth every penny and then some.', author: 'Marcus T.' }] },
  founder: { quote: 'I would rather make one belt that lasts thirty years than ten that fall apart.', attribution: 'Sam, founder', treatment: 'quote' },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours', ctaTarget: 'contact' },
  about: { heading: 'The story', story: ['We started at a single bench with a knife and more patience than sense, and that has not changed.', 'Everything here is meant to be used hard and handed down the way good things always were.'] },
  contact: { heading: 'Say hello', intro: 'We read everything that comes in and would love to hear what you are looking for.' },
  products: [
    { name: 'Belt', slug: 'belt', shortDescription: 'A belt for life', description: 'A belt that ages with you.', basePriceCents: 9800 },
    { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold', description: 'A bifold that softens with use.', basePriceCents: 6800 },
    { name: 'Tote', slug: 'tote', shortDescription: 'A roomy tote', description: 'A tote that carries the week.', basePriceCents: 22000 },
  ],
};

const moment = {
  kind: 'video',
  prompt: { composition: 'wide low angle', subject: 'a still hand on leather', environment: 'a dim workshop', atmosphere: 'quiet', camera: 'static 35mm', lighting: 'a shaft of window light', style: 'warm filmic grade' },
  alt: 'a hand on leather',
};

const look = {
  skinKey: 'main-street-ember',
  founderPhoto: { prompt: 'the maker at a worn bench, warm window light', alt: 'the maker' },
  products: [
    { slug: 'belt', imagePrompt: 'a leather belt on aged oak, warm low light' },
    { slug: 'wallet', imagePrompt: 'a bifold wallet on stone, soft shadow' },
    { slug: 'tote', imagePrompt: 'a leather tote on a bench, window light' },
  ],
};

function toolMsg(name: string, input: unknown) {
  return { content: [{ type: 'tool_use', id: `t_${name}`, name, input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('directAndProduce (the crew pipeline)', () => {
  it('runs the five stages in order and assembles the engine envelope', async () => {
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', moment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', { notes: 'coheres' }));

    const result = await directAndProduce(brief);

    expect(create).toHaveBeenCalledTimes(5);
    // stage order is enforced by the tool each stage forces
    const forcedTools = create.mock.calls.map((c) => (c[0] as { tool_choice: { name: string } }).tool_choice.name);
    expect(forcedTools).toEqual(['set_trajectory', 'submit_copy', 'set_moment', 'set_look', 'final_cut']);

    // skin is the crew's pick, and within the mood subset
    expect(result.chosen.lookKey).toBe('main-street-ember');
    expect(moodAlignedSkins('rustic')).toContain(result.chosen.lookKey);

    // the assembled envelope: words + the moment scene + the image prompts
    const { content, products, productUrls } = result.authored;
    expect(content.shopName).toBe('Tannery Row');
    expect(content.moment.media.kind).toBe('video');
    expect(content.moment.media.prompt.lighting).toBe('a shaft of window light');
    expect(content.moment.story).toEqual(['Built by hand', 'Made to outlast you']);
    expect(content.founder.photo.prompt).toContain('worn bench');
    expect(products.map((p) => p.slug)).toEqual(['belt', 'wallet', 'tote']);
    expect(products.map((p) => p.imagePrompt)).toEqual([
      'a leather belt on aged oak, warm low light',
      'a bifold wallet on stone, soft shadow',
      'a leather tote on a bench, window light',
    ]);
    expect(productUrls).toEqual([]); // media not generated yet
  });

  it('carries the cinematographer\'s collage shots into the assembled envelope', async () => {
    const momentWithCollage = {
      ...moment,
      collageShots: [
        { prompt: moment.prompt, alt: 'a wide of the bench' },
        { prompt: moment.prompt, alt: 'a close detail on the stitch' },
        { prompt: moment.prompt, alt: 'a small grouping of goods' },
      ],
    };
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', momentWithCollage))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', { notes: 'coheres' }));

    const result = await directAndProduce(brief);
    expect(result.authored.content.moment.collageShots).toHaveLength(3);
    expect(result.authored.content.moment.collageShots![0]!.alt).toBe('a wide of the bench');
  });

  it('threads a director-cut revision into the final envelope', async () => {
    const revisedCopy = { ...copy, moment: { ...copy.moment, story: ['Built by hand', 'Kept for a lifetime'] } };
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', moment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', { copy: revisedCopy }));

    const result = await directAndProduce(brief);
    expect(result.authored.content.moment.story).toEqual(['Built by hand', 'Kept for a lifetime']);
  });

  it('feeds the copywriter story into the cinematographer', async () => {
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', moment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', {}));

    await directAndProduce(brief);
    const cinematographerCall = create.mock.calls[2]![0] as { system: string };
    expect(cinematographerCall.system).toContain('Built by hand');
  });

  it('surfaces the crew look-driving picks for the orchestrator to log', async () => {
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', moment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', {}));

    // rand: () => 0 deals the first face of each set — goods 'marquee', founder
    // 'quote'. The mock copy overrides goods to 'procession' and keeps founder.
    const result = await directAndProduce(brief, () => 0);

    // The pipeline does NOT log (the tenant doesn't exist yet); it returns BOTH
    // what was dealt and what the copywriter landed on, so the orchestrator can
    // log rolled-vs-picked against the real tenant + niche.
    expect(result.choices).toEqual({
      heroKind: 'video',
      goodsTreatment: 'procession',
      founderTreatment: 'quote',
      goodsRoll: 'marquee',
      founderRoll: 'quote',
    });
  });

  it('threads the trajectory heroKind through to the assembled envelope — spotlight path', async () => {
    // Confirm the kind decision set by the director in the trajectory flows
    // through the cinematographer and survives assembly unchanged.
    const spotlightTrajectory = { ...trajectory, heroKind: 'still' };
    const spotlightMoment = {
      ...moment,
      kind: 'still',
      prompt: { ...moment.prompt, environment: 'pure black void' },
    };
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', spotlightTrajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', spotlightMoment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', { notes: 'coheres' }));

    const result = await directAndProduce(brief);
    expect(result.authored.content.moment.media.kind).toBe('still');
    expect(result.choices.heroKind).toBe('still');
  });

  // A4 guard — the pipeline timeout budget once silently regressed past the
  // route ceiling (510s of stage timeouts against a 300s route, which caused
  // a real failure). These invariants stop that from happening again.
  describe('timeout budget (A4 guard)', () => {
    it('sum of per-stage timeouts stays under the route ceiling', () => {
      expect(STAGE_TIMEOUTS_SUM_MS).toBeLessThan(ROUTE_CEILING_MS);
    });

    it('overall pipeline deadline is under the route ceiling', () => {
      expect(PIPELINE_DEADLINE_MS).toBeLessThan(ROUTE_CEILING_MS);
    });
  });

  it('deals the rolled treatments to the copywriter', async () => {
    create
      .mockResolvedValueOnce(toolMsg('set_trajectory', trajectory))
      .mockResolvedValueOnce(toolMsg('submit_copy', copy))
      .mockResolvedValueOnce(toolMsg('set_moment', moment))
      .mockResolvedValueOnce(toolMsg('set_look', look))
      .mockResolvedValueOnce(toolMsg('final_cut', {}));

    await directAndProduce(brief, () => 0);
    // calls[1] is the copywriter; its prompt carries the dealt draw.
    const copywriterCall = create.mock.calls[1]![0] as { system: string };
    expect(copywriterCall.system).toContain('you drew "marquee"');
    expect(copywriterCall.system).toContain('you drew "quote"');
  });
});
