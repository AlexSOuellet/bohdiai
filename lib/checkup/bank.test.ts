import { describe, it, expect } from 'vitest';
import { BANK, GOALS, SOURCES, Turns, available, missingMust, toAsked, bankQuestion, bankText, cleanBridge } from './bank';
import { OPENING, type Answer, type Turn } from './transcript';

const turn = (id: string, answer: Answer): Turn => {
  const opening = OPENING.find((q) => q.id === id);
  const bank = bankQuestion(id);
  const question = opening ?? (bank !== undefined ? toAsked(bank, [], '') : undefined);
  if (question === undefined) throw new Error(`no question ${id}`);
  return { question, answer };
};

const ids = (list: ReadonlyArray<{ id: string }>): string[] => list.map((q) => q.id);
const base = (goal: keyof typeof GOALS, stage: string): Turn[] => [
  turn('make', 'Trays'),
  turn('goal', GOALS[goal]),
  turn('stage', stage),
];
const SOLD = 'I’ve sold a few, mostly to people I know';

describe('the bank', () => {
  it('has unique ids that never clash with the opening', () => {
    const all = BANK.map((q) => q.id);
    expect(new Set(all).size).toBe(all.length);
    expect(all).not.toContain('make');
    expect(all).not.toContain('goal');
  });

  it('gives every tap question choices, and keeps choices on pick-all questions free of "Something else"', () => {
    for (const q of BANK) {
      if (q.kind === 'text') continue;
      expect(q.options !== undefined || q.optionsFrom !== undefined).toBe(true);
      for (const o of q.options ?? []) expect(o).not.toMatch(/^(something else|other)\b/i);
    }
  });

  it('describes every question for the model', () => {
    const text = bankText();
    for (const q of BANK) expect(text).toContain(`- ${q.id} [${q.kind}]`);
    expect(text).toContain('(their picks from sources)');
  });
});

describe('who gets asked what', () => {
  it('starts everyone with where they are', () => {
    expect(ids(missingMust([turn('make', 'x'), turn('goal', GOALS.cover)]))).toContain('stage');
  });

  it('asks a maker who hasn’t sold about getting started, not about sales', () => {
    const t = base('test', 'I haven’t sold anything yet');
    expect(ids(available(t))).toEqual(expect.arrayContaining(['ready', 'first_place']));
    expect(ids(available(t))).not.toContain('sources');
    expect(ids(available(t))).not.toContain('left_over');
    expect(ids(missingMust(t))).toContain('first_place');
  });

  it('follows each place they sell with its own questions', () => {
    const t = [...base('test', SOLD), turn('sources', ['Craft shows and markets', 'Etsy'])];
    const open = ids(available(t));
    expect(open).toEqual(expect.arrayContaining(['best_source', 'cards', 'found_again', 'etsy_sales', 'market_pay']));
    expect(open).not.toContain('site_built');
    expect(open).not.toContain('marketplace_how');
    expect(ids(missingMust(t))).toEqual(expect.arrayContaining(['best_source', 'cards', 'found_again', 'market_often']));
  });

  it('offers their own picks as the choices for "which brings in the most"', () => {
    const t = [...base('test', SOLD), turn('sources', ['Etsy', 'Local shops (also: two shops)', 'Craft shows and markets'])];
    const best = bankQuestion('best_source');
    if (best === undefined) throw new Error('missing best_source');
    expect(toAsked(best, t, '').options).toEqual(['Craft shows and markets', 'Etsy', 'Local shops']);
  });

  it('asks why Etsy is slow only when it isn’t the main seller', () => {
    const t = [...base('test', SOLD), turn('sources', ['Etsy'])];
    expect(ids(available([...t, turn('etsy_sales', 'Most of it')]))).not.toContain('etsy_why');
    expect(ids(available([...t, turn('etsy_sales', 'Hardly any')]))).toContain('etsy_why');
  });

  it('asks the money question that fits the goal, and hourly only for a business', () => {
    const cover = [...base('cover', SOLD)];
    expect(ids(missingMust(cover))).toContain('covers');
    expect(ids(available(cover))).not.toContain('left_over');
    expect(ids(available(cover))).not.toContain('time_paid');
    const test = [...base('test', SOLD)];
    expect(ids(missingMust(test))).toContain('left_over');
    expect(ids(available(test))).not.toContain('time_paid');
    expect(ids(available([...base('business', SOLD)]))).toEqual(expect.arrayContaining(['time_paid', 'keep_up', 'setup', 'invest']));
  });

  it('only asks about shipping once they’re open to selling online', () => {
    const t = base('test', SOLD);
    expect(ids(missingMust(t))).toEqual(expect.arrayContaining(['where', 'next']));
    expect(ids(available(t))).not.toContain('shipping');
    expect(ids(available([...t, turn('where', 'Mostly in person, at markets and locally')]))).not.toContain('shipping');
    expect(ids(missingMust([...t, turn('where', 'A mix of in person and online')]))).toContain('shipping');
  });

  it('keeps growth questions away from a pay-for-itself maker', () => {
    const open = ids(available(base('cover', SOLD)));
    for (const id of ['where', 'next', 'hours', 'keep_up', 'setup', 'invest']) expect(open).not.toContain(id);
  });

  it('asks what held custom orders back only when they’ve been asked and said no', () => {
    const t = base('test', SOLD);
    expect(ids(available([...t, turn('custom', 'I’ve been asked, but haven’t said yes')]))).toContain('custom_block');
    expect(ids(available([...t, turn('custom', 'Yes, fairly often')]))).not.toContain('custom_block');
  });

  it('never asks the same question twice', () => {
    const t = [...base('test', SOLD), turn('standout', 'Bright')];
    expect(ids(available(t))).not.toContain('standout');
    expect(ids(available(t))).not.toContain('stage');
  });
});

describe('reading answers', () => {
  it('counts a pick with a typed note, and ignores unasked questions', () => {
    const t = new Turns([turn('stage', `${SOLD} (also: at church)`), turn('sources', ['Etsy', 'extra words'])]);
    expect(t.chose('stage', SOLD)).toBe(true);
    expect(t.chose('sources', 'Etsy')).toBe(true);
    expect(t.chose('cards', 'Yes, to everyone who stops')).toBe(false);
    expect(t.picks('sources', SOURCES)).toEqual(['Etsy']);
    expect(t.picks('cards', SOURCES)).toEqual([]);
    expect(t.picks('stage', [SOLD])).toEqual([SOLD]);
  });
});

describe('the question on screen', () => {
  it('uses the bank wording, adds the pick-all line and the extra line, and cleans the reaction', () => {
    const q = bankQuestion('market_kinds');
    if (q === undefined) throw new Error('missing');
    const asked = toAsked(q, [], '  Markets <br/> are   good. ');
    expect(asked).toMatchObject({
      id: 'market_kinds',
      prompt: 'What kinds of shows or markets do you sell at?',
      aside: 'Pick every one that applies.',
      allowOther: true,
      bridge: 'Markets are good.',
    });
    const typed = bankQuestion('standout');
    if (typed === undefined) throw new Error('missing');
    expect(toAsked(typed, [], '').allowOther).toBe(false);
    expect(cleanBridge('x'.repeat(500))).toHaveLength(240);
  });
});
