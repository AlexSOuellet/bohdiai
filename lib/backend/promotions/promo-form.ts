/**
 * Promotions in the backend — what the owner types, checked into the row to save.
 * A sale: a name, a percent off every piece, optional first and last day. A code:
 * the code shoppers type, a percent or a dollar amount off the order, optional
 * days and an optional number of uses.
 */
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { isCalendarDate } from '@/lib/backend/dates/dates-form';
import { isRunning, normalizeCode, offLabel, type Promotion } from '@/lib/storefront/promotions';

export type PromoKind = 'sale' | 'code';

export type PromoForm = {
  kind: PromoKind;
  name: string;
  code: string;
  amountType: 'percent' | 'dollars';
  amount: string;
  startsOn: string;
  endsOn: string;
  maxUses: string;
};

export type PromoRow = {
  kind: PromoKind;
  name: string;
  code: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  starts_on: string | null;
  ends_on: string | null;
  max_uses: number | null;
};

export const PROMOS_LIMIT = 30;

export const EMPTY_PROMO: PromoForm = {
  kind: 'code',
  name: '',
  code: '',
  amountType: 'percent',
  amount: '',
  startsOn: '',
  endsOn: '',
  maxUses: '',
};

const tidy = (s: string): string => s.trim().replace(/\s+/g, ' ');

export function buildPromoRow(form: PromoForm): { ok: true; row: PromoRow } | { ok: false; error: string } {
  const code = form.kind === 'code' ? normalizeCode(form.code) : null;
  if (code !== null && !/^[A-Z0-9-]{3,20}$/.test(code)) {
    return { ok: false, error: 'A code is 3 to 20 letters, numbers or dashes, like MARKET10.' };
  }
  const name = tidy(form.name) === '' && code !== null ? code : tidy(form.name);
  if (name === '') return { ok: false, error: 'Give the sale a name shoppers will see, like Fall Sale.' };
  if (name.length > 60) return { ok: false, error: `The name is ${name.length} characters. Keep it to 60.` };

  let percent: number | null = null;
  let cents: number | null = null;
  if (form.kind === 'sale' || form.amountType === 'percent') {
    const t = form.amount.trim().replace(/%$/, '');
    if (!/^\d{1,2}$/.test(t) || Number(t) < 1 || Number(t) > 90) {
      return { ok: false, error: 'The percent off is a whole number from 1 to 90.' };
    }
    percent = Number(t);
  } else {
    const d = parseDollars(form.amount);
    if (!d.ok || d.cents === null || d.cents < 100 || d.cents > 100000) {
      return { ok: false, error: 'The amount off is from $1 to $1,000, like 10 or 12.50.' };
    }
    cents = d.cents;
  }

  const startsOn = form.startsOn.trim();
  const endsOn = form.endsOn.trim();
  if (startsOn !== '' && !isCalendarDate(startsOn)) return { ok: false, error: 'Pick the first day, or leave it empty to start now.' };
  if (endsOn !== '' && !isCalendarDate(endsOn)) return { ok: false, error: 'Pick the last day, or leave it empty to keep it going.' };
  if (startsOn !== '' && endsOn !== '' && endsOn < startsOn) {
    return { ok: false, error: 'The last day comes before the first day. Check the two days.' };
  }

  let maxUses: number | null = null;
  if (form.kind === 'code' && form.maxUses.trim() !== '') {
    const t = form.maxUses.trim();
    if (!/^\d{1,6}$/.test(t) || Number(t) < 1 || Number(t) > 100000) {
      return { ok: false, error: 'The number of uses is a whole number, like 25. Leave it empty for no limit.' };
    }
    maxUses = Number(t);
  }

  return {
    ok: true,
    row: {
      kind: form.kind,
      name,
      code,
      percent_off: percent,
      amount_off_cents: cents,
      starts_on: startsOn === '' ? null : startsOn,
      ends_on: endsOn === '' ? null : endsOn,
      max_uses: maxUses,
    },
  };
}

/** A saved promotion back in the form, for changing it. */
export function promoFormFrom(p: Promotion): PromoForm {
  const cents = p.amountOffCents ?? 0;
  return {
    kind: p.kind,
    name: p.kind === 'code' && p.name === p.code ? '' : p.name,
    code: p.code ?? '',
    amountType: p.percentOff !== null ? 'percent' : 'dollars',
    amount: p.percentOff !== null ? String(p.percentOff) : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2),
    startsOn: p.startsOn ?? '',
    endsOn: p.endsOn ?? '',
    maxUses: p.maxUses === null ? '' : String(p.maxUses),
  };
}

export type PromoState = 'running' | 'paused' | 'scheduled' | 'ended' | 'used-up';

export const STATE_LABEL: Readonly<Record<PromoState, string>> = {
  running: 'Running',
  paused: 'Paused',
  scheduled: 'Starts later',
  ended: 'Ended',
  'used-up': 'Used up',
};

export function promoState(p: Promotion, today: string): PromoState {
  if (!p.active) return 'paused';
  if (p.startsOn !== null && today < p.startsOn) return 'scheduled';
  if (p.endsOn !== null && today > p.endsOn) return 'ended';
  if (p.maxUses !== null && p.uses >= p.maxUses) return 'used-up';
  return isRunning(p, today) ? 'running' : 'ended';
}

/** "10% off every piece" / "$15 off the order", for the owner's list. */
export function promoSummary(p: Promotion): string {
  return p.kind === 'sale' ? `${offLabel(p)} every piece` : `${offLabel(p)} the order`;
}
