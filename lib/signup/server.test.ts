import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type * as StripeModule from '@/lib/billing/stripe';

const findUserByEmail = vi.fn();
const confirmSite = vi.fn();
const startCheckout = vi.fn();
vi.mock('@/lib/backend/user-lookup', () => ({ findUserByEmail: (...a: unknown[]) => findUserByEmail(...a) }));
vi.mock('./after-paid', () => ({ confirmSite: (...a: unknown[]) => confirmSite(...a) }));
vi.mock('@/lib/billing/checkout', () => ({ startCheckout: (...a: unknown[]) => startCheckout(...a) }));
vi.mock('@/lib/billing/stripe', async (orig) => ({ ...(await orig<typeof StripeModule>()), stripe: () => ({}) }));

import { startPlanId, unconfirmedSignIn } from './server';

/** Members, billing and the site's plan, as the database would answer. */
function fakeDb(members: { tenant_id: string; status: string }[], paid: string[], plan = { plan: 'lite', plan_billing: 'yearly', business_name: 'Saltmarsh', contact_email: 'lena@example.com' }) {
  const table = () => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => Promise.resolve({ data: paid.map((tenant_id) => ({ tenant_id })), error: null }),
      single: () => Promise.resolve({ data: plan, error: null }),
      then: (ok: (v: unknown) => unknown) => Promise.resolve({ data: members.map((m) => ({ tenant_id: m.tenant_id, tenants: { status: m.status } })), error: null }).then(ok),
    };
    return chain;
  };
  return { from: table } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  for (const f of [findUserByEmail, confirmSite, startCheckout]) f.mockReset();
  findUserByEmail.mockResolvedValue({ id: 'u1' });
  startCheckout.mockResolvedValue('https://checkout.stripe.com/c/cs_2');
});

describe('unconfirmedSignIn', () => {
  it('sends someone who never finished paying back to Stripe, on the plan they picked', async () => {
    const next = await unconfirmedSignIn(fakeDb([{ tenant_id: 't1', status: 'draft' }], []), 'lena@example.com', 'https://bohdiai.com');
    expect(next).toEqual({ kind: 'pay', url: 'https://checkout.stripe.com/c/cs_2' });
    expect(startCheckout).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ tenantId: 't1', plan: 'lite', billing: 'yearly', paidUrl: 'https://bohdiai.com/start/paid?session={CHECKOUT_SESSION_ID}' }),
    );
    expect(confirmSite).not.toHaveBeenCalled();
  });

  it('sends someone who paid a fresh confirmation link', async () => {
    const next = await unconfirmedSignIn(fakeDb([{ tenant_id: 't1', status: 'draft' }], ['t1']), 'lena@example.com', 'https://bohdiai.com');
    expect(next).toEqual({ kind: 'confirm' });
    expect(confirmSite).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it('only asks them to confirm when there is no account to look at', async () => {
    findUserByEmail.mockResolvedValue(null);
    expect(await unconfirmedSignIn(fakeDb([], []), 'x@example.com', 'https://bohdiai.com')).toEqual({ kind: 'confirm' });
    expect(confirmSite).not.toHaveBeenCalled();
  });
});

describe('startPlanId', () => {
  it('names the plan the way bohdiai.com/start reads it', () => {
    expect(startPlanId({ plan: 'free' })).toBe('maker-free');
    expect(startPlanId({ plan: 'full' })).toBe('maker-full');
  });
});
