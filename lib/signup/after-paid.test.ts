import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const ownerOf = vi.fn();
const sendConfirmation = vi.fn();
vi.mock('./confirm-email', () => ({ ownerOf: (...a: unknown[]) => ownerOf(...a), sendConfirmation: (...a: unknown[]) => sendConfirmation(...a) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: async () => ({}) }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send: vi.fn() } }), fromEmail: () => 'BohdiAI <site@example.com>' }));

import { fixEmail, sendAgain } from './after-paid';

const owner = { userId: 'u1', email: 'lena@example.com', name: 'Lena', confirmed: false };

function fakeStripe(session: Record<string, unknown> = {}) {
  const retrieve = vi.fn(async () => ({ status: 'complete', client_reference_id: 't1', customer: 'cus_1', ...session }));
  const update = vi.fn(async () => ({}));
  return { s: { checkout: { sessions: { retrieve } }, customers: { update } } as unknown as Stripe, retrieve, update };
}

function fakeDb(updateUser: { error: unknown } = { error: null }) {
  const updateUserById = vi.fn(async () => updateUser);
  const tenantUpdate = vi.fn();
  const db = {
    auth: { admin: { updateUserById } },
    from: () => ({ update: (v: unknown) => ({ eq: async (c: string, id: unknown) => (tenantUpdate(v, c, id), { error: null }) }) }),
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
