/**
 * What each tool's form holds (Alex, 2026-10-28): the tools are separate
 * screens, each starting blank and run on its own. A link at the bottom of each
 * opens the next one; from Cost to make, it carries the piece's cost into Price it
 * (lib/tools/handoff.ts). Nothing else is shared between them.
 */
import type { BatchSupply, Channel, GoalInput, Markup, PieceItem, ShipInput, WorthInput } from './maths';
import type { CostSettings } from './product-costs';

export type CostForm = { name: string; yield: string; batch: BatchSupply[]; piece: PieceItem[]; hours: string; rate: string };

/** Cost to make's batch and time, carried into Price it so a product saved there keeps them. */
export type CostCarry = Omit<CostSettings, 'extras' | 'markup'>;

export type PriceForm = {
  name: string;
  materials: string;
  time: string;
  extras: string;
  markup: Markup;
  channels: Channel[];
  etsyPct: string;
  etsyFix: string;
  haggle: string;
  sitePct: string;
  siteFix: string;
  consignPct: string;
  consignRent: string;
  consignSold: string;
  low: string;
  high: string;
};

export type WorthForm = WorthInput & { name: string };

export const BLANK_SUPPLY: BatchSupply = { name: '', paid: '', lasts: '1' };
export const BLANK_ITEM: PieceItem = { name: '', each: '' };

export const BLANK_COST: CostForm = { name: '', yield: '', batch: [BLANK_SUPPLY], piece: [BLANK_ITEM], hours: '', rate: '20' };

/** Etsy's US fees and a card reader's rate as they stand (Alex's toolkit); she can change them. */
export const BLANK_PRICE: PriceForm = {
  name: '',
  materials: '',
  time: '',
  extras: '',
  markup: 2.5,
  channels: ['markets'],
  etsyPct: '9.5',
  etsyFix: '0.45',
  haggle: '15',
  sitePct: '3',
  siteFix: '0.30',
  consignPct: '30',
  consignRent: '0',
  consignSold: '10',
  low: '',
  high: '',
};

export const BLANK_GOAL: GoalInput = { goal: '', price: '', made: '', perMarket: '' };

/** A card reader's rate as it stands; she can change it. */
export const BLANK_SHIP: ShipInput = { box: '', padding: '', postage: '', cardRate: '3' };

export const BLANK_WORTH: WorthForm = { name: '', booth: '', gas: '', food: '', other: '', hoursAtMarket: '', hoursOther: '', wage: '20', price: '', made: '', cardShare: '', cardRate: '3', guess: '' };

/** What a product keeps of the tools: Cost to make's batch and time, with Price it's other costs and markup. */
export function toolCosts(carry: CostCarry, price: Pick<PriceForm, 'extras' | 'markup'>): CostSettings {
  return { ...carry, extras: price.extras, markup: price.markup };
}

/** Cost to make's form as something Price it can carry. */
export function carryOf(cost: CostForm): CostCarry {
  return { yield: cost.yield, hours: cost.hours, rate: cost.rate, batch: cost.batch, piece: cost.piece };
}
