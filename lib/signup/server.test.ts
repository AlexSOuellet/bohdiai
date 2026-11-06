import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type * as StripeModule from '@/lib/billing/stripe';

const findUserByEmail = vi.fn();
const confirmSite = vi.fn();
const startCheckout = vi.fn();
const checkPromo = vi.fn();
vi.mock('@/lib/billing/promos', () => ({ checkPromo: (...a: unknown[]) => checkPromo(...a) }));
vi.mock('@/lib/backend/user-lookup', () => ({ findUserByEmail: (...a: unknown[]) => findUserByEmail(...a) }));
vi.mock('./after-paid', () => ({ confirmSite: (...a: unknown[]) => confirmSite(...a) }));
vi.mock('@/lib/billing/checkout', () => ({ startCheckout: (...a: unknown[]) => startCheckout(...a) }));
vi.mock('@/lib/billing/stripe', async (orig) => ({ ...(await orig<typeof StripeModule>()), stripe: () => ({}) }));

import { signupDeps, sitesOf, startPlanId, unconfirmedSignIn } from './server';

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

describe('a promo code at sign-up', () => {
  const fields = { plan: 'lite', billing: 'monthly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'lena@example.com', promoCode: 'SPRING10' } as const;
  const deps = () => signupDeps(fakeDb([], []), 'https://bohdiai.com');
  const promo = { code: 'SPRING10', percent: 10, months: null, audience: 'new', expires: null, maxUses: null };

  beforeEach(() => {
    checkPromo.mockReset();
    startCheckout.mockReset();
  });

  it('has nothing to check when the box is blank', async () => {
    expect(await deps().promoProblem({ ...fields, promoCode: '' })).toBeNull();
    expect(checkPromo).not.toHaveBeenCalled();
  });
  it('has nothing to discount on Free', async () => {
    expect(await deps().promoProblem({ ...fields, plan: 'free' })).toBe('promoFree');
  });
  it('checks it as a new sign-up', async () => {
    checkPromo.mockResolvedValue({ ok: true, promo });
    expect(await deps().promoProblem(fields)).toBeNull();
    expect(checkPromo).toHaveBeenCalledWith({}, expect.anything(), { code: 'SPRING10', email: 'lena@example.com', tenantId: null, isNew: true });
  });
  it('says when it’s been used, and when it’s no good', async () => {
    checkPromo.mockResolvedValue({ ok: false, why: 'used' });
    expect(await deps().promoProblem(fields)).toBe('promoUsed');
    checkPromo.mockResolvedValue({ ok: false, why: 'unknown' });
    expect(await deps().promoProblem(fields)).toBe('promoBad');
  });
  it('hands the checked code to Stripe’s page', async () => {
    checkPromo.mockResolvedValue({ ok: true, promo });
    startCheckout.mockResolvedValue('https://checkout.stripe.com/c/cs_3');
    await deps().checkout('t1', fields);
    expect(startCheckout).toHaveBeenCalledWith({}, expect.objectContaining({ promo }));
  });
  it('stops rather than charge full price when the code ended mid-sign-up', async () => {
    checkPromo.mockResolvedValue({ ok: false, why: 'unknown' });
    await expect(deps().checkout('t1', fields)).rejects.toThrow('stopped being valid');
    expect(startCheckout).not.toHaveBeenCalled();
  });
});

describe('sitesOf', () => {
  it('counts a free site as paid for, so an invited maker reaches the site form', async () => {
    const db = {
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => Promise.resolve({ data: [], error: null }),
          then: (ok: (v: unknown) => unknown) => Promise.resolve({ data: [{ tenant_id: 't1', tenants: { status: 'draft', plan_comp: 'free' } }, { tenant_id: 't2', tenants: { status: 'draft', plan_comp: null } }], error: null }).then(ok),
        };
        return chain;
      },
    } as unknown as SupabaseClient<Database>;
    expect(await sitesOf(db, 'u1')).toEqual([
      { tenantId: 't1', draft: true, paid: true },
      { tenantId: 't2', draft: true, paid: false },
    ]);
  });
});
