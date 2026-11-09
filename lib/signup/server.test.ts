import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
const applyPlan = vi.fn();
const addShopOwner = vi.fn();
const signInWithPassword = vi.fn();
const createClient = vi.fn();
const logError = vi.fn();
vi.mock('@/lib/backend/plan/apply', () => ({ applyPlan: (...a: unknown[]) => applyPlan(...a) }));
vi.mock('@/lib/auth/membership', () => ({ addShopOwner: (...a: unknown[]) => addShopOwner(...a) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: (...a: unknown[]) => createClient(...a) }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: (...a: unknown[]) => logError(...a) } }));

import { createSite, signupDeps, sitesOf, startPlanId, unconfirmedSignIn } from './server';

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

type Answer = { data: unknown; error: { message: string; code?: string } | null };
type Call = { table: string; op: string; args: unknown[] };

/** A database that answers each finished query from `answer`, and keeps every call. */
function scriptedDb(answer: (table: string, ops: string[]) => Answer) {
  const calls: Call[] = [];
  const db = {
    from: (table: string) => {
      const ops: string[] = [];
      const finish = () => Promise.resolve(answer(table, ops));
      const chain: Record<string, unknown> = {};
      for (const op of ['select', 'eq', 'insert', 'update', 'delete']) {
        chain[op] = (...args: unknown[]) => {
          ops.push(op);
          calls.push({ table, op, args });
          return chain;
        };
      }
      chain['in'] = (...args: unknown[]) => {
        ops.push('in');
        calls.push({ table, op: 'in', args });
        return finish();
      };
      chain['single'] = () => {
        ops.push('single');
        return finish();
      };
      chain['maybeSingle'] = () => {
        ops.push('maybeSingle');
        return finish();
      };
      chain['then'] = (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => finish().then(ok, bad);
      return chain;
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, calls };
}

const ok: Answer = { data: null, error: null };
const signup = { plan: 'lite', billing: 'yearly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'lena@example.com', promoCode: '' } as const;

describe('createSite', () => {
  beforeEach(() => {
    applyPlan.mockReset().mockResolvedValue({ ok: true });
    addShopOwner.mockReset().mockResolvedValue(undefined);
  });

  it('makes a draft site at the business name, puts it on the plan and gives it to the maker', async () => {
    const { db, calls } = scriptedDb((_t, ops) => {
      if (ops.includes('maybeSingle')) return { data: null, error: null };
      if (ops.includes('insert')) return { data: { id: 't9' }, error: null };
      return ok;
    });
    expect(await createSite(db, 'u1', signup)).toBe('t9');
    const insert = calls.find((c) => c.op === 'insert');
    expect(insert?.args[0]).toEqual({ subdomain: 'saltmarsh', business_name: 'Saltmarsh', tier: 'basic', types: ['seller'], status: 'draft', contact_email: 'lena@example.com' });
    expect(calls.find((c) => c.op === 'update')?.args[0]).toEqual({ plan_billing: 'yearly' });
    expect(applyPlan).toHaveBeenCalledWith(db, 't9', 'lite');
    expect(addShopOwner).toHaveBeenCalledWith('u1', 't9');
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('stores no billing choice for a Free site', async () => {
    const { db, calls } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: { id: 't9' }, error: null } : ok));
    await createSite(db, 'u1', { ...signup, plan: 'free' });
    expect(calls.find((c) => c.op === 'update')?.args[0]).toEqual({ plan_billing: null });
    expect(applyPlan).toHaveBeenCalledWith(db, 't9', 'free');
  });

  it('skips an address that is already taken', async () => {
    const { db, calls } = scriptedDb((_t, ops) => {
      if (ops.includes('maybeSingle')) {
        const checks = calls.filter((c) => c.op === 'eq' && c.args[0] === 'subdomain');
        return { data: checks.length === 1 ? { id: 'other' } : null, error: null };
      }
      if (ops.includes('insert')) return { data: { id: 't9' }, error: null };
      return ok;
    });
    await createSite(db, 'u1', signup);
    expect((calls.find((c) => c.op === 'insert')?.args[0] as { subdomain: string }).subdomain).toBe('saltmarsh-2');
  });

  it('tries again when another sign-up took the same address at the same moment', async () => {
    let inserts = 0;
    const { db } = scriptedDb((_t, ops) => {
      if (ops.includes('insert')) {
        inserts += 1;
        return inserts === 1 ? { data: null, error: { message: 'duplicate key', code: '23505' } } : { data: { id: 't9' }, error: null };
      }
      return ok;
    });
    expect(await createSite(db, 'u1', signup)).toBe('t9');
    expect(inserts).toBe(2);
  });

  it('gives up after two clashes in a row', async () => {
    const { db } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: null, error: { message: 'duplicate key', code: '23505' } } : ok));
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('Could not find a free web address');
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('says when the address check fails', async () => {
    const { db } = scriptedDb((_t, ops) => (ops.includes('maybeSingle') ? { data: null, error: { message: 'timeout' } } : ok));
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('Could not check the web address: timeout');
  });

  it('says when the site record cannot be made', async () => {
    const { db } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: null, error: { message: 'denied', code: '42501' } } : ok));
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('Could not make the site record: denied');
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('removes the new site when its billing choice cannot be saved', async () => {
    const { db, calls } = scriptedDb((_t, ops) => {
      if (ops.includes('insert')) return { data: { id: 't9' }, error: null };
      if (ops.includes('update')) return { data: null, error: { message: 'locked' } };
      return ok;
    });
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('Could not save the billing choice: locked');
    const del = calls.findIndex((c) => c.op === 'delete');
    expect(del).toBeGreaterThan(-1);
    expect(calls[del + 1]).toEqual({ table: 'tenants', op: 'eq', args: ['id', 't9'] });
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('removes the new site when it cannot be put on its plan', async () => {
    applyPlan.mockResolvedValue({ ok: false, error: 'switches: nope' });
    const { db, calls } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: { id: 't9' }, error: null } : ok));
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('Could not put the site on its plan: switches: nope');
    expect(calls.some((c) => c.op === 'delete')).toBe(true);
    expect(addShopOwner).not.toHaveBeenCalled();
  });

  it('removes the new site when the maker cannot be made its owner', async () => {
    addShopOwner.mockRejectedValue(new Error('membership failed'));
    const { db, calls } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: { id: 't9' }, error: null } : ok));
    await expect(createSite(db, 'u1', signup)).rejects.toThrow('membership failed');
    expect(calls.some((c) => c.op === 'delete')).toBe(true);
  });
});

