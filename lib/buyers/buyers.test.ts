import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keyWords } from '@/lib/site-words/words';
import { SHOP_WORD_SPOTS } from '@/lib/storefront/words';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives `result()`. */
function chain(result: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(result()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const TENANT = '1b54cb24-c467-4327-ae66-f9857a71a854';
const OTHER = '2c65dc35-d578-5438-bf77-0a968b82b965';
const USER = '3d76ed46-e689-4549-8a88-1ba79c93ca76';
const SECRET = 'x'.repeat(40);

const state = vi.hoisted(() => ({
  features: new Set<string>(['buyer_accounts']),
  tables: new Map<string, unknown[]>(),
  calls: [] as string[],
  jar: new Map<string, string>(),
  setCookies: [] as { name: string; value: string; options: Record<string, unknown> }[],
  headers: new Map<string, string>(),
  allowance: 'allowed' as 'allowed' | 'limited' | 'unavailable',
  keyAllowance: 'allowed' as 'allowed' | 'limited' | 'unavailable',
  createUser: { data: { user: { id: '' } }, error: null } as { data: { user: { id: string } }; error: unknown },
  signIn: { data: {}, error: null } as { data: unknown; error: unknown },
  verify: { data: {}, error: null } as { data: unknown; error: unknown },
  update: { error: null } as { error: unknown },
  signOut: { error: null } as { error: unknown },
  generate: { data: { properties: { hashed_token: 'hash1' } }, error: null } as { data: unknown; error: unknown },
  sent: [] as unknown[],
  sendError: null as unknown,
  found: null as { id: string } | null,
  users: new Map<string, string>(),
}));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

function take(table: string): unknown {
  const q = state.tables.get(table) ?? [];
  return q.length > 0 ? q.shift() : { data: null, error: null };
}
const fakeAdmin = {
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => take(t), state.calls);
  },
  auth: {
    admin: {
      createUser: async (args: unknown) => {
        state.calls.push(`createUser(${JSON.stringify(args)})`);
        return state.createUser;
      },
      signOut: async (token: string, scope: string) => {
        state.calls.push(`signOut(${token},${scope})`);
        return state.signOut;
      },
      generateLink: async () => state.generate,
      getUserById: async (id: string) => (state.users.has(id) ? { data: { user: { email: state.users.get(id) } }, error: null } : { data: { user: null }, error: { message: 'gone' } }),
    },
  },
};

class RedirectSignal extends Error {
  constructor(public to: string) {
    super('NEXT_REDIRECT');
  }
}

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  unstable_rethrow: (err: unknown) => {
    if (err instanceof RedirectSignal) throw err;
  },
}));
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => state.headers.get(k) ?? null }),
  cookies: async () => ({
    get: (name: string) => (state.jar.has(name) ? { name, value: state.jar.get(name) } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      state.setCookies.push({ name, value, options });
      state.jar.set(name, value);
    },
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => fakeAdmin }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeAdmin }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: async () => state.signIn,
      verifyOtp: async () => state.verify,
      updateUser: async () => state.update,
    },
  }),
}));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'owner' }, site: { tenantId: TENANT } }) }));
vi.mock('@/lib/storefront/metadata', () => ({ loadShopWords: async () => keyWords(SHOP_WORD_SPOTS, 'shop') }));
vi.mock('@/lib/backend/action-limit', () => ({
  allowAction: async () => state.allowance,
  allowKey: async () => state.keyAllowance,
}));
vi.mock('@/lib/backend/user-lookup', () => ({ findUserByEmail: async () => state.found }));
vi.mock('@/lib/resend', () => ({
  resend: () => ({
    emails: {
      send: async (msg: unknown) => {
        state.sent.push(msg);
        return { error: state.sendError };
      },
    },
  }),
  fromEmail: () => 'hello@bohdiai.com',
}));
vi.mock('@/lib/logger', () => ({ logger }));

