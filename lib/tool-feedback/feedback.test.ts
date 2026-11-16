import { describe, it, expect } from 'vitest';
import { IDEAS, parseFeedback, tally } from './feedback';

describe('the tool ideas (Alex, 2026-11-15)', () => {
  it('are the ones agreed so far, each with a name and a line on what it does', () => {
    expect(IDEAS.map((i) => i.key)).toEqual(['tags', 'shopping', 'batch', 'cards', 'backgrounds']);
    for (const i of IDEAS) {
      expect(i.name.length).toBeGreaterThan(0);
      expect(i.about.length).toBeGreaterThan(0);
    }
  });
});

describe('parseFeedback', () => {
  it('takes a message, ticked ideas and the optional details, trimmed', () => {
    expect(parseFeedback({ message: '  Love Print it ', wants: ['tags', 'cards'], name: ' Pat ', email: ' pat@example.com ', makes: ' candles ' })).toEqual({
      kind: 'ok',
      row: { message: 'Love Print it', wants: ['tags', 'cards'], name: 'Pat', email: 'pat@example.com', makes: 'candles' },
    });
  });
  it('takes just a tick, or just a message', () => {
    expect(parseFeedback({ wants: ['batch'] })).toMatchObject({ kind: 'ok', row: { message: '', wants: ['batch'] } });
    expect(parseFeedback({ message: 'More tools please' })).toMatchObject({ kind: 'ok', row: { wants: [] } });
  });
  it('drops ideas it doesn’t know and repeats', () => {
    expect(parseFeedback({ wants: ['tags', 'tags', 'rocket', 7] })).toMatchObject({ kind: 'ok', row: { wants: ['tags'] } });
  });
  it.each([
    [{}, 'Tell us what you think, or tick a tool you’d use.'],
    [{ message: '   ', wants: [] }, 'Tell us what you think, or tick a tool you’d use.'],
    [{ message: 'x'.repeat(2001) }, 'Please keep it under 2,000 characters.'],
    [{ message: 'Hi', email: 'not an email' }, 'That email doesn’t look right. Leave it blank if you’d rather.'],
    [{ message: 'Hi', name: 'x'.repeat(81) }, 'That name is too long.'],
    [{ message: 'Hi', makes: 'x'.repeat(121) }, 'Keep what you make to a few words.'],
  ])('refuses %o', (body, error) => {
    expect(parseFeedback(body)).toEqual({ kind: 'invalid', error });
  });
  it('treats a filled hidden field as a bot, and anything not an object as invalid', () => {
    expect(parseFeedback({ message: 'Buy now', company: 'Spam Co' })).toEqual({ kind: 'spam' });
    expect(parseFeedback('hello')).toMatchObject({ kind: 'invalid' });
    expect(parseFeedback(null)).toMatchObject({ kind: 'invalid' });
  });
});

describe('tally', () => {
  it('counts how many people want each idea, most wanted first, every idea shown', () => {
    const counts = tally([{ wants: ['tags', 'cards'] }, { wants: ['cards'] }, { wants: [] }, { wants: ['old-idea'] }]);
    expect(counts.map((c) => [c.key, c.count])).toEqual([
      ['cards', 2],
      ['tags', 1],
      ['shopping', 0],
      ['batch', 0],
      ['backgrounds', 0],
    ]);
    expect(counts[0]?.name).toBe(IDEAS.find((i) => i.key === 'cards')?.name);
  });
});

describe('loadToolFeedback', () => {
  it('reads the responses newest first, with the counts', async () => {
    const { loadToolFeedback, ideaName } = await import('./load');
    const rows = [{ id: 'f1', message: 'Nice', wants: ['tags'], name: 'Pat', email: '', makes: 'soap', created_at: '2026-11-15T10:00:00Z' }];
    const db = { from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) };
    const view = await loadToolFeedback(db as never);
    expect(view.total).toBe(1);
    expect(view.entries[0]).toEqual({ id: 'f1', message: 'Nice', wants: ['tags'], name: 'Pat', email: '', makes: 'soap', sent: '2026-11-15T10:00:00Z' });
    expect(view.counts[0]).toMatchObject({ key: 'tags', count: 1 });
    expect(ideaName('tags')).toBe('Price tags and labels');
    expect(ideaName('gone')).toBe('gone');
    const broken = { from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: null, error: { message: 'down' } }) }) }) }) };
    await expect(loadToolFeedback(broken as never)).rejects.toThrow('Could not read the feedback: down');
  });
});