describe('setPlan', () => {
  beforeEach(() => {
    applyPlan.mockReset().mockResolvedValue({ ok: true });
  });

  it('saves the billing choice and the plan for an existing site', async () => {
    const { db, calls } = scriptedDb(() => ok);
    await signupDeps(db, 'https://bohdiai.com').setPlan('t1', { ...signup, plan: 'full', billing: 'monthly' });
    expect(calls.find((c) => c.op === 'update')?.args[0]).toEqual({ plan_billing: 'monthly' });
    expect(calls.find((c) => c.op === 'eq')?.args).toEqual(['id', 't1']);
    expect(applyPlan).toHaveBeenCalledWith(db, 't1', 'full');
  });
});

describe('sitesOf, when something goes wrong or there is nothing', () => {
  it('has no sites for an account that owns none, and never reads billing', async () => {
    const { db, calls } = scriptedDb(() => ({ data: [], error: null }));
    expect(await sitesOf(db, 'u1')).toEqual([]);
    expect(calls.some((c) => c.table === 'subscriptions')).toBe(false);
  });

  it('treats no answer as no sites', async () => {
    const { db } = scriptedDb(() => ({ data: null, error: null }));
    expect(await sitesOf(db, 'u1')).toEqual([]);
  });

  it('says when the account’s sites cannot be read', async () => {
    const { db } = scriptedDb(() => ({ data: null, error: { message: 'offline' } }));
    await expect(sitesOf(db, 'u1')).rejects.toThrow("Could not read the account's sites: offline");
  });

  it('says when billing cannot be read', async () => {
    const { db } = scriptedDb((table) =>
      table === 'subscriptions' ? { data: null, error: { message: 'offline' } } : { data: [{ tenant_id: 't1', tenants: { status: 'draft', plan_comp: null } }], error: null },
    );
    await expect(sitesOf(db, 'u1')).rejects.toThrow('Could not read billing: offline');
  });

  it('counts a subscription as paid, a published site as not a draft, and no billing answer as unpaid', async () => {
    const members = { data: [{ tenant_id: 't1', tenants: { status: 'live', plan_comp: null } }, { tenant_id: 't2', tenants: null }], error: null };
    const { db } = scriptedDb((table) => (table === 'subscriptions' ? { data: [{ tenant_id: 't1' }], error: null } : members));
    expect(await sitesOf(db, 'u1')).toEqual([
      { tenantId: 't1', draft: false, paid: true },
      { tenantId: 't2', draft: false, paid: false },
    ]);
    const { db: none } = scriptedDb((table) => (table === 'subscriptions' ? { data: null, error: null } : members));
    expect((await sitesOf(none, 'u1')).map((s) => s.paid)).toEqual([false, false]);
  });
});

