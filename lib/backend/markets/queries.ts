/** Market reads for the backend, through the owner's own client (RLS applies). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatPrice } from '@/lib/storefront/catalog';
import type { GoBack, MarketForm } from './market-form';

type Db = SupabaseClient<Database>;

const COLUMNS =
  'id, name, event_date, end_date, hours, location, address, booth, url, status, organizer_name, organizer_phone, organizer_email, notes, rating, go_back, review, created_at, event_expenses(description, amount_cents, created_at)';

export type MarketRowView = {
  id: string;
  name: string;
  date: string;
  endDate: string;
  town: string;
  canceled: boolean;
  rating: number;
  costs: string;
};

const asGoBack = (v: string | null): GoBack | '' => (v === 'yes' || v === 'maybe' || v === 'no' ? v : '');

export async function listMarkets(db: Db, tenantId: string): Promise<MarketRowView[]> {
  const { data, error } = await db
    .from('events')
    .select('id, name, event_date, end_date, location, status, rating, event_expenses(amount_cents)')
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load your markets: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    date: r.event_date,
    endDate: r.end_date ?? '',
    town: r.location ?? '',
    canceled: r.status === 'canceled',
    rating: r.rating ?? 0,
    costs: formatPrice(r.event_expenses.reduce((s, e) => s + e.amount_cents, 0)),
  }));
}

export async function getMarket(db: Db, tenantId: string, id: string): Promise<MarketForm | null> {
  const { data: r, error } = await db.from('events').select(COLUMNS).eq('tenant_id', tenantId).eq('id', id).maybeSingle();
  if (error !== null) throw new Error(`Could not load the market: ${error.message}`);
  if (r === null) return null;
  const cents = (c: number): string => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));
  return {
    id: r.id,
    name: r.name,
    date: r.event_date,
    endDate: r.end_date ?? '',
    hours: r.hours ?? '',
    town: r.location ?? '',
    address: r.address ?? '',
    booth: r.booth ?? '',
    url: r.url ?? '',
    canceled: r.status === 'canceled',
    costs: [...r.event_expenses]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({ description: e.description, amount: cents(e.amount_cents) })),
    organizerName: r.organizer_name ?? '',
    organizerPhone: r.organizer_phone ?? '',
    organizerEmail: r.organizer_email ?? '',
    notes: r.notes ?? '',
    rating: r.rating ?? 0,
    goBack: asGoBack(r.go_back),
    review: r.review ?? '',
    listingIds: [],
  };
}
