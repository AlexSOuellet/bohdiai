import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const sitesOf = vi.fn();
vi.mock('./server', () => ({ sitesOf: (...a: unknown[]) => sitesOf(...a) }));

import { needsOnboarding, onboardingSite } from './onboarding';

const compProbe = { next: false };

type Tenant = { id: string; status: string; plan: string | null; plan_billing: string | null; business_name: string };

/** Sites, sent forms and billing rows, as the database would answer. */
function fakeDb(tenants: Tenant[], sent: string[] = [], paidCount = 1, comp: string | null = null, compError: { message: string } | null = null) {
  const db = {
    from(table: string) {
      if (table === 'subscriptions') {
        compProbe.next = paidCount === 0;
        const chain = { select: () => chain, eq: () => Promise.resolve({ count: paidCount, error: null }) };
        return chain;
      }
      if (table === 'tenants' && compProbe.next) {
        compProbe.next = false;
        const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: compError === null ? { plan_comp: comp } : null, error: compError }) };
        return chain;
      }
      const rows = table === 'tenants' ? tenants : sent.map((tenant_id) => ({ tenant_id }));
      const chain = { select: () => chain, in: (_c: string, ids: string[]) => Promise.resolve({ data: rows.filter((r) => ids.includes('id' in r ? r.id : r.tenant_id)), error: null }) };
      return chain;
    },
  };
  return db as unknown as SupabaseClient<Database>;
}

const site = (over: Partial<Tenant> = {}): Tenant => ({ id: 't1', status: 'draft', plan: 'lite', plan_billing: 'yearly', business_name: 'Saltmarsh', ...over });

beforeEach(() => sitesOf.mockReset().mockResolvedValue([{ tenantId: 't1', draft: true, paid: true }]));

describe('onboardingSite', () => {
  it('finds the paid site that hasn’t sent its form', async () => {
    expect(await onboardingSite(fakeDb([site()]), 'u1')).toEqual({ tenantId: 't1', plan: 'lite', billing: 'yearly', businessName: 'Saltmarsh' });
    expect(sitesOf).toHaveBeenCalledWith(expect.anything(), 'u1');
  });

  it('is nothing once the form is sent', async () => {
    expect(await onboardingSite(fakeDb([site()], ['t1']), 'u1')).toBeNull();
  });

  it('is nothing on Free, which has no site', async () => {
    expect(await onboardingSite(fakeDb([site({ plan: 'free' })]), 'u1')).toBeNull();
  });

  it('is nothing before paying', async () => {
    sitesOf.mockResolvedValue([{ tenantId: 't1', draft: true, paid: false }]);
    expect(await onboardingSite(fakeDb([site()]), 'u1')).toBeNull();
  });

  it('is nothing for a live site', async () => {
    expect(await onboardingSite(fakeDb([site({ status: 'active' })]), 'u1')).toBeNull();
  });
});

describe('needsOnboarding', () => {
  it('is true for a paid site that hasn’t sent its form', async () => {
    expect(await needsOnboarding(fakeDb([site()]), 't1')).toBe(true);
  });

  it('is false with no billing (sites made before sign-up existed)', async () => {
    expect(await needsOnboarding(fakeDb([site()], [], 0), 't1')).toBe(false);
  });

  it('is false once the form is sent, and on Free', async () => {
    expect(await needsOnboarding(fakeDb([site()], ['t1']), 't1')).toBe(false);
    expect(await needsOnboarding(fakeDb([site({ plan: 'free' })]), 't1')).toBe(false);
  });
});

describe('a free site from Alex’s invite', () => {
  const draft = { id: 't1', status: 'draft', plan: 'full', plan_billing: 'monthly', business_name: 'Saltmarsh' };
  it('waits for its form with no billing at all', async () => {
    expect(await needsOnboarding(fakeDb([draft], [], 0, 'free'), 't1')).toBe(true);
  });
  it('doesn’t once the form is sent', async () => {
    expect(await needsOnboarding(fakeDb([draft], ['t1'], 0, 'free'), 't1')).toBe(false);
  });
  it('says so when the site can’t be read', async () => {
    await expect(needsOnboarding(fakeDb([draft], [], 0, null, { message: 'down' }), 't1')).rejects.toThrow('down');
  });
});
