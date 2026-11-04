import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { FOUNDER_USER_IDS, isFounder, requireFounder } from './access';
import { dollars, findSites, loadFounderSites, monthlyCents, planName, statusName, type FounderSite } from './sites';
import { buildDashboard, loadDashboard, monthKey, previousMonth } from './dashboard';
import { loadFounderMessages } from './messages';

const s = vi.hoisted(() => ({ user: { id: 'someone' } }));
vi.mock('@/lib/auth/session', () => ({ requireUser: async () => s.user }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
// requireFounder caches per request in the app; each test here is its own request.
vi.mock('react', async (orig) => ({ ...(await orig<typeof React>()), cache: <T,>(fn: T): T => fn }));

const ALEX = FOUNDER_USER_IDS[0] ?? '';

type Result = { data: unknown; error: { message: string } | null };

/** A fake database: each table answers with its result, whatever the query's steps. */
function fakeDb(tables: Record<string, Result>, users: Result = { data: { users: [] }, error: null }): SupabaseClient<Database> {
  const from = (table: string): unknown => {
    const result = tables[table] ?? { data: [], error: null };
    const step = new Proxy(
      {},
      {
        get: (_t, key) => (key === 'then' ? (done: (r: Result) => void) => done(result) : () => step),
      },
    );
    return step;
  };
  return { from, auth: { admin: { listUsers: async () => users } } } as unknown as SupabaseClient<Database>;
}

const site = (over: Partial<FounderSite>): FounderSite => ({ id: 'a', name: 'A', subdomain: 'a', status: 'active', plan: 'full', planComp: null, maker: null, paying: null, joined: '2026-11-01', canManage: true, leaving: false, ...over });

describe('who may open the admin', () => {
  beforeEach(() => {
    s.user = { id: 'someone' };
  });
  it('knows Alex from anyone else', () => {
    expect(isFounder(ALEX)).toBe(true);
    expect(isFounder('someone')).toBe(false);
  });
  it('lets Alex in', async () => {
    s.user = { id: ALEX };
    await expect(requireFounder()).resolves.toEqual({ id: ALEX });
  });
  it('shows anyone else "not found"', async () => {
    await expect(requireFounder()).rejects.toThrow('NOT_FOUND');
  });
});

describe('the words and numbers', () => {
  it('names plans and states', () => {
    expect(planName('lite')).toBe('Market');
    expect(planName(null)).toBe('No plan');
    expect(planName('other')).toBe('other');
    expect(statusName('active')).toBe('Live');
    expect(statusName('other')).toBe('other');
  });
  it('shows cents only when there are some', () => {
    expect(dollars(500)).toBe('$5');
    expect(dollars(2583)).toBe('$25.83');
  });
  it('counts a yearly plan as a twelfth each month', () => {
    expect(monthlyCents(null)).toBe(0);
    expect(monthlyCents({ cents: 500, interval: 'month' })).toBe(500);
    expect(monthlyCents({ cents: 25000, interval: 'year' })).toBe(2083);
  });
});

describe('finding a maker', () => {
  const sites = [site({ name: 'Rustic Flags', subdomain: 'rustic-flags', maker: 'pat@example.com' }), site({ id: 'b', name: 'Tide Pool', subdomain: 'tide', maker: null })];
  it('finds by name, address or email, whatever the case', () => {
    expect(findSites(sites, 'RUSTIC').map((s) => s.id)).toEqual(['a']);
    expect(findSites(sites, 'tide').map((s) => s.id)).toEqual(['b']);
    expect(findSites(sites, 'pat@').map((s) => s.id)).toEqual(['a']);
    expect(findSites(sites, 'zzz')).toEqual([]);
  });
  it('shows ten at most', () => {
    expect(findSites(Array.from({ length: 12 }, (_, i) => site({ id: String(i) })), 'a')).toHaveLength(10);
  });
});

describe('the dashboard', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const sub = (over: Partial<{ tenant_id: string; status: string; created_at: string; canceled_at: string | null }>) => ({ tenant_id: 'a', status: 'active', created_at: '2026-11-03T12:00:00Z', canceled_at: null, ...over });

  it('reads months on Alex’s clock and steps back over a new year', () => {
    expect(monthKey('2026-11-01T02:00:00Z')).toBe('2026-10');
    expect(previousMonth('2026-11')).toBe('2026-10');
    expect(previousMonth('2026-01')).toBe('2025-12');
  });

  it('adds up money, sign-ups, cancellations and sites', () => {
    const d = buildDashboard({
      sites: [
        site({ plan: 'full', paying: { cents: 25000, interval: 'year' }, leaving: true }),
        site({ id: 'b', plan: 'showcase', paying: { cents: 500, interval: 'month' } }),
        site({ id: 'c', plan: 'showcase', paying: { cents: 500, interval: 'month' } }),
        site({ id: 'd', status: 'draft', planComp: 'free' }),
      ],
      subscriptions: [sub({}), sub({ tenant_id: 'b', created_at: '2026-10-20T12:00:00Z' }), sub({ tenant_id: 'c', created_at: '2026-09-01T12:00:00Z', canceled_at: '2026-11-02T12:00:00Z' }), sub({ tenant_id: 'gone', created_at: '2026-08-01T12:00:00Z', canceled_at: '2026-10-02T12:00:00Z', status: 'past_due' })],
      stuck: 2,
      messageDates: ['2026-11-02T12:00:00Z', '2026-10-02T12:00:00Z'],
      now,
    });
    expect(d).toMatchObject({
      mrrCents: 3083,
      paying: 3,
      signups: { thisMonth: 1, lastMonth: 1 },
      cancels: { thisMonth: 1, leaving: 1 },
      sites: { live: 3, drafts: 1, free: 1 },
      needs: { failing: 1, stuck: 2, messages: 1 },
    });
    expect(d.plans).toEqual([
      { plan: 'full', paying: 1, monthlyCents: 2083 },
      { plan: 'showcase', paying: 2, monthlyCents: 1000 },
    ]);
    expect(d.latest.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('reads it all from the database', async () => {
    const db = fakeDb({
      tenants: { data: [{ id: 't1', business_name: 'One', subdomain: 'one', status: 'active', plan: 'full', plan_comp: null, plan_cancels: false, created_at: '2026-11-01' }], error: null },
      subscriptions: { data: [{ tenant_id: 't1', status: 'active', unit_amount_cents: 500, billing_interval: 'month', created_at: '2026-11-03T12:00:00Z', canceled_at: null }], error: null },
      intakes: { data: [{ id: 'i' }], error: null },
    });
    expect(await loadDashboard(db, now)).toMatchObject({ mrrCents: 500, signups: { thisMonth: 1 }, needs: { stuck: 1 } });
  });

  it('says so when the site forms can’t be read', async () => {
    await expect(loadDashboard(fakeDb({ intakes: { data: null, error: { message: 'down' } } }), now)).rejects.toThrow('down');
  });
});

describe('loadFounderSites', () => {
  const tenants = [
    { id: 't1', business_name: 'One', subdomain: 'one', status: 'active', plan: 'full', plan_comp: null, created_at: '2026-11-01' },
    { id: 't2', business_name: 'Two', subdomain: 'two', status: 'draft', plan: null, plan_comp: 'free', created_at: '2026-10-01' },
  ];
  const members = [
    { tenant_id: 't1', user_id: ALEX },
    { tenant_id: 't1', user_id: 'maker' },
    { tenant_id: 't2', user_id: ALEX },
  ];
  const users = { data: { users: [{ id: 'maker', email: 'maker@example.com' }, { id: ALEX }] }, error: null };

  it('joins each site to its maker and what it pays, skipping Alex and anything not paying', async () => {
    const subscriptions = [
      { tenant_id: 't1', status: 'canceled', unit_amount_cents: 900, billing_interval: 'month' },
      { tenant_id: 't1', status: 'active', unit_amount_cents: 25000, billing_interval: 'year' },
      { tenant_id: 't2', status: 'active', unit_amount_cents: 0, billing_interval: 'month' },
    ];
    const db = fakeDb({ tenants: { data: tenants, error: null }, tenant_members: { data: members, error: null }, subscriptions: { data: subscriptions, error: null } }, users);
    const [one, two] = await loadFounderSites(db);
    expect(one).toMatchObject({ name: 'One', maker: 'maker@example.com', paying: { cents: 25000, interval: 'year' }, canManage: true });
    expect(two).toMatchObject({ name: 'Two', maker: null, paying: null, planComp: 'free' });
  });

  it('copes with a member with no account and a subscription with no details', async () => {
    const db = fakeDb({
      tenants: { data: tenants.slice(0, 1), error: null },
      tenant_members: { data: [{ tenant_id: 't1', user_id: 'gone' }], error: null },
      subscriptions: { data: [{ tenant_id: 't1', status: 'trialing', unit_amount_cents: null, billing_interval: null }], error: null },
    });
    const [one] = await loadFounderSites(db);
    expect(one).toMatchObject({ maker: null, paying: null, canManage: false });
  });

  it('keeps a paying site whose subscription has no interval as monthly', async () => {
    const db = fakeDb({
      tenants: { data: tenants.slice(0, 1), error: null },
      subscriptions: { data: [{ tenant_id: 't1', status: 'active', unit_amount_cents: 500, billing_interval: null }], error: null },
    });
    const [one] = await loadFounderSites(db);
    expect(one?.paying).toEqual({ cents: 500, interval: 'month' });
  });

  it.each(['tenants', 'tenant_members', 'subscriptions'])('says so when %s can’t be read', async (table) => {
    await expect(loadFounderSites(fakeDb({ [table]: { data: null, error: { message: 'down' } } }))).rejects.toThrow('down');
  });

  it('says so when the accounts can’t be read', async () => {
    await expect(loadFounderSites(fakeDb({}, { data: null, error: { message: 'down' } }))).rejects.toThrow('down');
  });
});

describe('loadFounderMessages', () => {
  it('names each message’s site', async () => {
    const db = fakeDb({
      support_messages: {
        data: [
          { id: 'm1', tenant_id: 't1', email: 'a@example.com', message: 'Help', created_at: '2026-11-01' },
          { id: 'm2', tenant_id: 'gone', email: 'b@example.com', message: 'Hi', created_at: '2026-10-01' },
        ],
        error: null,
      },
      tenants: { data: [{ id: 't1', business_name: 'One' }], error: null },
    });
    expect(await loadFounderMessages(db)).toEqual([
      { id: 'm1', site: 'One', email: 'a@example.com', message: 'Help', sent: '2026-11-01' },
      { id: 'm2', site: '', email: 'b@example.com', message: 'Hi', sent: '2026-10-01' },
    ]);
  });
  it.each(['support_messages', 'tenants'])('says so when %s can’t be read', async (table) => {
    await expect(loadFounderMessages(fakeDb({ [table]: { data: null, error: { message: 'down' } } }))).rejects.toThrow('down');
  });
});
