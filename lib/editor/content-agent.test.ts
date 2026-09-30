import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { runContentEdit, ContentEditError } from './content-agent';
import { getField } from './editable-fields';

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_edit', name: 'write_fields', input }], stop_reason: 'tool_use' };
}

const niche = { displayName: 'Candle maker', body: 'People buy candles for the feeling of a room.' };

beforeEach(() => create.mockReset());

describe('runContentEdit', () => {
  it('returns normalized values for the requested fields (headline punct stripped, lines stays an array)', async () => {
    const fields = [getField('goods.title')!, getField('moment.story')!];
    create.mockResolvedValueOnce(
      toolMsg({ 'goods.title': 'The candles.', 'moment.story': ['Poured by hand.', 'Made slow'] }),
    );
    const { values } = await runContentEdit({
      fields,
      current: { 'goods.title': 'Our goods', 'moment.story': ['a'] },
      instruction: 'warm it up',
      niche,
    });
    expect(values['goods.title']).toBe('The candles'); // terminal period stripped
    expect(values['moment.story']).toEqual(['Poured by hand', 'Made slow']); // stays an array, punct stripped
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('keeps only keys that are in the requested fields', async () => {
    const fields = [getField('goods.title')!];
    create.mockResolvedValueOnce(toolMsg({ 'goods.title': 'Fresh', 'close.headline': 'not requested' }));
    const { values } = await runContentEdit({ fields, current: { 'goods.title': 'x' }, instruction: 'i', niche });
    expect(values).toEqual({ 'goods.title': 'Fresh' });
  });

  it('coerces a prose string into a lines field, splitting on blank/newlines (fixes the vanishing About story)', async () => {
    const fields = [getField('about.story')!];
    create.mockResolvedValueOnce(
      toolMsg({ 'about.story': 'It started at my kitchen table.\n\nNow I pour every candle by hand.' }),
    );
    const { values } = await runContentEdit({
      fields,
      current: { 'about.story': ['old story'] },
      instruction: 'write my full story',
      niche,
    });
    expect(values['about.story']).toEqual([
      'It started at my kitchen table.',
      'Now I pour every candle by hand.',
    ]);
  });

  it('a one-paragraph string with no newlines becomes a single line', async () => {
    const fields = [getField('about.story')!];
    create.mockResolvedValueOnce(toolMsg({ 'about.story': 'One long paragraph, no breaks.' }));
    const { values } = await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    expect(values['about.story']).toEqual(['One long paragraph, no breaks.']);
  });

  it('drops a genuinely wrong type (not an array and not a string) for a lines field', async () => {
    const fields = [getField('moment.story')!];
    create.mockResolvedValueOnce(toolMsg({ 'moment.story': 42 }));
    const { values } = await runContentEdit({ fields, current: { 'moment.story': ['a'] }, instruction: 'i', niche });
    expect(values).toEqual({});
  });

  it('forces the write_fields tool and grounds in the niche body + the maker instruction', async () => {
    const fields = [getField('goods.title')!];
    create.mockResolvedValueOnce(toolMsg({ 'goods.title': 'Fresh' }));
    await runContentEdit({ fields, current: { 'goods.title': 'x' }, instruction: 'make it playful', niche });
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'write_fields' });
    expect(args.system).toContain(niche.body);
    expect(args.system).toContain('make it playful');
  });

  it('throws ContentEditError after the attempt budget when no valid tool call comes back', async () => {
    const fields = [getField('goods.title')!];
    create.mockResolvedValue({ content: [{ type: 'text', text: 'no tool here' }], stop_reason: 'end_turn' });
    await expect(
      runContentEdit({ fields, current: { 'goods.title': 'x' }, instruction: 'i', niche }),
    ).rejects.toBeInstanceOf(ContentEditError);
    expect(create).toHaveBeenCalledTimes(4);
  });
});

