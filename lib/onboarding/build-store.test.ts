import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the supabase calls so we can assert what gets written.
const calls: { table: string; op: string; payload?: unknown; eqId?: unknown }[] = [];
const insertSingleMock = vi.fn();
const updateResultMock = vi.fn();
const selectSingleMock = vi.fn();

function makeAdmin() {
  return {
    from(table: string) {
      return {
        insert(row: unknown) {
          calls.push({ table, op: 'insert', payload: row });
          return { select: () => ({ single: insertSingleMock }) };
        },
        update(patch: unknown) {
          calls.push({ table, op: 'update', payload: patch });
          return {
            eq(_col: string, id: unknown) {
              calls.push({ table, op: 'update.eq', eqId: id });
              return updateResultMock();
            },
          };
        },
        select() {
          return {
            eq(_col: string, id: unknown) {
              calls.push({ table, op: 'select.eq', eqId: id });
              return { single: selectSingleMock };
            },
          };
        },
      };
    },
  };
}

vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => makeAdmin() }));

import { createBuild, markRunning, completeBuild, failBuild, getBuild } from './build-store';

const INPUT = { subdomain: 'ember', shopName: 'Ember', nicheSlug: 'candles', moodKey: 'cozy' };

beforeEach(() => {
  calls.length = 0;
  insertSingleMock.mockReset();
  updateResultMock.mockReset();
  selectSingleMock.mockReset();
  updateResultMock.mockResolvedValue({ error: null });
});

describe('createBuild', () => {
  it('inserts a pending build with the input and subdomain, returns the id', async () => {
    insertSingleMock.mockResolvedValue({ data: { id: 'b-1' }, error: null });
    const id = await createBuild(INPUT);
    expect(id).toBe('b-1');
    const insert = calls.find((c) => c.op === 'insert');
    expect(insert?.payload).toMatchObject({ status: 'pending', subdomain: 'ember', input: INPUT });
  });

  it('throws when the insert fails', async () => {
    insertSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(createBuild(INPUT)).rejects.toThrow();
  });
});

describe('status transitions', () => {
  it('markRunning sets running + label + started_at', async () => {
    await markRunning('b-1', 'Designing the moment');
    const u = calls.find((c) => c.op === 'update');
    expect(u?.payload).toMatchObject({ status: 'running', status_label: 'Designing the moment' });
    expect((u?.payload as { started_at?: string }).started_at).toBeTruthy();
  });

  it('completeBuild sets done, the tenant id, and finished_at', async () => {
    await completeBuild('b-1', 'tenant-9');
    const u = calls.find((c) => c.op === 'update');
    expect(u?.payload).toMatchObject({ status: 'done', tenant_id: 'tenant-9' });
    expect((u?.payload as { finished_at?: string }).finished_at).toBeTruthy();
  });

  it('failBuild sets failed + the error message + finished_at', async () => {
    await failBuild('b-1', 'video generation failed');
    const u = calls.find((c) => c.op === 'update');
    expect(u?.payload).toMatchObject({ status: 'failed', error: 'video generation failed' });
    expect((u?.payload as { finished_at?: string }).finished_at).toBeTruthy();
  });
});

describe('getBuild', () => {
  it('returns the row for an id', async () => {
    selectSingleMock.mockResolvedValue({
      data: { id: 'b-1', status: 'running', status_label: 'x' },
      error: null,
    });
    const row = await getBuild('b-1');
    expect(row?.status).toBe('running');
    expect(calls.find((c) => c.op === 'select.eq')?.eqId).toBe('b-1');
  });

  it('returns null when not found', async () => {
    selectSingleMock.mockResolvedValue({ data: null, error: { message: 'no row' } });
    expect(await getBuild('nope')).toBeNull();
  });
});
