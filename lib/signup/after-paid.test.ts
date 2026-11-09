import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const ownerOf = vi.fn();
const sendConfirmation = vi.fn();
vi.mock('./confirm-email', () => ({ ownerOf: (...a: unknown[]) => ownerOf(...a), sendConfirmation: (...a: unknown[]) => sendConfirmation(...a) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: async () => ({}) }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));
const resendSend = vi.fn();
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send: (...a: unknown[]) => resendSend(...a) } }), fromEmail: () => 'BohdiAI <site@example.com>' }));

import { confirmOwner, confirmSite, fixEmail, sendAgain } from './after-paid';
import type { Send } from './confirm-email';

const owner = { userId: 'u1', email: 'lena@example.com', name: 'Lena', confirmed: false };

function fakeStripe(session: Record<string, unknown> = {}) {
  const retrieve = vi.fn(async () => ({ status: 'complete', client_reference_id: 't1', customer: 'cus_1', ...session }));
  const update = vi.fn(async () => ({}));
  return { s: { checkout: { sessions: { retrieve } }, customers: { update } } as unknown as Stripe, retrieve, update };
}

function fakeDb(updateUser: { error: unknown } = { error: null }, tenantError: { message: string } | null = null) {
  const updateUserById = vi.fn(async () => updateUser);
  const tenantUpdate = vi.fn();
  const db = {
    auth: { admin: { updateUserById } },
    from: () => ({ update: (v: unknown) => ({ eq: async (c: string, id: unknown) => (tenantUpdate(v, c, id), { error: tenantError }) }) }),
  } as unknown as SupabaseClient<Database>;
  return { db, updateUserById, tenantUpdate };
}

beforeEach(() => {
  ownerOf.mockReset().mockResolvedValue(owner);
  sendConfirmation.mockReset().mockResolvedValue(undefined);
});

describe('sendAgain', () => {
  it('sends a fresh link to the paid site’s owner, read from Stripe and the database', async () => {
    const { s, retrieve } = fakeStripe();
    expect(await sendAgain(s, fakeDb().db, 'cs_1')).toEqual({ ok: true, email: 'lena@example.com' });
    expect(retrieve).toHaveBeenCalledWith('cs_1');
    expect(ownerOf).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ owner, appOrigin: 'https://app.bohdiai.com' }));
  });

  it('does nothing for a checkout that isn’t paid, or isn’t a checkout', async () => {
    expect(await sendAgain(fakeStripe({ status: 'open' }).s, fakeDb().db, 'cs_1')).toEqual({ ok: false, reason: 'notFound' });
    const { s, retrieve } = fakeStripe();
    expect(await sendAgain(s, fakeDb().db, 'tenant-id')).toEqual({ ok: false, reason: 'notFound' });
    expect(retrieve).not.toHaveBeenCalled();
    expect(sendConfirmation).not.toHaveBeenCalled();
  });

  it('does nothing once they’ve confirmed', async () => {
    ownerOf.mockResolvedValue({ ...owner, confirmed: true });
    expect(await sendAgain(fakeStripe().s, fakeDb().db, 'cs_1')).toEqual({ ok: false, reason: 'confirmed' });
    expect(sendConfirmation).not.toHaveBeenCalled();
  });
});

