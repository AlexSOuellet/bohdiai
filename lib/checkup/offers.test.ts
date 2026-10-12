import { describe, it, expect } from 'vitest';
import { chooseOffers, offersBrief } from './offers';
import { bankQuestion, toAsked, GOALS } from './bank';
import { OPENING, type Answer, type Turn } from './transcript';

const turn = (id: string, answer: Answer): Turn => {
  const opening = OPENING.find((q) => q.id === id);
  const bank = bankQuestion(id);
  const question = opening ?? (bank !== undefined ? toAsked(bank, [], '') : undefined);
  if (question === undefined) throw new Error(`no question ${id}`);
  return { question, answer };
};

const SOLD = 'I’ve sold a few, mostly to people I know';
const maker = (...rest: Turn[]): Turn[] => [turn('make', 'Trays'), turn('goal', GOALS.test), turn('stage', SOLD), ...rest];

describe('chooseOffers', () => {
  it('leads with the market site for someone who does markets often, with the showcase as the simpler option', () => {
    const t = maker(turn('sources', ['Craft shows and markets']), turn('market_often', 'Most weekends'));
    expect(chooseOffers(t)).toEqual(['market', 'showcase']);
  });

  it('leads with the showcase for someone who does markets now and then', () => {
    const t = maker(turn('sources', ['Craft shows and markets']), turn('market_often', 'A few times a year'));
    expect(chooseOffers(t)).toEqual(['showcase', 'market']);
  });

  it('counts a maker hoping to start at markets', () => {
    const t = [turn('make', 'x'), turn('goal', GOALS.cover), turn('stage', 'I haven’t sold anything yet'), turn('first_place', ['A local market or craft fair'])];
    expect(chooseOffers(t)).toEqual(['showcase', 'market']);
  });

  it('offers a showcase to someone with nowhere to send people who doesn’t do markets', () => {
    expect(chooseOffers(maker(turn('sources', ['Etsy'])))).toEqual(['showcase']);
  });

  it('offers nothing to someone online with their own place already', () => {
    expect(chooseOffers(maker(turn('sources', ['My own website'])))).toEqual([]);
    expect(
      chooseOffers(maker(turn('sources', ['Etsy']), turn('found_again', 'I have a business page or account for my making'))),
    ).toEqual([]);
  });

  it('leads with a full shop only for a regular seller who ships and wants online', () => {
    const ready = [
      turn('make', 'x'),
      turn('goal', GOALS.business),
      turn('stage', 'I sell fairly regularly'),
      turn('sources', ['Craft shows and markets']),
      turn('market_often', 'Most weekends'),
      turn('where', 'A mix of in person and online'),
      turn('shipping', 'I’m fine with it, I’d work out the packing'),
    ];
    expect(chooseOffers(ready)).toEqual(['full_shop', 'market', 'showcase']);
    const noShipping = ready.slice(0, -1).concat(turn('shipping', 'I’d rather not ship at all'));
    expect(chooseOffers(noShipping)).toEqual(['market', 'showcase']);
  });
});

describe('offersBrief', () => {
  it('names the order and the lead, or says to leave the section empty', () => {
    expect(offersBrief(['market', 'showcase'])).toBe(
      'How I can help: present these offers in exactly this order, the first as the one that fits best: market (market site) — lead, showcase (showcase site).',
    );
    expect(offersBrief([])).toMatch(/leave this section empty/);
  });
});
