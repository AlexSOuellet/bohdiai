import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { DESCRIBE_MODEL, describeRequest, describeSystemPrompt, monthStart, resetsOn, writeDescription, LONG_MAX, SHORT_MAX, type DescribeInput } from './describe';

const susan: DescribeInput = {
  name: 'Victorian Lazy Susan',
  materials: ['18" round, 1 inch thick pine', ' ', 'Decoupage print'],
  facts: 'Spins on a hidden bearing.',
  priceCents: 13000,
  photoUrl: 'https://img/susan.jpg',
};

const client = (reply: { stop_reason: string; parsed_output: unknown }) => {
  const parse = vi.fn().mockResolvedValue(reply);
  return { client: { messages: { parse } } as unknown as Pick<Anthropic, 'messages'>, parse };
};

describe('the description writer (Alex, 2026-10-28)', () => {
  it('uses the cheapest model at low effort', async () => {
    const { client: c, parse } = client({ stop_reason: 'end_turn', parsed_output: { short: 'A pine lazy susan.', description: 'Solid pine.' } });
    await writeDescription(c, susan);
    expect(DESCRIBE_MODEL).toBe('claude-haiku-5-5');
    expect(parse.mock.calls[0]![0]).toMatchObject({ model: 'claude-haiku-5-5', output_config: { effort: 'low' } });
  });

  it('sends the photo first, then the name, what it’s made of, her facts and the price', () => {
    const msg = describeRequest(susan);
    const content = msg.content as Anthropic.ContentBlockParam[];
    expect(content[0]).toEqual({ type: 'image', source: { type: 'url', url: 'https://img/susan.jpg' } });
    const text = (content[1] as Anthropic.TextBlockParam).text;
    expect(text).toContain('The piece: Victorian Lazy Susan');
    expect(text).toContain('- 18" round, 1 inch thick pine\n- Decoupage print');
    expect(text).toContain('Spins on a hidden bearing.');
    expect(text).toContain('$130.00');
  });

  it('says plainly what wasn’t given, with no photo', () => {
    const msg = describeRequest({ ...susan, materials: [], facts: '', priceCents: null, photoUrl: null });
    const content = msg.content as Anthropic.ContentBlockParam[];
    expect(content).toHaveLength(1);
    const text = (content[0] as Anthropic.TextBlockParam).text;
    expect(text).toContain('What it is made of: not given.');
    expect(text).toContain('none.');
    expect(text).toContain('Price: not set.');
    expect(text).toContain('There is no photo.');
  });

  it('tells the model not to invent anything, and holds no sample wording', () => {
    const p = describeSystemPrompt();
    expect(p).toContain('Never invent');
    expect(p).not.toMatch(/for example|e\.g\./i);
  });

  it('fits what comes back to the product’s boxes', async () => {
    const { client: c } = client({ stop_reason: 'end_turn', parsed_output: { short: ` ${'a'.repeat(400)} `, description: 'b'.repeat(2000) } });
    const r = await writeDescription(c, susan);
    expect(r.ok && r.text.short.length).toBe(SHORT_MAX);
    expect(r.ok && r.text.description.length).toBe(LONG_MAX);
  });

  it('says what went wrong instead of filling the boxes with nothing', async () => {
    expect(await writeDescription(client({ stop_reason: 'end_turn', parsed_output: null }).client, { ...susan, name: ' ' })).toEqual({ ok: false, error: 'Give the piece a name first.' });
    expect((await writeDescription(client({ stop_reason: 'refusal', parsed_output: null }).client, susan)).ok).toBe(false);
    expect((await writeDescription(client({ stop_reason: 'max_tokens', parsed_output: null }).client, susan)).ok).toBe(false);
    expect((await writeDescription(client({ stop_reason: 'end_turn', parsed_output: null }).client, susan)).ok).toBe(false);
    expect((await writeDescription(client({ stop_reason: 'end_turn', parsed_output: { short: '', description: 'x' } }).client, susan)).ok).toBe(false);
  });

  it('counts the month from its first day, and says when it starts again', () => {
    const now = new Date('2026-10-28T15:00:00Z');
    expect(monthStart(now)).toBe('2026-10-01T00:00:00.000Z');
    expect(resetsOn(now)).toBe('November 1');
    expect(resetsOn(new Date('2026-12-31T23:00:00Z'))).toBe('January 1');
  });
});
