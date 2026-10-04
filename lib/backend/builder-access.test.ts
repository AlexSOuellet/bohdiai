import { describe, it, expect, vi } from 'vitest';
import { ensureBuilderAccess } from './builder-access';

function fakeDb(opts: { userId?: unknown; lookupError?: string; existing?: unknown; readError?: string; insertError?: string }) {
  const insert = vi.fn(async () => ({ error: opts.insertError === undefined ? null : { message: opts.insertError } }));
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: opts.existing ?? null, error: opts.readError === undefined ? null : { message: opts.readError } }),
    insert,
  };
  const db = {
    rpc: async () => ({ data: opts.userId ?? null, error: opts.lookupError === undefined ? null : { message: opts.lookupError } }),
    from: () => chain,
  } as never;
  return { db, insert };
}

describe('ensureBuilderAccess', () => {
  it('adds the builder as an active admin when missing', async () => {
    const { db, insert } = fakeDb({ userId: 'u1' });
    expect(await ensureBuilderAccess(db, 't1')).toEqual({ ok: true, added: true });
    expect(insert).toHaveBeenCalledWith({ tenant_id: 't1', user_id: 'u1', role: 'admin', status: 'active' });
  });

  it('leaves an existing membership alone', async () => {
    const { db, insert } = fakeDb({ userId: 'u1', existing: { id: 'm1' } });
    expect(await ensureBuilderAccess(db, 't1')).toEqual({ ok: true, added: false });
    expect(insert).not.toHaveBeenCalled();
  });

  it('reports a missing account and every failed step', async () => {
    expect(await ensureBuilderAccess(fakeDb({}).db, 't1', 'x@y.z')).toEqual({ ok: false, error: 'no account for x@y.z' });
    expect(await ensureBuilderAccess(fakeDb({ lookupError: 'down' }).db, 't1')).toEqual({ ok: false, error: 'account lookup failed: down' });
    expect(await ensureBuilderAccess(fakeDb({ userId: 'u1', readError: 'down' }).db, 't1')).toEqual({ ok: false, error: 'membership lookup failed: down' });
    expect(await ensureBuilderAccess(fakeDb({ userId: 'u1', insertError: 'down' }).db, 't1')).toEqual({ ok: false, error: 'membership add failed: down' });
  });
});
