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

  it('drops a value whose type does not match the field kind', async () => {
    const fields = [getField('moment.story')!];
    create.mockResolvedValueOnce(toolMsg({ 'moment.story': 'not an array' }));
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
