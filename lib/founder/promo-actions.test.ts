import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  requireFounder: vi.fn(),
  currentSubscription: vi.fn(),
  createPromo: vi.fn(),
  endPromo: vi.fn(),
  applyDiscount: vi.fn(),
  clearDiscount: vi.fn(),
  inviteFree: vi.fn(),
  inviteDiscount: vi.fn(),
  resendFree: vi.fn(),
  resendDiscount: vi.fn(),
  emailSend: vi.fn(),
  tenantWrites: [] as unknown[],
  tenantError: null as { message: string } | null,
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('./access', () => ({ requireFounder: m.requireFounder }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'app.bohdiai.com', 'x-forwarded-proto': 'https' }) }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send: m.emailSend } }), fromEmail: () => 'a@b.co' }));
vi.mock('./invites', () => ({ inviteFree: m.inviteFree, inviteDiscount: m.inviteDiscount, resendFree: m.resendFree, resendDiscount: m.resendDiscount }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription: m.currentSubscription }));
vi.mock('@/lib/billing/promos', async (orig) => ({ ...(await orig<object>()), createPromo: m.createPromo, endPromo: m.endPromo, applyDiscount: m.applyDiscount, clearDiscount: m.clearDiscount }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      update: (value: unknown) => {
        m.tenantWrites.push(value);
        return { eq: async () => ({ error: m.tenantError }) };
      },
    }),
  }),
}));

import { createPromoCode, endFree, endPromoCode, giveDiscount, inviteMaker, makeFree, removeDiscount, sendInviteAgain } from './promo-actions';

const form = (fields: Record<string, string>): FormData => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const paying = { unitCents: 2500 };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireFounder.mockResolvedValue({ id: 'alex' });
  m.currentSubscription.mockResolvedValue(paying);
  m.createPromo.mockResolvedValue(undefined);
  m.applyDiscount.mockResolvedValue(undefined);
  m.clearDiscount.mockResolvedValue(undefined);
  m.tenantWrites.length = 0;
  m.tenantError = null;
});

describe('only Alex', () => {
  it.each([
    ['createPromoCode', () => createPromoCode(null, form({}))],
    ['endPromoCode', () => endPromoCode(form({}))],
    ['giveDiscount', () => giveDiscount(null, form({}))],
    ['removeDiscount', () => removeDiscount(null, form({}))],
    ['makeFree', () => makeFree(null, form({}))],
    ['endFree', () => endFree(null, form({}))],
    ['inviteMaker', () => inviteMaker(null, form({}))],
    ['sendInviteAgain', () => sendInviteAgain(null, form({}))],
  ])('%s stops at the lock', async (_name, run) => {
    m.requireFounder.mockRejectedValue(new Error('NOT_FOUND'));
    await expect(run()).rejects.toThrow('NOT_FOUND');
    expect(m.createPromo).not.toHaveBeenCalled();
    expect(m.applyDiscount).not.toHaveBeenCalled();
    expect(m.clearDiscount).not.toHaveBeenCalled();
    expect(m.endPromo).not.toHaveBeenCalled();
    expect(m.tenantWrites).toEqual([]);
  });
});

