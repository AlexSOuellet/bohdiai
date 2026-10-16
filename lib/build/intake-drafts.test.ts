import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { SECTION_KEYS } from '@/lib/backend/sections/sections-form';
import { draftIntake, draftRequest, draftSystemPrompt, DRAFT_MODEL } from './intake-drafts';
import type { IntakeDrafts, IntakeForBuild } from './from-intake';

const intake: IntakeForBuild = {
  plan: 'full',
  makerName: 'Lena',
  businessName: 'Tide & Twine',
  email: 'lena@example.com',
  makes: 'Knotted rope baskets',
  about: 'I started knotting rope on the porch. Every basket takes a weekend.',
  portraitFile: null,
  pieces: [
    { name: 'Harbor basket', priceCents: 4500, description: 'A deep one.', file: 'piece-1.webp' },
    { name: 'Little tote', priceCents: null, description: null, file: 'piece-2.webp' },
  ],
};
const photos = [
  { mediaType: 'image/webp' as const, base64: 'AAA' },
  { mediaType: 'image/webp' as const, base64: 'BBB' },
];
const sec = { kicker: '', title: 'A heading', lede: '', moreLabel: '', pageTitle: '' };
const good: IntakeDrafts = {
  profile: { kicker: 'k', headline: 'h', aboutTitle: 'a', makes: ['Baskets'], quote: 'Every basket takes a weekend.', marqueePhrases: ['one', 'two', 'three', 'four'] },
  moment: { kicker: 'k', sub: 's', story: ['a', 'b', 'c'], ctaLabel: 'Shop', ctaTarget: 'shop', secondCtaLabel: 'About', secondCtaTarget: 'about' },
  sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, sec])) as IntakeDrafts['sections'],
  closeTarget: 'shop',
  collections: [],
  pieceDescriptions: [{ piece: 2, description: 'A small tote.' }],
  homePieces: [1, 2],
  openingPiece: 1,
};

function client(replies: { stop_reason: string; parsed_output: unknown }[]) {
  const parse = vi.fn();
  for (const r of replies) parse.mockResolvedValueOnce({ ...r, content: [{ type: 'text', text: '{}' }] });
  return { client: { messages: { parse } } as unknown as Pick<Anthropic, 'messages'>, parse };
}

describe('the request', () => {
  it('sends their photos first, then their own words and every field to write', () => {
    const msg = draftRequest(intake, 'Cozy', photos);
    const content = msg.content as Anthropic.ContentBlockParam[];
    expect(content.slice(0, 2).map((c) => c.type)).toEqual(['image', 'image']);
    const text = (content[2] as Anthropic.TextBlockParam).text;
    expect(text).toContain('Business: Tide & Twine');
    expect(text).toContain(intake.about);
    expect(text).toContain('Piece 1: Harbor basket ($45.00) — the maker’s description: A deep one.');
    expect(text).toContain('Piece 2: Little tote (price on request) — no description; write one from its photo');
    expect(text).toContain('The site’s mood: Cozy');
    expect(text).toContain('home, shop, about');
    expect(draftSystemPrompt()).toContain('Never invent facts');
  });

  it('a Showcase site gets no groups and no shop to point at', () => {
    const text = ((draftRequest({ ...intake, plan: 'showcase' }, 'Cozy', photos).content as Anthropic.ContentBlockParam[])[2] as Anthropic.TextBlockParam).text;
    expect(text).toContain('collections: leave empty');
    expect(text).not.toContain('home, shop,');
  });
});

describe('draftIntake', () => {
  it('returns right drafts on the first pass', async () => {
    const { client: c, parse } = client([{ stop_reason: 'end_turn', parsed_output: good }]);
    expect(await draftIntake(c, intake, 'Cozy', photos)).toEqual({ ok: true, drafts: good });
    expect(parse).toHaveBeenCalledWith(expect.objectContaining({ model: DRAFT_MODEL, output_config: expect.objectContaining({ effort: 'high' }) }));
  });

  it('sends the problems back once, keeping the whole reply', async () => {
    const { client: c, parse } = client([
      { stop_reason: 'end_turn', parsed_output: { ...good, openingPiece: 7 } },
      { stop_reason: 'end_turn', parsed_output: good },
    ]);
    expect(await draftIntake(c, intake, 'Cozy', photos)).toEqual({ ok: true, drafts: good });
    const second = parse.mock.calls[1]?.[0] as { messages: Anthropic.MessageParam[] };
    expect(second.messages).toHaveLength(3);
    expect(second.messages[1]).toEqual({ role: 'assistant', content: [{ type: 'text', text: '{}' }] });
    expect(second.messages[2]?.content).toContain("openingPiece 7 isn't a piece");
  });

  it('the builder’s own check counts too, and two misses fail with the problems', async () => {
    const { client: c } = client([
      { stop_reason: 'end_turn', parsed_output: good },
      { stop_reason: 'end_turn', parsed_output: good },
    ]);
    expect(await draftIntake(c, intake, 'Cozy', photos, () => ['moment: too long'])).toEqual({ ok: false, error: 'the drafts still have problems: moment: too long' });
  });

  it('a refusal, running out of room or a reply out of shape fails plainly', async () => {
    expect(await draftIntake(client([{ stop_reason: 'refusal', parsed_output: null }]).client, intake, 'Cozy', photos)).toEqual({ ok: false, error: 'Claude declined to draft these words' });
    expect(await draftIntake(client([{ stop_reason: 'max_tokens', parsed_output: null }]).client, intake, 'Cozy', photos)).toEqual({ ok: false, error: 'the drafts ran out of room' });
    expect(await draftIntake(client([{ stop_reason: 'end_turn', parsed_output: null }]).client, intake, 'Cozy', photos)).toEqual({ ok: false, error: 'the drafts didn’t come back in shape' });
  });
});