describe('unconfirmedSignIn, the edges', () => {
  const members = (rows: { tenant_id: string; status: string }[]) => ({
    data: rows.map((r) => ({ tenant_id: r.tenant_id, tenants: { status: r.status, plan_comp: null } })),
    error: null,
  });

  it('only asks them to confirm when every site is already published and none is paid', async () => {
    const { db } = scriptedDb((table) => (table === 'subscriptions' ? { data: [], error: null } : members([{ tenant_id: 't1', status: 'live' }])));
    expect(await unconfirmedSignIn(db, 'lena@example.com', 'https://bohdiai.com')).toEqual({ kind: 'confirm' });
    expect(startCheckout).not.toHaveBeenCalled();
    expect(confirmSite).not.toHaveBeenCalled();
  });

  it('says when the waiting site’s plan cannot be read', async () => {
    const { db } = scriptedDb((table, ops) => {
      if (table === 'subscriptions') return { data: [], error: null };
      if (ops.includes('single')) return { data: null, error: { message: 'gone' } };
      return members([{ tenant_id: 't1', status: 'draft' }]);
    });
    await expect(unconfirmedSignIn(db, 'lena@example.com', 'https://bohdiai.com')).rejects.toThrow("Could not read the site's plan: gone");
  });

  it('refuses to send a site with no plan to Stripe', async () => {
    const { db } = scriptedDb((table, ops) => {
      if (table === 'subscriptions') return { data: [], error: null };
      if (ops.includes('single')) return { data: { plan: null, plan_billing: null, business_name: 'Saltmarsh', contact_email: null }, error: null };
      return members([{ tenant_id: 't1', status: 'draft' }]);
    });
    await expect(unconfirmedSignIn(db, 'lena@example.com', 'https://bohdiai.com')).rejects.toThrow('site t1 has no plan');
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it('sends a monthly site back to Stripe monthly, with the way back to the plan they picked', async () => {
    const { db } = scriptedDb((table, ops) => {
      if (table === 'subscriptions') return { data: [], error: null };
      if (ops.includes('single')) return { data: { plan: 'showcase', plan_billing: null, business_name: 'Saltmarsh', contact_email: null }, error: null };
      return members([{ tenant_id: 't1', status: 'draft' }]);
    });
    await unconfirmedSignIn(db, 'lena@example.com', 'https://bohdiai.com');
    expect(startCheckout).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ plan: 'showcase', billing: 'monthly', promo: undefined, backUrl: 'https://bohdiai.com/start?plan=maker-showcase&billing=monthly&back=1' }),
    );
  });
});

