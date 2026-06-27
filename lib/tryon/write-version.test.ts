import { describe, it, expect, vi, beforeEach } from 'vitest';

let upsertResult: { error: { message: string } | null } = { error: null };
let maybeSingleResult: { data: { envelope: unknown } | null } = { data: null };
const upsert = vi.fn(async () => upsertResult);

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => {
      const chain = {
        upsert,
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => maybeSingleResult,
      };
      return chain;
    },
  }),
}));

import { writeVersion, readVersion, type VersionEnvelope } from './write-version';

const envelope: VersionEnvelope = {
  kind: 'archetype',
  archetypeKey: 'the-find',
  lookKey: 'looka',
  mood: 'cozy',
  catalogSize: 2,
  content: { c: 1 },
  products: [{ p: 1 }],
};

beforeEach(() => {
  upsertResult = { error: null };
  maybeSingleResult = { data: null };
  upsert.mockClear();
});

describe('writeVersion', () => {
  it('upserts the envelope keyed on tenant + label', async () => {
    await writeVersion('t1', 'find', envelope);
    expect(upsert).toHaveBeenCalledWith(
      { tenant_id: 't1', label: 'find', envelope },
      { onConflict: 'tenant_id,label' },
    );
  });

  it('throws when the upsert returns an error', async () => {
    upsertResult = { error: { message: 'duplicate' } };
    await expect(writeVersion('t1', 'find', envelope)).rejects.toThrow(/writeVersion failed: duplicate/);
  });
});

describe('readVersion', () => {
  it('returns the stored envelope when the row exists', async () => {
    maybeSingleResult = { data: { envelope } };
    expect(await readVersion('t1', 'find')).toEqual(envelope);
  });

  it('returns null when there is no matching version', async () => {
    maybeSingleResult = { data: null };
    expect(await readVersion('t1', 'missing')).toBeNull();
  });
});