const { signPass, readPass, passSecret, BUYER_COOKIE } = await import('./pass');
const { buyerResetEmail, buyerResetLink } = await import('./reset-email');
const accounts = await import('./accounts');
const session = await import('./session');
const actions = await import('./actions');
const { accountNavLabel } = await import('./nav');
const { listShopBuyers } = await import('@/lib/backend/buyers/queries');
const { setBuyerAccounts } = await import('@/lib/backend/buyers/actions');

const W = keyWords(SHOP_WORD_SPOTS, 'shop').account;
const now = () => Math.floor(Date.now() / 1000);

/** Queue results for a table, in the order the code asks for them. */
function queue(table: string, ...results: unknown[]): void {
  state.tables.set(table, [...(state.tables.get(table) ?? []), ...results]);
}
const open = () => queue('tenants', { data: { buyer_accounts_on: true }, error: null });
const member = (id = 'm1') => queue('tenant_members', { data: { id, status: 'active' }, error: null });
const profile = (id = 'p1', name: string | null = 'Ada') => queue('customer_profiles', { data: { id, display_name: name }, error: null });

async function redirected(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (err) {
    if (err instanceof RedirectSignal) return err.to;
    throw err;
  }
  throw new Error('expected a redirect');
}

beforeEach(() => {
  state.features = new Set(['buyer_accounts']);
  state.tables.clear();
  state.calls = [];
  state.jar.clear();
  state.setCookies = [];
  state.headers = new Map([
    ['x-tenant-id', TENANT],
    ['x-tenant-subdomain', 'rustic-charm'],
    ['host', 'rustic-charm.bohdiai.com'],
    ['x-forwarded-proto', 'https'],
  ]);
  state.allowance = 'allowed';
  state.keyAllowance = 'allowed';
  state.createUser = { data: { user: { id: USER } }, error: null };
  state.signIn = { data: { user: { id: USER }, session: { access_token: 'tok' } }, error: null };
  state.verify = { data: { user: { id: USER }, session: { access_token: 'tok2' } }, error: null };
  state.update = { error: null };
  state.signOut = { error: null };
  state.generate = { data: { properties: { hashed_token: 'hash1' } }, error: null };
  state.sent = [];
  state.sendError = null;
  state.found = null;
  state.users = new Map();
  logger.error.mockClear();
  process.env['BACKEND_SESSION_SECRET'] = SECRET;
});

describe('the shop pass', () => {
  it('reads back a pass it signed, for that shop only', async () => {
    const value = await signPass({ userId: USER, tenantId: TENANT, expires: now() + 60 }, SECRET);
    expect(await readPass(value, TENANT, now(), SECRET)).toMatchObject({ userId: USER, tenantId: TENANT });
    expect(await readPass(value, OTHER, now(), SECRET)).toBeNull();
  });

  it('refuses a pass that ran out, was changed, or was signed with another secret', async () => {
    const old = await signPass({ userId: USER, tenantId: TENANT, expires: now() - 1 }, SECRET);
    expect(await readPass(old, TENANT, now(), SECRET)).toBeNull();
    const good = await signPass({ userId: USER, tenantId: TENANT, expires: now() + 60 }, SECRET);
    const [, shop, exp, mac] = good.split('.');
    expect(await readPass(`${OTHER.replace('2c', '3d')}.${shop}.${exp}.${mac}`, TENANT, now(), SECRET)).toBeNull();
    expect(await readPass(good, TENANT, now(), 'y'.repeat(40))).toBeNull();
    expect(await readPass(`${good.split('.').slice(0, 3).join('.')}.not*base64`, TENANT, now(), SECRET)).toBeNull();
  });

  it('refuses anything shaped wrong', async () => {
    expect(await readPass(undefined, TENANT, now(), SECRET)).toBeNull();
    expect(await readPass('a.b.c', TENANT, now(), SECRET)).toBeNull();
    expect(await readPass(`not-an-id.${TENANT}.9999999999.abc`, TENANT, now(), SECRET)).toBeNull();
    expect(await readPass(`${USER}.${TENANT}.soon.abc`, TENANT, now(), SECRET)).toBeNull();
  });

  it('only trusts a long enough secret', () => {
    expect(passSecret(undefined)).toBeNull();
    expect(passSecret('short')).toBeNull();
    expect(passSecret(SECRET)).toBe(SECRET);
  });
});

