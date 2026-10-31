import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';
import { composeConfirmEmail, ownerOf, sendConfirmation, type Owner } from './confirm-email';

const words = keyWords(INTAKE_WORD_SPOTS, 'intake');
const owner: Owner = { userId: 'u1', email: 'lena@example.com', name: 'Lena', confirmed: false };

function fakeDb(link: { data: unknown; error: unknown } = { data: { properties: { hashed_token: 'hash1' } }, error: null }) {
  const generateLink = vi.fn(async () => link);
  return { db: { auth: { admin: { generateLink } } } as unknown as SupabaseClient<Database>, generateLink };
}

describe('composeConfirmEmail', () => {
  it('is all the form’s own words, with the link as its button', () => {
    const mail = composeConfirmEmail({ name: 'Lena', link: 'https://app.bohdiai.com/auth/confirm?x=<1>', words });
    expect(mail.subject).toBe('intake.confirm.subject');
    expect(mail.text).toContain('intake.confirm.button: https://app.bohdiai.com/auth/confirm?x=<1>');
    expect(mail.text).toContain('intake.confirm.notYou');
    expect(mail.html).toContain('href="https://app.bohdiai.com/auth/confirm?x=&lt;1&gt;"');
  });
});

describe('sendConfirmation', () => {
  it('emails a one-time link to the app’s confirm page', async () => {
    const { db, generateLink } = fakeDb();
    const send = vi.fn(async (_msg: { to: string; subject: string; text: string; html: string }) => ({ error: null }));
    await sendConfirmation({ db, owner, appOrigin: 'https://app.bohdiai.com', words, send });
    expect(generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: 'lena@example.com' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'lena@example.com', subject: 'intake.confirm.subject' }));
    expect(send.mock.calls[0]?.[0]).toMatchObject({ text: expect.stringContaining('https://app.bohdiai.com/auth/confirm?token_hash=hash1&type=signup') });
  });

  it('sends nothing once they’re confirmed', async () => {
    const { db, generateLink } = fakeDb();
    const send = vi.fn();
    await sendConfirmation({ db, owner: { ...owner, confirmed: true }, appOrigin: 'https://app.bohdiai.com', words, send });
    expect(generateLink).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('fails loudly when the link or the email fails', async () => {
    const bad = fakeDb({ data: null, error: { message: 'no' } });
    await expect(sendConfirmation({ db: bad.db, owner, appOrigin: 'https://a', words, send: vi.fn() })).rejects.toThrow(/confirmation link/);
    const { db } = fakeDb();
    await expect(sendConfirmation({ db, owner, appOrigin: 'https://a', words, send: async () => ({ error: { message: 'bounced' } }) })).rejects.toThrow(/bounced/);
  });
});

describe('ownerOf', () => {
  function db(member: unknown, user: unknown) {
    const chain = { select: () => chain, eq: () => chain, limit: () => chain, maybeSingle: async () => ({ data: member, error: null }) };
    return { from: () => chain, auth: { admin: { getUserById: async () => ({ data: { user }, error: null }) } } } as unknown as SupabaseClient<Database>;
  }

  it('reads the owner’s email, name and whether they’ve confirmed', async () => {
    const o = await ownerOf(db({ user_id: 'u1' }, { id: 'u1', email: 'lena@example.com', user_metadata: { name: 'Lena' }, email_confirmed_at: null }), 't1');
    expect(o).toEqual({ userId: 'u1', email: 'lena@example.com', name: 'Lena', confirmed: false });
  });

  it('fails loudly for a site with no owner', async () => {
    await expect(ownerOf(db(null, null), 't1')).rejects.toThrow(/no owner/);
  });
});
