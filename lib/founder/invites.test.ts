import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const m = vi.hoisted(() => ({ findUserByEmail: vi.fn(), createSite: vi.fn(), ownerOf: vi.fn(), createInviteCode: vi.fn(), findInviteCodes: vi.fn() }));
vi.mock('@/lib/backend/user-lookup', () => ({ findUserByEmail: m.findUserByEmail }));
vi.mock('@/lib/signup/server', () => ({ createSite: m.createSite, startPlanId: ({ plan }: { plan: string }) => `maker-${plan}` }));
vi.mock('@/lib/signup/confirm-email', () => ({ ownerOf: m.ownerOf }));
vi.mock('@/lib/billing/promos', async (orig) => ({ ...(await orig<object>()), createInviteCode: m.createInviteCode, findInviteCodes: m.findInviteCodes }));

import { composeInviteEmail, inviteDiscount, inviteFree, loadWaitingInvites, resendDiscount, resendFree, type Invitee } from './invites';

const APP = 'https://app.bohdiai.com';
const who: Invitee = { name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', plan: 'full', note: '' };
const stripeStub = {} as Stripe;
const code = { code: 'INVITE-ABC', percent: 100, months: 3, name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', plan: 'full', note: '' };

type Result = { data?: unknown; error: { message: string } | null };

function fakeDb(tables: Record<string, Result> = {}, link: Result = { data: { user: { id: 'u1' }, properties: { hashed_token: 'tok' } }, error: null }) {
  const writes: { table: string; op: string; value?: unknown }[] = [];
  const generateLink = vi.fn(async () => link);
  const deleteUser = vi.fn(async () => ({ error: null }));
  const from = (table: string): unknown => {
    const result = tables[table] ?? { data: [], error: null };
    const step: unknown = new Proxy(
      {},
      {
        get: (_t, key) => {
          if (key === 'then') return (done: (r: Result) => void) => done(result);
          if (key === 'single') return async () => result;
          return (value: unknown) => {
            if (key === 'update' || key === 'delete') writes.push({ table, op: key, value });
            return step;
          };
        },
      },
    );
    return step;
  };
  return { db: { from, auth: { admin: { generateLink, deleteUser } } } as unknown as SupabaseClient<Database>, writes, generateLink, deleteUser };
}

const sendOk = () => vi.fn(async (_msg: { to: string; subject: string; text: string; html: string }) => ({ error: null }));

beforeEach(() => {
  vi.clearAllMocks();
  m.findUserByEmail.mockResolvedValue(null);
  m.createSite.mockResolvedValue('t1');
  m.ownerOf.mockResolvedValue({ name: 'Lena', email: 'lena@example.com' });
  m.createInviteCode.mockResolvedValue(code);
  m.findInviteCodes.mockResolvedValue([]);
});

describe('composeInviteEmail', () => {
  const base = { name: 'Lena', business: 'A & B', heading: 'A heading', offer: 'An offer', next: 'What’s next', button: 'Go', link: 'https://x.example/?a=1&b=2', lasts: 'One day', note: '' };
  it('says the offer, the link and who it’s from', () => {
    const mail = composeInviteEmail(base);
    expect(mail.subject).toBe('Your BohdiAI site for A & B');
    expect(mail.text).toContain('Hi Lena,');
    expect(mail.text).toContain('Go: https://x.example/?a=1&b=2');
    expect(mail.html).toContain('href="https://x.example/?a=1&amp;b=2"');
  });
  it('adds Alex’s line, made safe', () => {
    const mail = composeInviteEmail({ ...base, note: 'Love <your> work' });
    expect(mail.text).toContain('Love <your> work');
    expect(mail.html).toContain('Love &lt;your&gt; work');
  });
});

describe('inviteFree', () => {
  it('makes the account and a free site, with no Stripe, and emails the link', async () => {
    const { db, writes, generateLink } = fakeDb();
    const send = sendOk();
    expect(await inviteFree(db, who, APP, send)).toEqual({ ok: true });
    expect(generateLink).toHaveBeenCalledWith({ type: 'invite', email: 'lena@example.com', options: { data: { name: 'Lena' } } });
    expect(m.createSite).toHaveBeenCalledWith(db, 'u1', expect.objectContaining({ plan: 'full', businessName: 'Saltmarsh', promoCode: '' }));
    expect(writes).toEqual([{ table: 'tenants', op: 'update', value: { plan_comp: 'free', plan_comp_note: 'Invited by Alex' } }]);
    const mail = send.mock.calls[0]?.[0];
    expect(mail?.to).toBe('lena@example.com');
    expect(mail?.text).toContain('no card to enter');
    expect(mail?.text).toContain('https://app.bohdiai.com/auth/confirm?token_hash=tok&type=invite');
  });
  it('turns away an email that already has an account', async () => {
    m.findUserByEmail.mockResolvedValue({ id: 'u9' });
    const { db, generateLink } = fakeDb();
    expect(await inviteFree(db, who, APP, sendOk())).toEqual({ ok: false, reason: 'exists' });
    expect(generateLink).not.toHaveBeenCalled();
  });
  it('says so when the link can’t be made', async () => {
    await expect(inviteFree(fakeDb({}, { data: null, error: { message: 'down' } }).db, who, APP, sendOk())).rejects.toThrow('down');
  });
  it('leaves nothing behind when the email doesn’t go', async () => {
    const { db, writes, deleteUser } = fakeDb();
    const send = vi.fn(async () => ({ error: { message: 'no send' } }));
    await expect(inviteFree(db, who, APP, send)).rejects.toThrow('no send');
    expect(writes.at(-1)).toMatchObject({ table: 'tenants', op: 'delete' });
    expect(deleteUser).toHaveBeenCalledWith('u1');
  });
  it('removes the account when the site can’t be made', async () => {
    m.createSite.mockRejectedValue(new Error('db down'));
    const { db, writes, deleteUser } = fakeDb();
    await expect(inviteFree(db, who, APP, sendOk())).rejects.toThrow('db down');
    expect(writes).toEqual([]);
    expect(deleteUser).toHaveBeenCalledWith('u1');
  });
  it('leaves nothing behind when the site can’t be marked free', async () => {
    const { db, deleteUser } = fakeDb({ tenants: { error: { message: 'down' } } });
    await expect(inviteFree(db, who, APP, sendOk())).rejects.toThrow('mark the site free');
    expect(deleteUser).toHaveBeenCalled();
  });
});

describe('inviteDiscount', () => {
  it('emails a link with the code already on it', async () => {
    const send = sendOk();
    expect(await inviteDiscount(stripeStub, who, { percent: 100, months: 3 }, 'https://bohdiai.com', send)).toEqual({ ok: true });
    const mail = send.mock.calls[0]?.[0];
    expect(mail?.text).toContain('https://bohdiai.com/start?plan=maker-full&code=INVITE-ABC');
    expect(mail?.text).toContain('3 months free');
  });
  it('turns away an email that already has an account', async () => {
    m.findUserByEmail.mockResolvedValue({ id: 'u9' });
    expect(await inviteDiscount(stripeStub, who, { percent: 10, months: null }, 'https://bohdiai.com', sendOk())).toEqual({ ok: false, reason: 'exists' });
    expect(m.createInviteCode).not.toHaveBeenCalled();
  });
  it('says so when the email doesn’t go', async () => {
    await expect(inviteDiscount(stripeStub, who, { percent: 10, months: null }, 'https://bohdiai.com', vi.fn(async () => ({ error: { message: 'no send' } })))).rejects.toThrow('no send');
  });
});

describe('loadWaitingInvites', () => {
  it('lists free sites with no form sent, and open codes', async () => {
    m.findInviteCodes.mockResolvedValue([code]);
    const { db } = fakeDb({ tenants: { data: [{ id: 't1', business_name: 'Saltmarsh' }, { id: 't2', business_name: 'Started' }], error: null }, intakes: { data: [{ tenant_id: 't2' }], error: null } });
    expect(await loadWaitingInvites(stripeStub, db)).toEqual([
      { key: 't1', kind: 'free', name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', deal: 'Free site', tenantId: 't1', code: null },
      { key: 'INVITE-ABC', kind: 'discount', name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', deal: '3 months free', tenantId: null, code: 'INVITE-ABC' },
    ]);
  });
  it.each(['tenants', 'intakes'])('says so when %s can’t be read', async (table) => {
    await expect(loadWaitingInvites(stripeStub, fakeDb({ [table]: { error: { message: 'down' } } }).db)).rejects.toThrow('down');
  });
});

describe('sending again', () => {
  it('makes a fresh link for a free site', async () => {
    const { db, generateLink } = fakeDb({ tenants: { data: { business_name: 'Saltmarsh', plan: 'full' }, error: null } });
    const send = sendOk();
    await resendFree(db, 't1', APP, send);
    expect(generateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'lena@example.com' });
    expect(send.mock.calls[0]?.[0].text).toContain('type=recovery');
  });
  it('says so when the site or the link can’t be read', async () => {
    await expect(resendFree(fakeDb({ tenants: { error: { message: 'down' } } }).db, 't1', APP, sendOk())).rejects.toThrow('down');
    await expect(resendFree(fakeDb({ tenants: { data: { business_name: 'S', plan: 'full' }, error: null } }, { error: { message: 'no link' } }).db, 't1', APP, sendOk())).rejects.toThrow('no link');
  });
  it('sends a code’s invite again', async () => {
    m.findInviteCodes.mockResolvedValue([code]);
    const send = sendOk();
    await resendDiscount(stripeStub, fakeDb().db, 'INVITE-ABC', 'https://bohdiai.com', send);
    expect(send.mock.calls[0]?.[0].text).toContain('code=INVITE-ABC');
  });
  it('says so when the code is gone', async () => {
    await expect(resendDiscount(stripeStub, fakeDb().db, 'X', 'https://bohdiai.com', sendOk())).rejects.toThrow('no waiting invite');
  });
});