describe('the reset email', () => {
  it('links to the shop’s own reset page and speaks in its words', () => {
    const link = buyerResetLink('https://rustic-charm.bohdiai.com', 'abc');
    expect(link).toBe('https://rustic-charm.bohdiai.com/account/reset?token_hash=abc');
    const mail = buyerResetEmail({ subject: 'Reset at {shop}', lead: 'Hi from {shop}', action: 'Go', expiry: 'One hour' }, 'Rustic <Charm>', link);
    expect(mail.subject).toBe('Reset at Rustic <Charm>');
    expect(mail.text).toContain(`Go: ${link}`);
    expect(mail.html).toContain('Rustic &lt;Charm&gt;');
    expect(mail.html).toContain(`href="${link.replace(/&/g, '&amp;')}"`);
  });
});

describe('whether a shop’s buyer accounts are open', () => {
  it('needs Full and her switch on', async () => {
    open();
    expect(await accounts.buyerAccountsOpen(fakeAdmin as never, TENANT)).toBe(true);
    queue('tenants', { data: { buyer_accounts_on: false }, error: null });
    expect(await accounts.buyerAccountsOpen(fakeAdmin as never, TENANT)).toBe(false);
    state.features = new Set();
    open();
    expect(await accounts.buyerAccountsOpen(fakeAdmin as never, TENANT)).toBe(false);
  });

  it('says so when the switch can’t be read', async () => {
    queue('tenants', { data: null, error: { message: 'down' } });
    await expect(accounts.buyerAccountsOpen(fakeAdmin as never, TENANT)).rejects.toThrow('down');
  });

  it('puts Account in the menu only when open', async () => {
    open();
    expect(await accountNavLabel(fakeAdmin as never, TENANT, new Set(['buyer_accounts']))).toBe('shop.account.nav');
    queue('tenants', { data: { buyer_accounts_on: false }, error: null });
    expect(await accountNavLabel(fakeAdmin as never, TENANT, new Set(['buyer_accounts']))).toBeNull();
    expect(await accountNavLabel(fakeAdmin as never, TENANT, new Set())).toBeNull();
    queue('tenants', { data: null, error: { message: 'down' } });
    await expect(accountNavLabel(fakeAdmin as never, TENANT, new Set(['buyer_accounts']))).rejects.toThrow('down');
  });
});

describe('a buyer at a shop', () => {
  it('makes the membership and profile the first time', async () => {
    queue('tenant_members', { data: null, error: null }, { data: { id: 'm9' }, error: null });
    queue('customer_profiles', { data: null, error: null }, { data: { id: 'p9' }, error: null });
    expect(await accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, 'Ada')).toEqual({ userId: USER, profileId: 'p9', name: 'Ada' });
    expect(state.calls.some((c) => c.includes('"role":"customer"'))).toBe(true);
  });

  it('keeps the ones already there (the owner’s own membership too)', async () => {
    member('owner-row');
    profile('p1', null);
    expect(await accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).toEqual({ userId: USER, profileId: 'p1', name: '' });
  });

  it('turns away someone removed from the shop', async () => {
    queue('tenant_members', { data: { id: 'm1', status: 'removed' }, error: null });
    expect(await accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).toBeNull();
  });

  it('says so when a step fails', async () => {
    queue('tenant_members', { data: null, error: { message: 'm-read' } });
    await expect(accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).rejects.toThrow('m-read');
    queue('tenant_members', { data: null, error: null }, { data: null, error: { message: 'm-add' } });
    await expect(accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).rejects.toThrow('m-add');
    member();
    queue('customer_profiles', { data: null, error: { message: 'p-read' } });
    await expect(accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).rejects.toThrow('p-read');
    member();
    queue('customer_profiles', { data: null, error: null }, { data: null, error: { message: 'p-add' } });
    await expect(accounts.ensureBuyer(fakeAdmin as never, TENANT, USER, '')).rejects.toThrow('p-add');
  });

  it('finds the buyer a pass names', async () => {
    profile('p1', 'Ada');
    expect(await accounts.buyerFor(fakeAdmin as never, TENANT, USER)).toEqual({ userId: USER, profileId: 'p1', name: 'Ada' });
    expect(await accounts.buyerFor(fakeAdmin as never, TENANT, USER)).toBeNull();
    queue('customer_profiles', { data: null, error: { message: 'x' } });
    await expect(accounts.buyerFor(fakeAdmin as never, TENANT, USER)).rejects.toThrow('x');
  });
});

