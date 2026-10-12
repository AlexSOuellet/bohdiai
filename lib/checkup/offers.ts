import { Turns } from './bank';
import type { Turn } from './transcript';

/**
 * Which of Alex's offers the "How I can help" section presents, and in what
 * order (the first one leads). Decided here by rules, not by the model, so the
 * same answers always get the same recommendation.
 */

export type Offer = 'showcase' | 'market' | 'full_shop';

const OFTEN = ['Most weekends', 'A couple of times a month'];
const SELLING_WELL = ['I sell fairly regularly', 'I’m busy and struggling to keep up'];
const SHIPS = ['I’m fine with it, I’d work out the packing', 'Small or sturdy pieces, but not fragile ones'];
const ONLINE = ['A mix of in person and online', 'Mostly online'];
const HAS_PLACE = ['I have a business page or account for my making', 'I have a website', 'My card sends them somewhere'];

export function chooseOffers(turns: readonly Turn[]): Offer[] {
  const t = new Turns(turns);
  const any = (id: string, options: readonly string[]): boolean => options.some((o) => t.chose(id, o));

  const atMarkets = t.chose('sources', 'Craft shows and markets') || t.chose('first_place', 'A local market or craft fair');
  const marketsOften = any('market_often', OFTEN);
  const hasSite = t.chose('sources', 'My own website');
  const hasPlace = hasSite || any('found_again', HAS_PLACE);
  const readyForShop = any('stage', SELLING_WELL) && any('shipping', SHIPS) && any('where', ONLINE);

  const offers: Offer[] = [];
  if (readyForShop) offers.push('full_shop');
  if (atMarkets) {
    offers.push(...(marketsOften ? (['market', 'showcase'] as const) : (['showcase', 'market'] as const)));
  } else if (!hasPlace) {
    offers.push('showcase');
  }
  return offers;
}

/** How the offers are described to the model writing the section. */
export function offersBrief(offers: readonly Offer[]): string {
  if (offers.length === 0) return 'How I can help: leave this section empty (no offers fit this maker).';
  const names: Record<Offer, string> = { showcase: 'showcase site', market: 'market site', full_shop: 'full shop site' };
  return `How I can help: present these offers in exactly this order, the first as the one that fits best: ${offers
    .map((o, i) => `${o} (${names[o]})${i === 0 ? ' — lead' : ''}`)
    .join(', ')}.`;
}