describe('inviteMaker', () => {
  const good = { name: 'Lena', email: ' Lena@Example.com ', business: 'Saltmarsh', plan: 'full', note: 'Love your work' };
  const who = { name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', plan: 'full', note: 'Love your work' };

  beforeEach(() => {
    m.inviteFree.mockResolvedValue({ ok: true });
    m.inviteDiscount.mockResolvedValue({ ok: true });
  });

  it('sends a free site with no Stripe', async () => {
    expect(await inviteMaker(null, form({ ...good, kind: 'site' }))).toEqual({ ok: true, message: 'Invite sent to lena@example.com.' });
    expect(m.inviteFree).toHaveBeenCalledWith(expect.anything(), who, 'https://app.bohdiai.com', expect.any(Function));
    expect(m.inviteDiscount).not.toHaveBeenCalled();
  });
  it('sends a discount with the public site’s address', async () => {
    await inviteMaker(null, form({ ...good, kind: 'free', months: '3' }));
    expect(m.inviteDiscount).toHaveBeenCalledWith({}, who, { percent: 100, months: 3 }, 'https://bohdiai.com', expect.any(Function));
    expect(m.inviteFree).not.toHaveBeenCalled();
  });
  it.each([
    [{ ...good, name: '', kind: 'site' }, 'Add their name and business name.'],
    [{ ...good, business: ' ', kind: 'site' }, 'Add their name and business name.'],
    [{ ...good, email: 'nope', kind: 'site' }, 'That email doesn’t look right.'],
    [{ ...good, plan: 'free', kind: 'site' }, 'Pick a plan.'],
    [{ ...good, kind: 'percent', percent: 'x' }, 'Percent has to be a whole number from 1 to 99.'],
  ])('turns away %j', async (fields, message) => {
    expect(await inviteMaker(null, form(fields))).toEqual({ ok: false, message });
    expect(m.inviteFree).not.toHaveBeenCalled();
  });
  it('says when the email already has an account', async () => {
    m.inviteFree.mockResolvedValue({ ok: false, reason: 'exists' });
    expect((await inviteMaker(null, form({ ...good, kind: 'site' }))).message).toContain('already has an account');
  });
  it('says when it fails', async () => {
    m.inviteFree.mockRejectedValue(new Error('down'));
    expect((await inviteMaker(null, form({ ...good, kind: 'site' }))).ok).toBe(false);
  });
  it('sends through Resend, and reports what it says', async () => {
    m.inviteFree.mockImplementation(async (_db: unknown, _who: unknown, _app: unknown, send: (msg: object) => Promise<unknown>) => {
      m.emailSend.mockResolvedValueOnce({ error: null });
      expect(await send({ to: 'a@b.co' })).toEqual({ error: null });
      m.emailSend.mockResolvedValueOnce({ error: { message: 'bad' } });
      expect(await send({ to: 'a@b.co' })).toEqual({ error: { message: 'bad' } });
      return { ok: true };
    });
    expect((await inviteMaker(null, form({ ...good, kind: 'site' }))).ok).toBe(true);
  });
});

describe('sendInviteAgain', () => {
  it('says when there’s nothing to send', async () => {
    m.resendFree.mockResolvedValueOnce('started');
    expect((await sendInviteAgain(null, form({ tenantId: 't1' }))).message).toContain('already set a password');
  });
  it('sends a free site’s link', async () => {
    m.resendFree.mockResolvedValueOnce('sent');
    expect(await sendInviteAgain(null, form({ tenantId: 't1' }))).toEqual({ ok: true, message: 'Sent.' });
    expect(m.resendFree).toHaveBeenCalledWith(expect.anything(), 't1', 'https://app.bohdiai.com', expect.any(Function));
  });
  it('sends a code’s invite', async () => {
    await sendInviteAgain(null, form({ code: 'INVITE-ABC' }));
    expect(m.resendDiscount).toHaveBeenCalledWith({}, expect.anything(), 'INVITE-ABC', 'https://bohdiai.com', expect.any(Function));
  });
  it('says when it fails', async () => {
    m.resendFree.mockRejectedValueOnce(new Error('down'));
    expect((await sendInviteAgain(null, form({ tenantId: 't1' }))).ok).toBe(false);
  });
});

describe('createPromoCode', () => {
  it('makes a months-free code for new sign-ups', async () => {
    const r = await createPromoCode(null, form({ code: ' welcome ', kind: 'free', months: '3', audience: 'new', expires: '2099-01-31', maxUses: '50' }));
    expect(r).toEqual({ ok: true, message: 'WELCOME is ready to use.' });
    expect(m.createPromo).toHaveBeenCalledWith({}, { code: 'WELCOME', percent: 100, months: 3, audience: 'new', expires: '2099-01-31T23:59:59.000Z', maxUses: 50 });
  });
  it('makes a percent off for everyone that never ends', async () => {
    await createPromoCode(null, form({ code: 'THANKS', kind: 'percent', percent: '10', audience: 'everyone' }));
    expect(m.createPromo).toHaveBeenCalledWith({}, { code: 'THANKS', percent: 10, months: null, audience: 'everyone', expires: null, maxUses: null });
  });
  it.each([
    [{ code: 'a b', percent: '10' }, 'A code is 3 to 30 letters, numbers or dashes.'],
    [{ code: 'GOOD', percent: '0' }, 'Percent has to be a whole number from 1 to 99.'],
    [{ code: 'GOOD', percent: '100' }, 'Percent has to be a whole number from 1 to 99.'],
    [{ code: 'GOOD', percent: 'ten' }, 'Percent has to be a whole number from 1 to 99.'],
    [{ code: 'GOOD', kind: 'free' }, 'Say how many months free.'],
    [{ code: 'GOOD', percent: '10', months: '99' }, 'Months has to be a whole number from 1 to 36.'],
    [{ code: 'GOOD', percent: '10', expires: '2020-01-01' }, 'The last day has to be in the future.'],
    [{ code: 'GOOD', percent: '10', expires: 'soon' }, 'The last day has to be in the future.'],
    [{ code: 'GOOD', percent: '10', maxUses: 'lots' }, 'Total uses has to be a whole number.'],
  ])('turns away %j', async (fields, message) => {
    expect(await createPromoCode(null, form(fields))).toEqual({ ok: false, message });
    expect(m.createPromo).not.toHaveBeenCalled();
  });
  it('says when the code is taken', async () => {
    m.createPromo.mockRejectedValue(Object.assign(new Error('x'), { code: 'resource_already_exists' }));
    expect(await createPromoCode(null, form({ code: 'GOOD', percent: '10' }))).toEqual({ ok: false, message: 'GOOD already exists. Pick another code.' });
  });
  it('says when Stripe fails', async () => {
    m.createPromo.mockRejectedValue(new Error('down'));
    expect((await createPromoCode(null, form({ code: 'GOOD', percent: '10' }))).ok).toBe(false);
  });
});

describe('endPromoCode', () => {
  it('ends the code', async () => {
    await endPromoCode(form({ code: 'GOOD' }));
    expect(m.endPromo).toHaveBeenCalledWith({}, 'GOOD');
  });
});

describe('giveDiscount', () => {
  it('gives a maker months free', async () => {
    expect((await giveDiscount(null, form({ tenantId: 't1', kind: 'free', months: '3' }))).ok).toBe(true);
    expect(m.applyDiscount).toHaveBeenCalledWith({}, expect.anything(), paying, { percent: 100, months: 3 }, expect.any(Date));
  });
  it('checks the form first', async () => {
    expect((await giveDiscount(null, form({ tenantId: 't1', percent: 'x' }))).ok).toBe(false);
    expect(m.currentSubscription).not.toHaveBeenCalled();
  });
  it('has nothing to discount on someone not paying', async () => {
    m.currentSubscription.mockResolvedValue(null);
    expect((await giveDiscount(null, form({ tenantId: 't1', percent: '10' }))).ok).toBe(false);
    m.currentSubscription.mockResolvedValue({ unitCents: 0 });
    expect((await giveDiscount(null, form({ tenantId: 't1', percent: '10' }))).ok).toBe(false);
    expect(m.applyDiscount).not.toHaveBeenCalled();
  });
  it('says when Stripe fails', async () => {
    m.applyDiscount.mockRejectedValue(new Error('down'));
    expect((await giveDiscount(null, form({ tenantId: 't1', percent: '10' }))).ok).toBe(false);
  });
});

describe('removeDiscount', () => {
  it('takes it off', async () => {
    expect((await removeDiscount(null, form({ tenantId: 't1' }))).ok).toBe(true);
    expect(m.clearDiscount).toHaveBeenCalled();
  });
  it('has nothing to do with no subscription', async () => {
    m.currentSubscription.mockResolvedValue(null);
    expect((await removeDiscount(null, form({ tenantId: 't1' }))).ok).toBe(true);
    expect(m.clearDiscount).not.toHaveBeenCalled();
  });
  it('says when Stripe fails', async () => {
    m.clearDiscount.mockRejectedValue('down');
    expect((await removeDiscount(null, form({ tenantId: 't1' }))).ok).toBe(false);
  });
});

describe('makeFree', () => {
  it('stops Stripe charging, then marks the site free', async () => {
    expect((await makeFree(null, form({ tenantId: 't1', note: 'Friend' }))).ok).toBe(true);
    expect(m.applyDiscount).toHaveBeenCalledWith({}, expect.anything(), paying, { percent: 100, months: null }, expect.any(Date));
    expect(m.tenantWrites).toEqual([{ plan_comp: 'free', plan_comp_note: 'Friend' }]);
  });
  it('marks a site Stripe doesn’t bill, with no note', async () => {
    m.currentSubscription.mockResolvedValue(null);
    await makeFree(null, form({ tenantId: 't1' }));
    expect(m.applyDiscount).not.toHaveBeenCalled();
    expect(m.tenantWrites).toEqual([{ plan_comp: 'free', plan_comp_note: null }]);
  });
  it('leaves the site as it was when Stripe fails', async () => {
    m.applyDiscount.mockRejectedValue(new Error('down'));
    expect((await makeFree(null, form({ tenantId: 't1' }))).ok).toBe(false);
    expect(m.tenantWrites).toEqual([]);
  });
  it('says when the site can’t be saved', async () => {
    m.tenantError = { message: 'down' };
    expect((await makeFree(null, form({ tenantId: 't1' }))).ok).toBe(false);
  });
});

describe('endFree', () => {
  it('puts Stripe back, then the site', async () => {
    expect((await endFree(null, form({ tenantId: 't1' }))).ok).toBe(true);
    expect(m.clearDiscount).toHaveBeenCalled();
    expect(m.tenantWrites).toEqual([{ plan_comp: null, plan_comp_note: null }]);
  });
  it('works on a site Stripe doesn’t bill', async () => {
    m.currentSubscription.mockResolvedValue(null);
    expect((await endFree(null, form({ tenantId: 't1' }))).ok).toBe(true);
  });
  it('says when it fails', async () => {
    m.tenantError = { message: 'down' };
    expect((await endFree(null, form({ tenantId: 't1' }))).ok).toBe(false);
  });
});