describe('a buyer’s orders', () => {
  const order = {
    order_number: '1042',
    created_at: '2026-10-20T15:00:00Z',
    status: 'paid',
    total_cents: 4500,
    subtotal_cents: 5000,
    discount_cents: 500,
    discount_label: 'Fall sale',
    shipping_cents: 0,
    tax_cents: 0,
    paid_at: '2026-10-20T15:01:00Z',
    order_items: [
      { name_snapshot: 'Wreath', variant_description_snapshot: null, quantity: 1, unit_price_cents: 3000, listing_id: 'AAAAAAAA-0000-4000-8000-000000000001', listing_variant_id: null, created_at: '2026-10-20T15:00:02Z' },
      { name_snapshot: 'Sign', variant_description_snapshot: 'Large', quantity: 2, unit_price_cents: 1000, listing_id: null, listing_variant_id: null, created_at: '2026-10-20T15:00:01Z' },
    ],
  };

  it('lists them newest first, priced', async () => {
    queue('orders', { data: [{ order_number: '1042', created_at: order.created_at, status: 'paid', total_cents: 4500 }], error: null });
    expect(await accounts.listBuyerOrders(fakeAdmin as never, TENANT, 'p1')).toEqual([{ number: '1042', placedAt: order.created_at, status: 'paid', total: '$45' }]);
    queue('orders', { data: null, error: { message: 'x' } });
    await expect(accounts.listBuyerOrders(fakeAdmin as never, TENANT, 'p1')).rejects.toThrow('x');
  });

  it('opens one of their own, in the order the pieces were added', async () => {
    queue('orders', { data: order, error: null });
    const got = await accounts.loadBuyerOrder(fakeAdmin as never, TENANT, 'p1', '1042');
    expect(got).toMatchObject({ number: '1042', paid: true, subtotal: '$50', discount: { label: 'Fall sale', amount: '$5' }, shipping: null, tax: null });
    expect(got?.lines.map((l) => [l.name, l.option, l.entry])).toEqual([
      ['Sign', 'Large', null],
      ['Wreath', '', 'aaaaaaaa-0000-4000-8000-000000000001'],
    ]);
  });

  it('shows shipping and tax when there are some, and no Reorder until paid', async () => {
    queue('orders', { data: { ...order, status: 'pending', paid_at: null, discount_cents: 0, shipping_cents: 800, tax_cents: 300 }, error: null });
    expect(await accounts.loadBuyerOrder(fakeAdmin as never, TENANT, 'p1', '1042')).toMatchObject({ paid: false, discount: null, shipping: '$8', tax: '$3' });
    expect(await accounts.loadBuyerOrder(fakeAdmin as never, TENANT, 'p1', 'nope')).toBeNull();
    queue('orders', { data: null, error: { message: 'x' } });
    await expect(accounts.loadBuyerOrder(fakeAdmin as never, TENANT, 'p1', '1042')).rejects.toThrow('x');
  });

  it('counts a shop’s buyers', async () => {
    queue('customer_profiles', { count: 3, error: null });
    expect(await accounts.countBuyers(fakeAdmin as never, TENANT)).toBe(3);
    queue('customer_profiles', { count: null, error: null });
    expect(await accounts.countBuyers(fakeAdmin as never, TENANT)).toBe(0);
    queue('customer_profiles', { count: null, error: { message: 'x' } });
    await expect(accounts.countBuyers(fakeAdmin as never, TENANT)).rejects.toThrow('x');
  });
});

