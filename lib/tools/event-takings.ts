/**
 * A market's own numbers (Alex, 2026-10-24): what Market day asks, kept on the event
 * when there's no till to count the sales (Free and Showcase). The booth, gas, food
 * and other costs stay in the event's costs; these are the rest. Kept as typed,
 * checked into the event_takings row, read back the same way.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatCents, parseDollars } from '@/lib/backend/catalog/product-form';
import { marketDay, type MarketResult } from './maths';

export type Takings = {
  sales: string;
  card: string;
  cardRate: string;
  materials: string;
  hoursAtMarket: string;
  hoursOther: string;
  wage: string;
};

export const EMPTY_TAKINGS: Takings = { sales: '', card: '', cardRate: '', materials: '', hoursAtMarket: '', hoursOther: '', wage: '' };

type Row = Database['public']['Tables']['event_takings']['Insert'];
type Db = SupabaseClient<Database>;

function cents(text: string, what: string): { ok: true; v: number | null } | { ok: false; error: string } {
  const d = parseDollars(text);
  return d.ok ? { ok: true, v: d.cents } : { ok: false, error: `Check ${what}, like 640 or 640.50.` };
}

function number(text: string, what: string, max: number): { ok: true; v: number | null } | { ok: false; error: string } {
  const t = text.trim();
  if (t === '') return { ok: true, v: null };
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(t) || Number(t) > max) return { ok: false, error: `Check ${what}.` };
  return { ok: true, v: Number(t) };
}

/** Her numbers as the row, or what's wrong with them. */
export function takingsRow(tenantId: string, eventId: string, t: Takings): { ok: true; row: Row } | { ok: false; error: string } {
  const sales = cents(t.sales, 'the total sales');
  if (!sales.ok) return sales;
  const card = cents(t.card, 'what was paid by card');
  if (!card.ok) return card;
  if (card.v !== null && sales.v !== null && card.v > sales.v) return { ok: false, error: 'What was paid by card can’t be more than the total sales.' };
  const rate = number(t.cardRate, 'the card fee', 100);
  if (!rate.ok) return rate;
  const materials = cents(t.materials, 'what the things you sold cost you to make');
  if (!materials.ok) return materials;
  const at = number(t.hoursAtMarket, 'the hours at the market', 9999);
  if (!at.ok) return at;
  const other = number(t.hoursOther, 'the hours driving and packing', 9999);
  if (!other.ok) return other;
  const wage = cents(t.wage, 'what an hour of your time is worth');
  if (!wage.ok) return wage;
  return {
    ok: true,
    row: { tenant_id: tenantId, event_id: eventId, sales_cents: sales.v, card_cents: card.v, card_fee_pct: rate.v, materials_cents: materials.v, hours_at_market: at.v, hours_other: other.v, hourly_pay_cents: wage.v },
  };
}

const text = (n: number | null | undefined): string => (n === null || n === undefined ? '' : String(n));

export function takingsFrom(row: Omit<Row, 'tenant_id' | 'event_id'>): Takings {
  return {
    sales: formatCents(row.sales_cents ?? null),
    card: formatCents(row.card_cents ?? null),
    cardRate: text(row.card_fee_pct),
    materials: formatCents(row.materials_cents ?? null),
    hoursAtMarket: text(row.hours_at_market),
    hoursOther: text(row.hours_other),
    wage: formatCents(row.hourly_pay_cents ?? null),
  };
}

export function hasTakings(t: Takings): boolean {
  return Object.values(t).some((v) => v.trim() !== '');
}

/** Market day for an event: her numbers with the event's costs (booth, gas and the rest). */
export function eventDay(t: Takings, costsCents: number): MarketResult {
  return marketDay({ ...t, booth: String(costsCents / 100), gas: '', food: '', other: '' });
}

export async function saveTakings(db: Db, tenantId: string, eventId: string, t: Takings): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = takingsRow(tenantId, eventId, t);
  if (!r.ok) return r;
  const { error } = await db.from('event_takings').upsert(r.row);
  if (error !== null) throw new Error(`Could not save the market’s numbers: ${error.message}`);
  return { ok: true };
}

export async function loadTakings(db: Db, tenantId: string, eventId: string): Promise<Takings | null> {
  const { data, error } = await db
    .from('event_takings')
    .select('sales_cents, card_cents, card_fee_pct, materials_cents, hours_at_market, hours_other, hourly_pay_cents')
    .eq('tenant_id', tenantId)
    .eq('event_id', eventId)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the market’s numbers: ${error.message}`);
  return data === null ? null : takingsFrom(data);
}

/** Every event's numbers for a site, by event. */
export async function loadAllTakings(db: Db, tenantId: string): Promise<Map<string, Takings>> {
  const { data, error } = await db
    .from('event_takings')
    .select('event_id, sales_cents, card_cents, card_fee_pct, materials_cents, hours_at_market, hours_other, hourly_pay_cents')
    .eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not read the markets’ numbers: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.event_id, takingsFrom(r)]));
}
