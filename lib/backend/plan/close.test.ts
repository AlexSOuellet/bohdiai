import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

vi.mock('@/lib/founder/access', () => ({ isFounder: (id: string) => id === 'alex' }));
const { removeAccount, nameMatches } = await import('./close');

/** A database and storage that answer from `data` and note every removal. */
function fake(data: {
  uploads?: { storage_bucket: string; storage_path: string }[];
  folder?: Record<string, { name: string; id: string | null }[]>;
  intakes?: { id: string; portrait_path: string | null }[];
  pieces?: { photo_path: string }[];
  members?: { user_id: string }[];
  otherSites?: Record<string, number>;
  fail?: string;
}) {
  const removed: { bucket: string; paths: string[] }[] = [];
  const deleted: string[] = [];
  const users: string[] = [];
  const answer = (v: unknown) => Promise.resolve(v);
  const table = (name: string) => {
    const rows: Record<string, unknown> = {
      uploads: data.uploads ?? [],
      intakes: data.intakes ?? [],
      intake_pieces: data.pieces ?? [],
      tenant_members: data.members ?? [],
    };
    let userFilter: string | null = null;
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (col: string, v: string) => {
        if (col === 'user_id') userFilter = v;
        return chain;
      },
      neq: () => chain,
      in: () => chain,
      then: (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => {
        if (name === 'tenant_members' && userFilter !== null)
          return answer({
            data: null,
            count: data.otherSites?.[userFilter] ?? 0,
            error: null,
          }).then(ok, bad);
        return answer({ data: rows[name] ?? [], error: null }).then(ok, bad);
      },
      delete: () => ({
        eq: () => {
          deleted.push(name);
          return answer({ error: data.fail === name ? { message: 'down' } : null });
        },
      }),
    };
    return chain;
  };
  const db = {
    from: table,
    storage: {
      from: (bucket: string) => ({
        list: async (folder: string) => ({
          data: data.folder?.[`${bucket}:${folder}`] ?? [],
          error: null,
        }),
        remove: async (paths: string[]) => {
          removed.push({ bucket, paths });
          return { error: data.fail === 'storage' ? { message: 'down' } : null };
        },
      }),
    },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          users.push(id);
          return { error: null };
        },
      },
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, removed, deleted, users };
}

describe('removeAccount (Alex, 2026-11-16: close my account)', () => {
  it('deletes every file, the site form, the site with all it holds, and the login', async () => {
    const f = fake({
      uploads: [{ storage_bucket: 'tenant-media', storage_path: 'tenant/t1/files/a.webp' }],
      folder: {
        'tenant-media:tenant/t1': [
          { name: 'site', id: null },
          { name: 'stray.webp', id: 'x' },
        ],
        'tenant-media:tenant/t1/site': [{ name: 'b.webp', id: 'y' }],
      },
      intakes: [{ id: 'i1', portrait_path: 'intake/u1/me.webp' }],
      pieces: [{ photo_path: 'intake/u1/p1.webp' }],
      members: [{ user_id: 'u1' }],
    });
    expect(await removeAccount(f.db, 't1')).toEqual({ ok: true });
    const files = f.removed.flatMap((r) => r.paths.map((p) => `${r.bucket}:${p}`)).sort();
    expect(files).toEqual([
      'intake-photos:intake/u1/me.webp',
      'intake-photos:intake/u1/p1.webp',
      'tenant-media:tenant/t1/files/a.webp',
      'tenant-media:tenant/t1/site/b.webp',
      'tenant-media:tenant/t1/stray.webp',
    ]);
    // The site form, the build records, then the site itself (everything else goes with it).
    expect(f.deleted).toEqual(['intakes', 'builds', 'tenants']);
    expect(f.users).toEqual(['u1']);
  });
  it('keeps a login that runs another site, and never Alex’s', async () => {
    const f = fake({
      members: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'alex' }],
      otherSites: { u2: 1 },
    });
    await removeAccount(f.db, 't1');
    expect(f.users).toEqual(['u1']);
  });
  it('stops before the site is removed if its files can’t be, so nothing is left without its site', async () => {
    const f = fake({
      uploads: [{ storage_bucket: 'tenant-media', storage_path: 'tenant/t1/a.webp' }],
      fail: 'storage',
    });
    expect(await removeAccount(f.db, 't1')).toEqual({ ok: false, error: 'files: down' });
    expect(f.deleted).toEqual([]);
    expect(f.users).toEqual([]);
  });
  it('says which step failed', async () => {
    expect(await removeAccount(fake({ fail: 'tenants' }).db, 't1')).toEqual({
      ok: false,
      error: 'site: down',
    });
  });
});

describe('nameMatches', () => {
  it('takes the site’s name typed any case, with spaces around it', () => {
    expect(nameMatches('  lena hart DECOUPAGE ', 'Lena Hart Decoupage')).toBe(true);
    expect(nameMatches('Lena', 'Lena Hart Decoupage')).toBe(false);
    expect(nameMatches(7, 'Lena Hart Decoupage')).toBe(false);
  });
});