describe('runContentEdit — value normalization by field kind', () => {
  it('trims a plain text field but keeps its sentence punctuation', async () => {
    const fields = [getField('contact.intro')!];
    create.mockResolvedValueOnce(toolMsg({ 'contact.intro': '  Write to me any time.  ' }));
    const { values } = await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    expect(values).toEqual({ 'contact.intro': 'Write to me any time.' });
  });

  it('drops a text field that comes back as a non-string, or that normalizes to empty', async () => {
    const fields = [getField('goods.title')!, getField('contact.intro')!];
    create.mockResolvedValueOnce(toolMsg({ 'goods.title': ['not', 'a string'], 'contact.intro': '   ' }));
    const { values } = await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    expect(values).toEqual({});
  });

  it('drops a lines field whose every line is blank or not a string', async () => {
    const fields = [getField('moment.story')!];
    create.mockResolvedValueOnce(toolMsg({ 'moment.story': ['   ', 3, null, '.'] }));
    const { values } = await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    expect(values).toEqual({});
  });

  it('keeps an items field as the whole array, and drops it when it is not an array', async () => {
    const reviews = [{ quote: 'Lovely', author: 'Sam' }];
    create.mockResolvedValueOnce(toolMsg({ 'reviews.items': reviews }));
    const ok = await runContentEdit({ fields: [getField('reviews.items')!], current: {}, instruction: 'i', niche });
    expect(ok.values).toEqual({ 'reviews.items': reviews });

    create.mockResolvedValueOnce(toolMsg({ 'reviews.items': 'Lovely — Sam' }));
    const bad = await runContentEdit({ fields: [getField('reviews.items')!], current: {}, instruction: 'i', niche });
    expect(bad.values).toEqual({});
  });
});

describe('runContentEdit — tool schema + prompt per field kind', () => {
  it('declares each field in the forced tool with the JSON type its kind needs, none required', async () => {
    const fields = [getField('goods.title')!, getField('moment.story')!, getField('reviews.items')!];
    create.mockResolvedValueOnce(toolMsg({}));
    await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    const args = create.mock.calls[0]![0] as {
      tools: Array<{ name: string; input_schema: { properties: Record<string, { type: string; items?: { type: string } }>; required: string[] } }>;
    };
    const schema = args.tools[0]!.input_schema;
    expect(args.tools[0]!.name).toBe('write_fields');
    expect(schema.properties['goods.title']).toMatchObject({ type: 'string' });
    expect(schema.properties['moment.story']).toMatchObject({ type: 'array', items: { type: 'string' } });
    expect(schema.properties['reviews.items']).toMatchObject({ type: 'array', items: { type: 'object' } });
    expect(schema.required).toEqual([]);
  });

  it('describes each field kind in plain words and shows its current value (null when unset)', async () => {
    const fields = [getField('goods.title')!, getField('moment.story')!, getField('reviews.items')!];
    create.mockResolvedValueOnce(toolMsg({}));
    await runContentEdit({ fields, current: { 'goods.title': 'Our goods' }, instruction: 'i', niche });
    const { system } = create.mock.calls[0]![0] as { system: string };
    expect(system).toContain('- goods.title (one line) — Goods heading. Current: "Our goods"');
    expect(system).toContain('- moment.story (a list of lines) — Hero story lines. Current: null');
    expect(system).toContain('- reviews.items (a list) — Testimonials. Current: null');
  });

  it('an empty tool call is a valid "nothing to change" answer, not a retry', async () => {
    create.mockResolvedValueOnce(toolMsg({}));
    const { values } = await runContentEdit({ fields: [getField('goods.title')!], current: {}, instruction: 'make it cozier', niche });
    expect(values).toEqual({});
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('runContentEdit — retry on an unusable tool call', () => {
  it('retries when the tool input is null or an array, nudging the model, then accepts a good call', async () => {
    const fields = [getField('goods.title')!];
    create
      .mockResolvedValueOnce(toolMsg(null))
      .mockResolvedValueOnce(toolMsg(['goods.title', 'Fresh']))
      .mockResolvedValueOnce(toolMsg({ 'goods.title': 'Fresh' }));
    const { values } = await runContentEdit({ fields, current: {}, instruction: 'i', niche });
    expect(values).toEqual({ 'goods.title': 'Fresh' });
    expect(create).toHaveBeenCalledTimes(3);
    const lastMessages = (create.mock.calls[2]![0] as { messages: Array<{ role: string; content: unknown }> }).messages;
    // original ask + (assistant, nudge) for each of the two failed attempts
    expect(lastMessages).toHaveLength(5);
    expect(lastMessages[4]).toMatchObject({ role: 'user', content: expect.stringContaining('write_fields') });
  });
});