describe('the signed-in buyer', () => {
  async function signedIn(tenantId = TENANT): Promise<void> {
    state.jar.set(BUYER_COOKIE, await signPass({ userId: USER, tenantId, expires: now() + 60 }, SECRET));
  }

  it('is the one the shop’s pass names, while accounts are open', async () => {
    await signedIn();
    open();
    profile('p1', 'Ada');
    expect(await session.currentBuyer(TENANT)).toMatchObject({ profileId: 'p1' });
  });

  it('is no one without a pass, with another shop’s pass, when closed, or without a secret', async () => {
    expect(await session.currentBuyer(TENANT)).toBeNull();
    await signedIn(OTHER);
    expect(await session.currentBuyer(TENANT)).toBeNull();
    await signedIn();
    queue('tenants', { data: { buyer_accounts_on: false }, error: null });
    expect(await session.currentBuyer(TENANT)).toBeNull();
    Reflect.deleteProperty(process.env, 'BACKEND_SESSION_SECRET');
    expect(await session.currentBuyer(TENANT)).toBeNull();
  });

  it('never stops an order: a failure to read the buyer places it as a guest’s', async () => {
    await signedIn();
    open();
    profile('p1');
    expect(await session.signedInBuyerProfile(TENANT)).toBe('p1');
    await signedIn();
    queue('tenants', { data: null, error: { message: 'down' } });
    expect(await session.signedInBuyerProfile(TENANT)).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('builds the shop’s own address from its name, not the Host', async () => {
    state.headers.set('host', 'evil.example');
    expect(await session.shopOrigin()).toBe('https://rustic-charm.bohdiai.com');
    state.headers.set('host', 'rustic-charm.localhost:3000');
    expect(await session.shopOrigin()).toBe('http://rustic-charm.localhost:3000');
  });

  it('gives an httpOnly pass, plain http only on a local shop', async () => {
    await session.startBuyerPass(USER, TENANT, SECRET);
    expect(state.setCookies[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax' });
    state.headers.delete('x-forwarded-proto');
    state.headers.set('host', 'rustic-charm.localhost:3000');
    await session.endBuyerPass();
    expect(state.setCookies[1]).toMatchObject({ value: '', options: { maxAge: 0, secure: false } });
  });
});

describe('making an account', () => {
  it('makes it, signs them in here, and opens My account', async () => {
    open();
    queue('tenant_members', { data: null, error: null }, { data: { id: 'm1' }, error: null });
    queue('customer_profiles', { data: null, error: null }, { data: { id: 'p1' }, error: null });
    expect(await redirected(actions.signUpBuyer({ name: ' Ada ', email: ' Ada@Example.com ', password: 'long enough pw' }))).toBe('/account');
    expect(state.calls.find((c) => c.startsWith('createUser'))).toContain('"email":"ada@example.com"');
    expect(state.setCookies[0]?.name).toBe(BUYER_COOKIE);
  });

  it('says when the email already has an account', async () => {
    open();
    state.createUser = { data: { user: { id: '' } }, error: { code: 'email_exists', status: 422, message: 'exists' } };
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.exists });
  });

  it('checks the email and the password first', async () => {
    open();
    expect(await actions.signUpBuyer({ name: '', email: 'nope', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.email });
    open();
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'short' })).toEqual({ ok: false, error: W.errors.short });
  });

  it('shows the shop’s words when the sign-in system refuses or fails', async () => {
    open();
    state.createUser = { data: { user: { id: '' } }, error: { code: 'weak_password', status: 400, message: 'weak' } };
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.short });
    open();
    state.createUser = { data: { user: { id: '' } }, error: { code: 'other', status: 500, message: 'boom' } };
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.failed });
    open();
    state.createUser = { data: { user: { id: USER } }, error: null };
    queue('tenant_members', { data: { id: 'm1', status: 'removed' }, error: null });
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.failed });
    open();
    queue('tenant_members', { data: null, error: { message: 'db' } });
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.failed });
  });

  it('is closed off Full, without a secret, off a shop, and when rate-limited', async () => {
    queue('tenants', { data: { buyer_accounts_on: false }, error: null });
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.unavailable });
    Reflect.deleteProperty(process.env, 'BACKEND_SESSION_SECRET');
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.unavailable });
    process.env['BACKEND_SESSION_SECRET'] = SECRET;
    open();
    state.allowance = 'limited';
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.limited });
    open();
    state.allowance = 'allowed';
    state.keyAllowance = 'unavailable';
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: W.errors.unavailable });
    state.headers.delete('x-tenant-id');
    expect(await actions.signUpBuyer({ name: '', email: 'a@b.co', password: 'long enough pw' })).toEqual({ ok: false, error: '' });
  });
});

