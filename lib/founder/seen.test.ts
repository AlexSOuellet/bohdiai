import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { markSeen, newCounts } from './seen';

/** A database where each list has `rows` (with when they came in), and `seen` per tab. */
function fake(seen: { tab: string; seen_at: string }[], rows: Record<string, string[]>) {
  const upserts: unknown[] = [];
  const db = {
    from: (table: string) => {
      if (table === 'founder_seen')
        return {
          select: async () => ({ data: seen, error: null }),
          upsert: async (row: unknown) => {
            upserts.push(row);
            return { error: null };
          },
        };
      let since: string | null = null;
      const q = {
        select: () => q,
        gt: (_c: string, v: string) => {
          since = v;
          return q;
        },
        then: (ok: (v: unknown) => unknown) =>
          Promise.resolve({
            count: (rows[table] ?? []).filter((at) => since === null || at > since).length,
            error: null,
          }).then(ok),
      };
      return q;
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, upserts };
}

describe('new-item counts (Alex, 2026-11-16)', () => {
  it('counts what came in since each tab was last opened, and everything for a tab never opened', async () => {
    const { db } = fake([{ tab: 'messages', seen_at: '2026-11-16T10:00:00Z' }], {
      support_messages: ['2026-11-16T09:00:00Z', '2026-11-16T11:00:00Z'],
      site_reports: ['2026-11-16T08:00:00Z'],
      tool_feedback: [],
    });
    expect(await newCounts(db)).toEqual({ messages: 1, reports: 1, feedback: 0 });
  });
  it('opening a tab marks it seen now', async () => {
    const { db, upserts } = fake([], {});
    await markSeen(db, 'reports');
    expect(upserts).toEqual([{ tab: 'reports', seen_at: expect.any(String) }]);
  });
});

describe('when the database fails', () => {
  it('says which part couldn’t be read or saved', async () => {
    const broken = {
      from: (table: string) =>
        table === 'founder_seen'
          ? {
              select: async () => ({ data: null, error: { message: 'down' } }),
              upsert: async () => ({ error: { message: 'down' } }),
            }
          : {},
    } as unknown as SupabaseClient<Database>;
    await expect(newCounts(broken)).rejects.toThrow('Could not read what’s been seen: down');
    await expect(markSeen(broken, 'reports')).rejects.toThrow('Could not mark reports seen: down');
    const countFails = {
      from: (table: string) => {
        if (table === 'founder_seen') return { select: async () => ({ data: [], error: null }) };
        const q = {
          select: () => q,
          then: (ok: (v: unknown) => unknown) =>
            Promise.resolve({ count: null, error: { message: 'gone' } }).then(ok),
        };
        return q;
      },
    } as unknown as SupabaseClient<Database>;
    await expect(newCounts(countFails)).rejects.toThrow(/Could not count the/);
  });
});
