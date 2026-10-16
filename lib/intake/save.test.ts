import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { saveIntake, INTAKE_BUCKET } from './save';
import type { IntakeFields, IntakePiece } from './request';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

type Err = { message: string } | null;
type Fail = { upload?: number; intake?: Err; pieces?: Err; remove?: Err; deleteIntake?: Err };

function fakeDb(fail: Fail = {}) {
  const calls = { uploads: [] as string[], inserts: [] as { table: string; row: unknown }[], deletes: [] as string[], removed: [] as string[][], bucket: '' };
  let uploads = 0;
  const db = {
    storage: {
      from: (bucket: string) => {
        calls.bucket = bucket;
        return {
          upload: (path: string) => {
            uploads += 1;
            if (fail.upload === uploads) return Promise.resolve({ error: { message: 'storage down' } });
            calls.uploads.push(path);
            return Promise.resolve({ error: null });
          },
          remove: (paths: string[]) => {
            calls.removed.push(paths);
            return Promise.resolve({ error: fail.remove ?? null });
          },
        };
      },
    },
    from: (table: string) => ({
      insert: (row: unknown) => {
        calls.inserts.push({ table, row });
        return Promise.resolve({ error: (table === 'intakes' ? fail.intake : fail.pieces) ?? null });
      },
      delete: () => ({
        eq: (_col: string, id: string) => {
          calls.deletes.push(id);
          return Promise.resolve({ error: fail.deleteIntake ?? null });
        },
      }),
    }),
  };
  return { db: db as unknown as SupabaseClient<Database>, calls };
}

const fields: IntakeFields = { plan: 'lite', billing: 'yearly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'l@example.com', makes: 'Lace', about: 'Porch', family: null };
const file = (): File => new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
const pieces: IntakePiece[] = [
  { name: 'One', priceCents: 100, description: null, photo: file() },
  { name: 'Two', priceCents: null, description: 'Blue', photo: file() },
];
const shrink = vi.fn(() => Promise.resolve(new Uint8Array([1, 2])));

describe('saveIntake', () => {
  beforeEach(() => shrink.mockClear());

  it('stores every photo privately, then the intake and its pieces', async () => {
    const { db, calls } = fakeDb();
    const out = await saveIntake({ db, shrink, fields, pieces, portrait: file(), userId: 'u1', id: 'i1' });
    expect(out).toEqual({ ok: true, id: 'i1' });
    expect(calls.bucket).toBe(INTAKE_BUCKET);
    expect(calls.uploads).toEqual(['i1/piece-1.webp', 'i1/piece-2.webp', 'i1/portrait.webp']);
    expect(shrink).toHaveBeenCalledWith(expect.any(ArrayBuffer), { maxEdge: 2400, format: 'webp', quality: 82 });
    expect(calls.inserts[0]).toEqual({
      table: 'intakes',
      row: { id: 'i1', user_id: 'u1', plan: 'lite', billing: 'yearly', maker_name: 'Lena', business_name: 'Saltmarsh', email: 'l@example.com', makes: 'Lace', about: 'Porch', family: null, portrait_path: 'i1/portrait.webp' },
    });
    expect(calls.inserts[1]).toEqual({
      table: 'intake_pieces',
      row: [
        { intake_id: 'i1', position: 0, name: 'One', price_cents: 100, description: null, photo_path: 'i1/piece-1.webp' },
        { intake_id: 'i1', position: 1, name: 'Two', price_cents: null, description: 'Blue', photo_path: 'i1/piece-2.webp' },
      ],
    });
  });

  it('makes its own id, and no portrait means no portrait path', async () => {
    const { db, calls } = fakeDb();
    const out = await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1' });
    expect(out.ok).toBe(true);
    expect(calls.uploads).toHaveLength(2);
    expect((calls.inserts[0]?.row as { portrait_path: unknown }).portrait_path).toBeNull();
  });

  it('an unreadable photo stops it before anything is stored', async () => {
    const { db, calls } = fakeDb();
    shrink.mockImplementationOnce(() => Promise.reject(new Error('bad bytes')));
    expect(await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1', id: 'i1' })).toEqual({ ok: false, reason: 'photoUnread' });
    expect(calls.uploads).toEqual([]);
    expect(calls.inserts).toEqual([]);
  });

  it('a failed upload removes the photos already stored', async () => {
    const { db, calls } = fakeDb({ upload: 2 });
    expect(await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1', id: 'i1' })).toEqual({ ok: false, reason: 'failed' });
    expect(calls.removed).toEqual([['i1/piece-1.webp']]);
    expect(calls.inserts).toEqual([]);
  });

  it('a failed first upload has nothing to remove', async () => {
    const { db, calls } = fakeDb({ upload: 1 });
    expect(await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1', id: 'i1' })).toEqual({ ok: false, reason: 'failed' });
    expect(calls.removed).toEqual([]);
  });

  it('a failed intake save removes the photos', async () => {
    const { db, calls } = fakeDb({ intake: { message: 'nope' } });
    expect(await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1', id: 'i1' })).toEqual({ ok: false, reason: 'failed' });
    expect(calls.removed).toEqual([['i1/piece-1.webp', 'i1/piece-2.webp']]);
    expect(calls.deletes).toEqual(['i1']);
  });

  it('a failed pieces save removes the intake and the photos, even if cleaning up fails too', async () => {
    const { db, calls } = fakeDb({ pieces: { message: 'nope' }, remove: { message: 'x' }, deleteIntake: { message: 'y' } });
    expect(await saveIntake({ db, shrink, fields, pieces, portrait: null, userId: 'u1', id: 'i1' })).toEqual({ ok: false, reason: 'failed' });
    expect(calls.deletes).toEqual(['i1']);
    expect(calls.removed).toHaveLength(1);
  });
});