describe('signing in', () => {
  it('checks the password, ends the shared session at once, and gives the shop’s pass', async () => {
    open();
    member();
    profile();
    expect(await redirected(actions.signInBuyer({ email: 'a@b.co', password: 'pw' }))).toBe('/account');
    expect(state.calls).toContain('signOut(tok,local)');
    expect(state.setCookies[0]?.name).toBe(BUYER_COOKIE);
  });

  it('logs a failure to end the shared session but still signs in', async () => {
    open();
    member();
    profile();
    state.signOut = { error: { message: 'revoke failed' } };
    expect(await redirected(actions.signInBuyer({ email: 'a@b.co', password: 'pw' }))).toBe('/account');
    expect(logger.error).toHaveBeenCalled();
  });

  it('says when the email and password don’t match, or something else went wrong', async () => {
    open();
    state.signIn = { data: {}, error: { status: 400, code: 'invalid_credentials', message: 'no' } };
    expect(await actions.signInBuyer({ email: 'a@b.co', password: 'pw' })).toEqual({ ok: false, error: W.errors.wrong });
    open();
    state.signIn = { data: {}, error: { status: 500, message: 'down' } };
    expect(await actions.signInBuyer({ email: 'a@b.co', password: 'pw' })).toEqual({ ok: false, error: W.errors.unavailable });
  });

  it('asks for what’s missing, and turns away someone removed', async () => {
    open();
    expect(await actions.signInBuyer({ email: '', password: 'pw' })).toEqual({ ok: false, error: W.errors.email });
    open();
    expect(await actions.signInBuyer({ email: 'a@b.co', password: '' })).toEqual({ ok: false, error: W.errors.password });
    open();
    queue('tenant_members', { data: { id: 'm1', status: 'removed' }, error: null });
    expect(await actions.signInBuyer({ email: 'a@b.co', password: 'pw' })).toEqual({ ok: false, error: W.errors.wrong });
    open();
    queue('tenant_members', { data: null, error: { message: 'db' } });
    expect(await actions.signInBuyer({ email: 'a@b.co', password: 'pw' })).toEqual({ ok: false, error: W.errors.unavailable });
  });

  it('signs out by ending the pass', async () => {
    expect(await redirected(actions.signOutBuyer())).toBe('/account');
    expect(state.setCookies[0]).toMatchObject({ name: BUYER_COOKIE, value: '' });
  });
});

