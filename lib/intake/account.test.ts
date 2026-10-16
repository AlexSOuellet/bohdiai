import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { ensureAccount, removeNewAccount } from './account';

const logError = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a) } }));

function admin(create: { data: { user: { id: string } | null }; error: { code?: string; status?: number; message: string } | null }, del: { error: { message: string } | null } = { error: null }) {
  const createUser = vi.fn(() => Promise.resolve(create));
  const deleteUser = vi.fn(() => Promise.resolve(del));
  return { db: { auth: { admin: { createUser, deleteUser } } } as unknown as SupabaseClient<Database>, createUser, deleteUser };
}

describe('ensureAccount', () => {
  it('makes a new, confirmed account with their password', async () => {
    const { db, createUser } = admin({ data: { user: { id: 'u1' } }, error: null });
    const check = vi.fn();
    expect(await ensureAccount(db, check, 'lena@example.com', 'tide pools 22')).toEqual({ ok: true, userId: 'u1', created: true });
    expect(createUser).toHaveBeenCalledWith({ email: 'lena@example.com', password: 'tide pools 22', email_confirm: true });
    expect(check).not.toHaveBeenCalled();
  });

  it('an email that has an account is taken only with that account’s password, never changing it', async () => {
    const { db } = admin({ data: { user: null }, error: { code: 'email_exists', status: 422, message: 'exists' } });
    expect(await ensureAccount(db, () => Promise.resolve('old'), 'lena@example.com', 'right')).toEqual({ ok: true, userId: 'old', created: false });
    expect(await ensureAccount(db, () => Promise.resolve(null), 'lena@example.com', 'wrong')).toEqual({ ok: false, reason: 'accountExists' });
    const byStatus = admin({ data: { user: null }, error: { status: 422, message: 'exists' } });
    expect(await ensureAccount(byStatus.db, () => Promise.resolve(null), 'a@b.co', 'x')).toEqual({ ok: false, reason: 'accountExists' });
  });

  it('anything else fails, and is logged', async () => {
    const { db } = admin({ data: { user: null }, error: { status: 500, message: 'down' } });
    expect(await ensureAccount(db, vi.fn(), 'a@b.co', 'x')).toEqual({ ok: false, reason: 'failed' });
    const empty = admin({ data: { user: null }, error: null });
    expect(await ensureAccount(empty.db, vi.fn(), 'a@b.co', 'x')).toEqual({ ok: false, reason: 'failed' });
    expect(logError).toHaveBeenCalled();
  });
});

describe('removeNewAccount', () => {
  it('removes the account, and logs when it can’t', async () => {
    const ok = admin({ data: { user: null }, error: null });
    await removeNewAccount(ok.db, 'u1');
    expect(ok.deleteUser).toHaveBeenCalledWith('u1');
    logError.mockClear();
    const bad = admin({ data: { user: null }, error: null }, { error: { message: 'nope' } });
    await removeNewAccount(bad.db, 'u1');
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
