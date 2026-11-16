import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const currentSubscription = vi.fn();
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription }));
const { suspendSite, unsuspendSite, siteSuspended } = await import('./suspend');

/** A site record that answers reads and keeps every update made to it. */
function fakeDb(row: { status: string; suspended_from?: string | null }, failUpdate = false) {
  const updates: Record<string, unknown>[] = [];
  const db = {
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: { ...row }, error: null }),
        update: (patch: Record<string, unknown>) => {
          updates.push(patch);
          const done = {
            eq: () => done,
            then: (ok: (v: unknown) => unknown) =>
              Promise.resolve({ error: failUpdate ? { message: 'down' } : null }).then(ok),
          };
          return done;
        },
      };
      return chain;
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, updates };
}

function fakeStripe(fail = false) {
  const calls: unknown[] = [];
  const s = {
    subscriptions: {
      update: async (_id: string, params: unknown) => {
        if (fail) throw new Error('stripe down');
        calls.push(params);
        return {};
      },
    },
  };
  return { s: s as unknown as Stripe, calls };
}

const SUB = { stripeId: 'sub_1', customerId: 'cus_1' };

describe('suspendSite (go-live step 3, Alex 2026-11-16)', () => {
  it('pauses billing (nothing already paid refunded), then takes the site down and remembers how it was', async () => {
    currentSubscription.mockResolvedValue(SUB);
    const { db, updates } = fakeDb({ status: 'active' });
    const { s, calls } = fakeStripe();
    expect(await suspendSite(db, s, 't1', 'Vapes for sale')).toEqual({ ok: true });
    expect(calls).toEqual([{ pause_collection: { behavior: 'void' } }]);
    expect(updates[0]).toMatchObject({
      status: 'suspended',
      suspended_from: 'active',
      suspended_reason: 'Vapes for sale',
    });
  });

  it('changes nothing when Stripe won’t pause', async () => {
    currentSubscription.mockResolvedValue(SUB);
    const { db, updates } = fakeDb({ status: 'active' });
    const r = await suspendSite(db, fakeStripe(true).s, 't1', 'x');
    expect(r.ok).toBe(false);
    expect(updates).toEqual([]);
  });

  it('starts billing again if the site record can’t be saved', async () => {
    currentSubscription.mockResolvedValue(SUB);
    const { db } = fakeDb({ status: 'offline' }, true);
    const { s, calls } = fakeStripe();
    expect((await suspendSite(db, s, 't1', 'x')).ok).toBe(false);
    expect(calls).toEqual([{ pause_collection: { behavior: 'void' } }, { pause_collection: '' }]);
  });

  it('a site with no subscription (free, hand-built) is suspended with nothing to pause', async () => {
    currentSubscription.mockResolvedValue(null);
    const { db, updates } = fakeDb({ status: 'draft' });
    const { s, calls } = fakeStripe();
    expect(await suspendSite(db, s, 't1', 'x')).toEqual({ ok: true });
    expect(calls).toEqual([]);
    expect(updates[0]).toMatchObject({ suspended_from: 'draft' });
  });

  it('won’t suspend twice, or a closed site', async () => {
    expect(
      await suspendSite(fakeDb({ status: 'suspended' }).db, fakeStripe().s, 't1', 'x'),
    ).toEqual({ ok: false, error: 'That site is already suspended.' });
    expect(await suspendSite(fakeDb({ status: 'closed' }).db, fakeStripe().s, 't1', 'x')).toEqual({
      ok: false,
      error: 'That site is closed.',
    });
  });
});

describe('unsuspendSite', () => {
  it('starts billing again and puts the site back exactly as it was', async () => {
    currentSubscription.mockResolvedValue(SUB);
    const { db, updates } = fakeDb({ status: 'suspended', suspended_from: 'active' });
    const { s, calls } = fakeStripe();
    expect(await unsuspendSite(db, s, 't1')).toEqual({ ok: true });
    expect(calls).toEqual([{ pause_collection: '' }]);
    expect(updates[0]).toEqual({
      status: 'active',
      suspended_from: null,
      suspended_reason: null,
      suspended_at: null,
    });
  });

  it('a site whose term ended while suspended comes back offline', async () => {
    currentSubscription.mockResolvedValue(null);
    const { db, updates } = fakeDb({ status: 'suspended', suspended_from: 'offline' });
    await unsuspendSite(db, fakeStripe().s, 't1');
    expect(updates[0]).toMatchObject({ status: 'offline' });
  });

  it('leaves it suspended when Stripe won’t start billing again', async () => {
    currentSubscription.mockResolvedValue(SUB);
    const { db, updates } = fakeDb({ status: 'suspended', suspended_from: 'active' });
    expect((await unsuspendSite(db, fakeStripe(true).s, 't1')).ok).toBe(false);
    expect(updates).toEqual([]);
  });

  it('says so for a site that isn’t suspended', async () => {
    expect(await unsuspendSite(fakeDb({ status: 'active' }).db, fakeStripe().s, 't1')).toEqual({
      ok: false,
      error: 'That site isn’t suspended.',
    });
  });
});

describe('siteSuspended', () => {
  it('reads the site’s status', async () => {
    expect(await siteSuspended(fakeDb({ status: 'suspended' }).db, 't1')).toBe(true);
    expect(await siteSuspended(fakeDb({ status: 'active' }).db, 't1')).toBe(false);
  });
});
