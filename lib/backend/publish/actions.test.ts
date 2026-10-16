import { describe, it, expect, vi, beforeEach } from 'vitest';

const state: { updateError: { code?: string; message: string } | null; updated: { id: string }[]; nowStatus: string | null } = { updateError: null, updated: [{ id: 't1' }], nowStatus: 'active' };
const calls: { update: unknown[]; eqs: [string, string][] } = { update: [], eqs: [] };
const revalidatePath = vi.fn();
const logError = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: () => Promise.resolve({ site: { tenantId: 't1', subdomain: 'tide' } }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a) } }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: () => ({
        update: (arg: unknown) => {
          calls.update.push(arg);
          const chain = {
            eq: (col: string, val: string) => {
              calls.eqs.push([col, val]);
              return chain;
            },
            select: () => Promise.resolve({ data: state.updateError === null ? state.updated : null, error: state.updateError }),
          };
          return chain;
        },
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: state.nowStatus === null ? null : { status: state.nowStatus } }) }) }),
      }),
    }),
}));

import { publishSite } from './actions';

describe('publishSite', () => {
  beforeEach(() => {
    state.updateError = null;
    state.updated = [{ id: 't1' }];
    state.nowStatus = 'active';
    calls.update = [];
    calls.eqs = [];
    revalidatePath.mockReset();
    logError.mockReset();
  });

  it('puts the acting site live, only when it is a draft', async () => {
    expect(await publishSite()).toEqual({ ok: true });
    expect(calls.update).toEqual([{ status: 'active' }]);
    expect(calls.eqs).toEqual([
      ['id', 't1'],
      ['status', 'draft'],
    ]);
    expect(revalidatePath).toHaveBeenCalledWith('/manage');
  });

  it('a site that is already live stays live and says so', async () => {
    state.updated = [];
    expect(await publishSite()).toEqual({ ok: true });
  });

  it('nothing changed and not live is a failure, not a silent yes', async () => {
    state.updated = [];
    state.nowStatus = null;
    expect(await publishSite()).toEqual({ ok: false, error: 'Your site couldn’t be published. Try again in a moment.' });
  });

  it('no access and a failed write each say so', async () => {
    state.updateError = { code: '42501', message: 'denied' };
    expect(await publishSite()).toEqual({ ok: false, error: 'You don’t have access to publish this site.' });
    state.updateError = { message: 'down' };
    expect(await publishSite()).toEqual({ ok: false, error: 'Your site couldn’t be published. Try again in a moment.' });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
