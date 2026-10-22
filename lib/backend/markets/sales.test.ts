import { describe, it, expect } from 'vitest';
import { listSalesByEvent } from './sales';

/** A Supabase stand-in: each table gives its own result; the calls are kept. */
function fakeDb(results: Record<string, { data: unknown; error: unknown }>, calls: string[]): never {
  return {
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const k of ['select', 'eq', 'not', 'in', 'order', 'limit']) {
        chain[k] = (...args: unknown[]) => {
          calls.push(`${table}.${k}(${args.map((a) => JSON.stringify(a)).join(',')})`);
          return chain;
        };
      }
      chain['then'] = (ok: (v: unknown) => unknown) => Promise.resolve(results[table]).then(ok);
      return chain;
    },
  } as never;
}

const order = (id: string, eventId: string | null, status = 'paid', created = '2026-10-18T15:00:00Z') => ({
  id,
  order_number: id,
  created_at: created,
  status,
  customer_name: 'Pat',
  total_cents: 2400,
  payment_method: 'cash',
  buyer_paid_at: null,
  event_id: eventId,
  order_items: [{ name_snapshot: 'Mug' }],
});

describe('listSalesByEvent', () => {
  it('groups market sales by event, newest event first, and skips sales with no known event', async () => {
    const calls: string[] = [];
    const groups = await listSalesByEvent(
      fakeDb(
        {
          orders: { data: [order('1', 'a'), order('2', 'b', 'refunded'), order('3', 'a', 'pending'), order('4', 'gone')], error: null },
          events: {
            data: [
              { id: 'a', name: 'Harvest Fair', event_date: '2026-09-12', end_date: null, location: 'Bristol' },
              { id: 'b', name: 'Market on the Common', event_date: '2026-10-18', end_date: '2026-10-19', location: null },
            ],
            error: null,
          },
        },
        calls,
      ),
      't1',
    );
    expect(groups.map((g) => [g.id, g.endDate, g.town, g.sales.map((s) => `${s.number}:${s.status}`)])).toEqual([
      ['b', '2026-10-19', '', ['2:refunded']],
      ['a', '', 'Bristol', ['1:paid', '3:pending']],
    ]);
    expect(calls).toContain('orders.eq("source","market_mode")');
    expect(calls).toContain('orders.in("status",["pending","paid","fulfilled","refunded"])');
  });

  it('throws a failed read of either table', async () => {
    await expect(listSalesByEvent(fakeDb({ orders: { data: null, error: { message: 'down' } }, events: { data: [], error: null } }, []), 't1')).rejects.toThrow('Could not load your sales');
    await expect(listSalesByEvent(fakeDb({ orders: { data: [], error: null }, events: { data: null, error: { message: 'down' } } }, []), 't1')).rejects.toThrow('Could not load your events');
  });

  it('gives nothing for a site with no market sales', async () => {
    expect(await listSalesByEvent(fakeDb({ orders: { data: null, error: null }, events: { data: null, error: null } }, []), 't1')).toEqual([]);
  });
});