describe('a forgotten password', () => {
  it('emails the shop’s own reset link when there’s an account', async () => {
    open();
    state.found = { id: USER };
    queue('tenants', { data: { business_name: 'Rustic Charm' }, error: null });
    expect(await actions.requestBuyerReset({ email: 'a@b.co' })).toEqual({ ok: true, message: W.forgot.sent });
    expect(JSON.stringify(state.sent[0])).toContain('https://rustic-charm.bohdiai.com/account/reset?token_hash=hash1');
  });

  it('answers the same when there’s no account', async () => {
    open();
    expect(await actions.requestBuyerReset({ email: 'a@b.co' })).toEqual({ ok: true, message: W.forgot.sent });
    expect(state.sent).toHaveLength(0);
  });

  it('asks for the email, and says when the email didn’t go', async () => {
    open();
    expect(await actions.requestBuyerReset({ email: ' ' })).toEqual({ ok: false, error: W.errors.email });
    for (const breakIt of [
      () => queue('tenants', { data: null, error: { message: 'x' } }),
      () => {
        queue('tenants', { data: { business_name: 'R' }, error: null });
        state.generate = { data: {}, error: null };
      },
      () => {
        queue('tenants', { data: { business_name: 'R' }, error: null });
        state.generate = { data: null, error: { message: 'no' } };
      },
      () => {
        queue('tenants', { data: { business_name: 'R' }, error: null });
        state.generate = { data: { properties: { hashed_token: 'h' } }, error: null };
        state.sendError = { message: 'bounce' };
      },
    ]) {
      open();
      state.found = { id: USER };
      breakIt();
      expect(await actions.requestBuyerReset({ email: 'a@b.co' })).toEqual({ ok: false, error: W.errors.failed });
    }
  });

  it('is closed when the shop is', async () => {
    queue('tenants', { data: { buyer_accounts_on: false }, error: null });
    expect(await actions.requestBuyerReset({ email: 'a@b.co' })).toEqual({ ok: false, error: W.errors.unavailable });
  });
});

describe('choosing a new password from the link', () => {
  const input = { tokenHash: 'hash1', password: 'a new long one', confirm: 'a new long one' };

  it('spends the token, sets the password, and signs them in here', async () => {
    open();
    member();
    profile();
    expect(await redirected(actions.resetBuyerPassword(input))).toBe('/account');
    expect(state.calls).toContain('signOut(tok2,local)');
  });

  it('checks the two passwords and the link first', async () => {
    open();
    expect(await actions.resetBuyerPassword({ ...input, password: 'short', confirm: 'short' })).toEqual({ ok: false, error: W.errors.short });
    open();
    expect(await actions.resetBuyerPassword({ ...input, confirm: 'something else' })).toEqual({ ok: false, error: W.errors.mismatch });
    open();
    expect(await actions.resetBuyerPassword({ ...input, tokenHash: '' })).toEqual({ ok: false, error: W.errors.expired });
    open();
    state.verify = { data: { user: null, session: null }, error: { message: 'expired' } };
    expect(await actions.resetBuyerPassword(input)).toEqual({ ok: false, error: W.errors.expired });
  });

  it('says when the new password isn’t taken', async () => {
    open();
    state.update = { error: { code: 'weak_password', message: 'weak' } };
    expect(await actions.resetBuyerPassword(input)).toEqual({ ok: false, error: W.errors.short });
    open();
    state.update = { error: { code: 'other', message: 'no' } };
    expect(await actions.resetBuyerPassword(input)).toEqual({ ok: false, error: W.errors.failed });
    open();
    state.update = { error: null };
    queue('tenant_members', { data: { id: 'm1', status: 'removed' }, error: null });
    expect(await actions.resetBuyerPassword(input)).toEqual({ ok: false, error: W.errors.failed });
    open();
    queue('tenant_members', { data: null, error: { message: 'db' } });
    expect(await actions.resetBuyerPassword(input)).toEqual({ ok: false, error: W.errors.failed });
  });
});

