/**
 * How a shop takes money at a market (Market POS piece 2): the owner's payment
 * settings, checked, and the links that open Venmo or Cash App with her handle and
 * the amount already filled in. None of these apps tells us a payment arrived; the
 * owner confirms it herself. Spec: docs/superpowers/specs/2026-10-07-market-pos-design.md
 */

export type PayMethod = 'venmo' | 'cashapp' | 'zelle' | 'cash';
export const PAY_METHODS: readonly PayMethod[] = ['venmo', 'cashapp', 'zelle', 'cash'];
export const METHOD_LABEL: Readonly<Record<PayMethod | 'card', string>> = {
  venmo: 'Venmo',
  cashapp: 'Cash App',
  zelle: 'Zelle',
  cash: 'Cash',
  card: 'Card',
};

export function isPayMethod(v: unknown): v is PayMethod {
  return (PAY_METHODS as readonly unknown[]).includes(v);
}

/** What the owner saved. Handles are stored without "@" or "$". */
export type PaySettings = {
  venmo: string;
  venmoOn: boolean;
  cashapp: string;
  cashappOn: boolean;
  zelle: string;
  zelleOn: boolean;
  cashOn: boolean;
};

export const EMPTY_PAY: PaySettings = { venmo: '', venmoOn: false, cashapp: '', cashappOn: false, zelle: '', zelleOn: false, cashOn: true };

export type PayRow = {
  venmo: string | null;
  venmo_on: boolean;
  cashapp: string | null;
  cashapp_on: boolean;
  zelle: string | null;
  zelle_on: boolean;
  cash_on: boolean;
};

export function paySettingsFromRow(r: PayRow | null): PaySettings {
  if (r === null) return EMPTY_PAY;
  return { venmo: r.venmo ?? '', venmoOn: r.venmo_on, cashapp: r.cashapp ?? '', cashappOn: r.cashapp_on, zelle: r.zelle ?? '', zelleOn: r.zelle_on, cashOn: r.cash_on };
}

/** The methods a buyer may pick, in the order shown. */
export function methodsOn(s: PaySettings): PayMethod[] {
  return PAY_METHODS.filter((m) => (m === 'venmo' ? s.venmoOn : m === 'cashapp' ? s.cashappOn : m === 'zelle' ? s.zelleOn : s.cashOn));
}

/** The owner's typed settings, checked into the row to save. */
export function buildPayRow(s: PaySettings): { ok: true; row: PayRow } | { ok: false; error: string } {
  const venmo = s.venmo.trim().replace(/^@/, '');
  const cashapp = s.cashapp.trim().replace(/^\$/, '');
  const zelle = s.zelle.trim();
  if (venmo !== '' && !/^[A-Za-z0-9_-]{1,30}$/.test(venmo)) return { ok: false, error: 'A Venmo username is letters, numbers, dashes or underscores, like Renee-Mazzone.' };
  if (cashapp !== '' && !/^[A-Za-z][A-Za-z0-9_-]{0,19}$/.test(cashapp)) return { ok: false, error: 'A Cash App $cashtag starts with a letter, like $RoseNCat.' };
  if (zelle !== '' && (zelle.length < 3 || zelle.length > 254)) return { ok: false, error: 'Type the phone number or email your Zelle uses.' };
  if (s.venmoOn && venmo === '') return { ok: false, error: 'Add your Venmo username to turn Venmo on.' };
  if (s.cashappOn && cashapp === '') return { ok: false, error: 'Add your $cashtag to turn Cash App on.' };
  if (s.zelleOn && zelle === '') return { ok: false, error: 'Add your Zelle phone or email to turn Zelle on.' };
  return {
    ok: true,
    row: {
      venmo: venmo === '' ? null : venmo,
      venmo_on: s.venmoOn,
      cashapp: cashapp === '' ? null : cashapp,
      cashapp_on: s.cashappOn,
      zelle: zelle === '' ? null : zelle,
      zelle_on: s.zelleOn,
      cash_on: s.cashOn,
    },
  };
}

const dollars = (cents: number): string => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

/** Opens Venmo (the app on a phone) to pay her the amount, with a note. */
export function venmoLink(username: string, cents: number, note: string): string {
  return `https://venmo.com/${encodeURIComponent(username)}?txn=pay&amount=${dollars(cents)}&note=${encodeURIComponent(note)}`;
}

/** Opens Cash App to pay her $cashtag the amount. */
export function cashAppLink(cashtag: string, cents: number): string {
  return `https://cash.app/$${encodeURIComponent(cashtag)}/${dollars(cents)}`;
}
