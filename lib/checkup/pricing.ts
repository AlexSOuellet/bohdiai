import { Turns } from './bank';
import type { Turn } from './transcript';

/**
 * The pricing call, made here by rules so the same money answers always get
 * the same verdict. The model only explains it. "Some shoppers hesitate at the
 * price" is treated as normal: someone always does.
 */

export type PricingRead = 'unknown' | 'thin_nervous' | 'thin' | 'room' | 'fine';

const THIN_LEFT = ['Less than $5', '$5 to $15'];
const OK_LEFT = ['$15 to $30', 'More than $30'];
const THIN_COVER = ['About even', 'Not yet'];
const NERVOUS = ['I price low so it sells', 'I feel funny charging more'];

export function readPricing(turns: readonly Turn[]): PricingRead | null {
  const t = new Turns(turns);
  const any = (id: string, options: readonly string[]): boolean => options.some((o) => t.chose(id, o));
  if (!t.asked('left_over') && !t.asked('covers')) return null;

  const thin = any('left_over', THIN_LEFT) || any('covers', THIN_COVER);
  const ok = any('left_over', OK_LEFT) || t.chose('covers', 'Yes, with a bit left over');
  const nervous = any('price_how', NERVOUS);

  if (!thin && !ok) return 'unknown';
  if (thin) return nervous ? 'thin_nervous' : 'thin';
  return nervous ? 'room' : 'fine';
}

const GUIDANCE: Readonly<Record<PricingRead, string>> = {
  unknown:
    "They haven't worked out what's left after supplies. The first step is to work it out on a few pieces before changing any prices.",
  thin_nervous:
    'Very little is left after supplies, and they price low out of nerves (to make sure it sells, or because charging more feels funny). They are likely underpriced. Suggest testing a higher price on new pieces first, and say plainly that pricing low to sell usually costs more than it gains.',
  thin: 'Very little is left after supplies. Look at both sides: what the supplies cost and what they charge. Suggest working out a price that leaves a real amount, tested on new pieces first.',
  room: "Their numbers are reasonable, but they price low out of nerves. This is a mixed read: say both sides. The price isn't broken, but they may have room to charge more; suggest testing a little higher on new pieces and watching what happens.",
  fine: "Their price looks fine. Say so, and don't suggest raising it. If it helps, point to value instead (the story behind a piece, what makes it different, a lower-priced piece on the table so there's something for everyone).",
};

/** The pricing call as the model reads it. */
export function pricingBrief(read: PricingRead | null): string {
  if (read === null) return 'Pricing read: no money answers were given; leave pricing out unless something they said calls for it.';
  return `Pricing read (decided for you, explain it in your own words): ${GUIDANCE[read]} Shoppers hesitating at the price is normal and is not evidence either way.`;
}