describe('Reorder', () => {
  const paid = {
    order_number: '1042',
    created_at: '2026-10-20T15:00:00Z',
    status: 'paid',
    total_cents: 3000,
    subtotal_cents: 3000,
    discount_cents: 0,
    discount_label: null,
    shipping_cents: 0,
    tax_cents: 0,
    paid_at: '2026-10-20T15:01:00Z',
    order_items: [{ name_snapshot: 'Wreath', variant_description_snapshot: null, quantity: 1, unit_price_cents: 3000, listing_id: 'aaaaaaaa-0000-4000-8000-000000000001', listing_variant_id: null, created_at: '2026-10-20T15:00:02Z' }],
  };
  async function signedIn(): Promise<void> {
    state.jar.set(BUYER_COOKIE, await signPass({ userId: USER, tenantId: TENANT, expires: now() + 60 }, SECRET));
    open();
    profile('p1');
  }

  it('adds a paid order’s pieces to the cart and opens it', async () => {
    await signedIn();
    state.jar.set('bohdi_cart', 'bbbbbbbb-0000-4000-8000-000000000002');
    queue('orders', { data: paid, error: null });
    expect(await redirected(actions.reorderBuyerOrder({ number: '1042' }))).toBe('/cart');
    expect(state.setCookies.at(-1)).toMatchObject({ name: 'bohdi_cart', value: 'bbbbbbbb-0000-4000-8000-000000000002.aaaaaaaa-0000-4000-8000-000000000001' });
  });

  it('won’t for an unpaid order, a gone piece, or someone signed out', async () => {
    expect(await actions.reorderBuyerOrder({ number: '1042' })).toEqual({ ok: false, error: W.errors.expired });
    await signedIn();
    queue('orders', { data: { ...paid, paid_at: null, status: 'pending' }, error: null });
    expect(await actions.reorderBuyerOrder({ number: '1042' })).toEqual({ ok: false, error: W.order.reorderNone });
    await signedIn();
    queue('orders', { data: { ...paid, order_items: [{ ...paid.order_items[0], listing_id: null }] }, error: null });
    expect(await actions.reorderBuyerOrder({ number: '1042' })).toEqual({ ok: false, error: W.order.reorderNone });
    state.headers.delete('x-tenant-id');
    expect(await actions.reorderBuyerOrder({ number: '1042' })).toEqual({ ok: false, error: '' });
  });
});

describe('the Buyers screen', () => {
  it('lists her buyers with their emails, orders and what they spent', async () => {
    queue('customer_profiles', { data: [{ id: 'p1', user_id: 'u1', display_name: 'Ada', created_at: '2026-10-01T00:00:00Z' }, { id: 'p2', user_id: 'u2', display_name: null, created_at: '2026-10-02T00:00:00Z' }], error: null });
    queue('orders', {
      data: [
        { customer_profile_id: 'p1', status: 'paid', total_cents: 3000 },
        { customer_profile_id: 'p1', status: 'refunded', total_cents: 2000 },
        { customer_profile_id: null, status: 'paid', total_cents: 100 },
      ],
      error: null,
    });
    state.users = new Map([
      ['u1', 'ada@example.com'],
      ['u2', 'bo@example.com'],
    ]);
    expect(await listShopBuyers(fakeAdmin as never, TENANT)).toEqual([
      { id: 'p1', name: 'Ada', email: 'ada@example.com', joined: '2026-10-01T00:00:00Z', orders: 2, spent: '$30' },
      { id: 'p2', name: '', email: 'bo@example.com', joined: '2026-10-02T00:00:00Z', orders: 0, spent: '$0' },
    ]);
  });

  it('is empty with no buyers, and says when something can’t be read', async () => {
    queue('customer_profiles', { data: [], error: null });
    expect(await listShopBuyers(fakeAdmin as never, TENANT)).toEqual([]);
    queue('customer_profiles', { data: null, error: { message: 'p' } });
    await expect(listShopBuyers(fakeAdmin as never, TENANT)).rejects.toThrow('p');
    queue('customer_profiles', { data: [{ id: 'p1', user_id: 'u1', display_name: 'Ada', created_at: '2026-10-01T00:00:00Z' }], error: null });
    queue('orders', { data: null, error: { message: 'o' } });
    await expect(listShopBuyers(fakeAdmin as never, TENANT)).rejects.toThrow('o');
    queue('customer_profiles', { data: [{ id: 'p1', user_id: 'gone', display_name: 'Ada', created_at: '2026-10-01T00:00:00Z' }], error: null });
    queue('orders', { data: [], error: null });
    await expect(listShopBuyers(fakeAdmin as never, TENANT)).rejects.toThrow('gone');
  });

  it('switches buyer accounts on and off, on Full only', async () => {
    expect(await setBuyerAccounts(false)).toEqual({ ok: true });
    expect(state.calls).toContain('update({"buyer_accounts_on":false})');
    queue('tenants', { error: { message: 'x' } });
    expect((await setBuyerAccounts(true)).ok).toBe(false);
    state.features = new Set();
    expect((await setBuyerAccounts(true)).ok).toBe(false);
  });
});