describe('fixEmail', () => {
  it('moves the account, the site and Stripe to the new email, and sends the link there', async () => {
    const { s, update } = fakeStripe();
    const { db, updateUserById, tenantUpdate } = fakeDb();
    expect(await fixEmail(s, db, 'cs_1', ' Lena.M@Example.com ')).toEqual({ ok: true, email: 'lena.m@example.com' });
    expect(updateUserById).toHaveBeenCalledWith('u1', { email: 'lena.m@example.com', email_confirm: false });
    expect(tenantUpdate).toHaveBeenCalledWith({ contact_email: 'lena.m@example.com' }, 'id', 't1');
    expect(update).toHaveBeenCalledWith('cus_1', { email: 'lena.m@example.com' });
    expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ owner: { ...owner, email: 'lena.m@example.com' } }));
  });

  it('refuses an email that doesn’t look right before anything else', async () => {
    const { s, retrieve } = fakeStripe();
    expect(await fixEmail(s, fakeDb().db, 'cs_1', 'lena')).toEqual({ ok: false, reason: 'email' });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('says so when the new email already has an account', async () => {
    const { db } = fakeDb({ error: { code: 'email_exists', status: 422, message: 'taken' } });
    expect(await fixEmail(fakeStripe().s, db, 'cs_1', 'taken@example.com')).toEqual({ ok: false, reason: 'accountExists' });
    expect(sendConfirmation).not.toHaveBeenCalled();
  });

  it('never moves a confirmed account', async () => {
    ownerOf.mockResolvedValue({ ...owner, confirmed: true });
    const { db, updateUserById } = fakeDb();
    expect(await fixEmail(fakeStripe().s, db, 'cs_1', 'new@example.com')).toEqual({ ok: false, reason: 'confirmed' });
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe('the confirmation email itself', () => {
  const sentWith = (): Send => (sendConfirmation.mock.calls[0]?.[0] as { send: Send }).send;
  const msg = { to: 'lena@example.com', subject: 'Confirm your email', text: 'Open the link', html: '<p>Open the link</p>' };

  beforeEach(() => {
    resendSend.mockReset();
  });

  it('goes to the address the sign-up happened on, or bohdiai.com by default', async () => {
    await confirmOwner(fakeDb().db, owner, 'http://localhost:3000');
    expect(sendConfirmation).toHaveBeenLastCalledWith(expect.objectContaining({ owner, words: {}, appOrigin: expect.stringContaining('localhost') }));
    expect(sendConfirmation.mock.lastCall?.[0]).not.toMatchObject({ appOrigin: 'https://app.bohdiai.com' });
    await confirmOwner(fakeDb().db, owner);
    expect(sendConfirmation).toHaveBeenLastCalledWith(expect.objectContaining({ appOrigin: 'https://app.bohdiai.com' }));
  });

  it('is sent through Resend from BohdiAI’s own address', async () => {
    resendSend.mockResolvedValue({ data: { id: 'em_1' }, error: null });
    await confirmOwner(fakeDb().db, owner);
    expect(await sentWith()(msg)).toEqual({ error: null });
    expect(resendSend).toHaveBeenCalledWith({ from: 'BohdiAI <site@example.com>', ...msg });
  });

  it('passes on what Resend says went wrong', async () => {
    resendSend.mockResolvedValue({ data: null, error: { message: 'domain not verified', name: 'validation_error' } });
    await confirmOwner(fakeDb().db, owner);
    expect(await sentWith()(msg)).toEqual({ error: { message: 'domain not verified' } });
  });

  it('confirmSite looks up the site’s owner and emails them', async () => {
    const { db } = fakeDb();
    await confirmSite(db, 't7', 'https://bohdiai.com');
    expect(ownerOf).toHaveBeenCalledWith(db, 't7');
    expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ owner, db, appOrigin: 'https://app.bohdiai.com' }));
  });
});

describe('sendAgain and fixEmail, the edges', () => {
  it('does nothing for a paid checkout with no site on it', async () => {
    expect(await sendAgain(fakeStripe({ client_reference_id: null }).s, fakeDb().db, 'cs_1')).toEqual({ ok: false, reason: 'notFound' });
    expect(ownerOf).not.toHaveBeenCalled();
  });

  it('refuses a too-long email before anything else', async () => {
    const { s, retrieve } = fakeStripe();
    expect(await fixEmail(s, fakeDb().db, 'cs_1', `${'a'.repeat(300)}@example.com`)).toEqual({ ok: false, reason: 'email' });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('says not found for a checkout that isn’t a paid sign-up', async () => {
    const { db, updateUserById } = fakeDb();
    expect(await fixEmail(fakeStripe({ status: 'open' }).s, db, 'cs_1', 'new@example.com')).toEqual({ ok: false, reason: 'notFound' });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('says the email has an account when Supabase answers 422 with no code', async () => {
    const { db, tenantUpdate } = fakeDb({ error: { status: 422, message: 'registered' } });
    expect(await fixEmail(fakeStripe().s, db, 'cs_1', 'taken@example.com')).toEqual({ ok: false, reason: 'accountExists' });
    expect(tenantUpdate).not.toHaveBeenCalled();
  });

  it('stops when the account’s email can’t be changed for any other reason', async () => {
    const { db, tenantUpdate } = fakeDb({ error: { status: 500, message: 'auth down' } });
    await expect(fixEmail(fakeStripe().s, db, 'cs_1', 'new@example.com')).rejects.toThrow('Could not change the email: auth down');
    expect(tenantUpdate).not.toHaveBeenCalled();
    expect(sendConfirmation).not.toHaveBeenCalled();
  });

  it('stops when the site’s email can’t be changed, before Stripe or the link', async () => {
    const { s, update } = fakeStripe();
    await expect(fixEmail(s, fakeDb({ error: null }, { message: 'locked' }).db, 'cs_1', 'new@example.com')).rejects.toThrow("Could not change the site's email: locked");
    expect(update).not.toHaveBeenCalled();
    expect(sendConfirmation).not.toHaveBeenCalled();
  });

  it('moves an expanded Stripe customer, and skips Stripe when the checkout has no customer', async () => {
    const expanded = fakeStripe({ customer: { id: 'cus_9' } });
    await fixEmail(expanded.s, fakeDb().db, 'cs_1', 'new@example.com');
    expect(expanded.update).toHaveBeenCalledWith('cus_9', { email: 'new@example.com' });
    const none = fakeStripe({ customer: null });
    expect(await fixEmail(none.s, fakeDb().db, 'cs_1', 'new@example.com')).toEqual({ ok: true, email: 'new@example.com' });
    expect(none.update).not.toHaveBeenCalled();
    expect(sendConfirmation).toHaveBeenCalledTimes(2);
  });
});