describe('the account steps', () => {
  type AuthAnswer = { data: unknown; error: { message: string; code?: string; status?: number } | null };
  const authDb = (create: AuthAnswer, remove: AuthAnswer = { data: null, error: null }) => {
    const createUser = vi.fn().mockResolvedValue(create);
    const deleteUser = vi.fn().mockResolvedValue(remove);
    const db = { auth: { admin: { createUser, deleteUser } } } as unknown as SupabaseClient<Database>;
    return { db, createUser, deleteUser };
  };

  beforeEach(() => {
    logError.mockReset();
  });

  it('makes an unconfirmed account with the maker’s name on it', async () => {
    const { db, createUser } = authDb({ data: { user: { id: 'u7' } }, error: null });
    expect(await signupDeps(db, 'https://bohdiai.com').createUser('lena@example.com', 'pw-123456', 'Lena')).toEqual({ ok: true, userId: 'u7' });
    expect(createUser).toHaveBeenCalledWith({ email: 'lena@example.com', password: 'pw-123456', email_confirm: false, user_metadata: { name: 'Lena' } });
  });

  it('says the account already exists, by its code or by a 422', async () => {
    const byCode = authDb({ data: null, error: { message: 'exists', code: 'email_exists' } });
    expect(await signupDeps(byCode.db, '').createUser('a@example.com', 'pw', 'A')).toEqual({ ok: false, reason: 'exists' });
    const byStatus = authDb({ data: null, error: { message: 'registered', status: 422 } });
    expect(await signupDeps(byStatus.db, '').createUser('a@example.com', 'pw', 'A')).toEqual({ ok: false, reason: 'exists' });
    expect(logError).not.toHaveBeenCalled();
  });

  it('logs any other failure and reports it as failed', async () => {
    const { db } = authDb({ data: null, error: { message: 'boom', status: 500 } });
    expect(await signupDeps(db, '').createUser('a@example.com', 'pw', 'A')).toEqual({ ok: false, reason: 'failed' });
    expect(logError).toHaveBeenCalledWith('signup: account create failed', { error: 'boom' });
  });

  it('removes a new account quietly, and logs when it cannot', async () => {
    const fine = authDb({ data: null, error: null });
    await signupDeps(fine.db, '').removeUser('u7');
    expect(fine.deleteUser).toHaveBeenCalledWith('u7');
    expect(logError).not.toHaveBeenCalled();
    const stuck = authDb({ data: null, error: null }, { data: null, error: { message: 'locked' } });
    await signupDeps(stuck.db, '').removeUser('u7');
    expect(logError).toHaveBeenCalledWith('signup: could not remove the new account after a failed sign-up', { userId: 'u7', error: 'locked' });
  });

  it('reads the account’s sites through the database it was given', async () => {
    const { db, calls } = scriptedDb(() => ({ data: [], error: null }));
    expect(await signupDeps(db, '').sitesOf('u1')).toEqual([]);
    expect(calls[0]?.table).toBe('tenant_members');
  });

  it('makes a site through the database it was given', async () => {
    applyPlan.mockReset().mockResolvedValue({ ok: true });
    addShopOwner.mockReset().mockResolvedValue(undefined);
    const { db } = scriptedDb((_t, ops) => (ops.includes('insert') ? { data: { id: 't9' }, error: null } : ok));
    expect(await signupDeps(db, '').createSite('u1', signup)).toBe('t9');
  });
});

describe('passwordUser', () => {
  const env = { ...process.env };
  const deps = () => signupDeps({} as SupabaseClient<Database>, 'https://bohdiai.com');

  beforeEach(() => {
    process.env = { ...env, SUPABASE_URL: 'https://db.example.com', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon' };
    signInWithPassword.mockReset();
    createClient.mockReset().mockReturnValue({ auth: { signInWithPassword } });
    findUserByEmail.mockReset();
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it('gives the account when the password is right, without keeping a session', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    expect(await deps().passwordUser('lena@example.com', 'pw')).toBe('u1');
    expect(createClient).toHaveBeenCalledWith('https://db.example.com', 'anon', { auth: { persistSession: false, autoRefreshToken: false } });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'lena@example.com', password: 'pw' });
  });

  it('falls back to the public Supabase address', async () => {
    Reflect.deleteProperty(process.env, 'SUPABASE_URL');
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://public.example.com';
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await deps().passwordUser('lena@example.com', 'pw');
    expect(createClient).toHaveBeenCalledWith('https://public.example.com', 'anon', expect.anything());
  });

  it('finds the account when the password is right but the email is not confirmed', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'not confirmed', code: 'email_not_confirmed' } });
    findUserByEmail.mockResolvedValue({ id: 'u2' });
    expect(await deps().passwordUser('lena@example.com', 'pw')).toBe('u2');
    findUserByEmail.mockResolvedValue(null);
    expect(await deps().passwordUser('lena@example.com', 'pw')).toBeNull();
  });

  it('gives nothing for a wrong password', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } });
    expect(await deps().passwordUser('lena@example.com', 'nope')).toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('stops when Supabase’s address or key is missing', async () => {
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    await expect(deps().passwordUser('lena@example.com', 'pw')).rejects.toThrow('Supabase url / anon key missing');
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'anon';
    Reflect.deleteProperty(process.env, 'SUPABASE_URL');
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SUPABASE_URL');
    await expect(deps().passwordUser('lena@example.com', 'pw')).rejects.toThrow('Supabase url / anon key missing');
    expect(createClient).not.toHaveBeenCalled();
  });
});
