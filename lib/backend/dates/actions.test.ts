import { describe, it, expect, vi, beforeEach } from 'vitest';

const features = vi.hoisted(() => ({ on: new Set<string>(['market_dates']) }));
const db = vi.hoisted(() => ({
  existing: [] as { id: string }[],
  readError: null as { message: string } | null,
  insert: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

/** A tiny chainable stand-in for the events table. */
function table() {
  return {
    select: () => ({ eq: async () => ({ data: db.readError === null ? db.existing : null, error: db.readError }) }),
    insert: (row: unknown) => ({ select: () => ({ single: async () => db.insert(row) }) }),
    update: (patch: unknown) => ({ eq: () => ({ eq: async (_c: string, id: string) => db.update(id, patch) }) }),
    delete: () => ({ eq: () => ({ eq: async (_c: string, id: string) => db.del(id) }) }),
  };
}

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ from: () => table() }) }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { addMarketDate, updateMarketDate, removeMarketDate } from './actions';

const form = { date: '2026-10-11', endDate: '', name: 'Wickford Art Festival', town: 'Wickford' };

beforeEach(() => {
  features.on = new Set(['market_dates']);
  db.existing = [];
  db.readError = null;
  db.insert.mockReset().mockResolvedValue({ data: { id: 'd9' }, error: null });
  db.update.mockReset().mockResolvedValue({ error: null });
  db.del.mockReset().mockResolvedValue({ error: null });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('addMarketDate', () => {
  it('adds the date for the acting site and hands it back', async () => {
    expect(await addMarketDate(form)).toEqual({ ok: true, item: { id: 'd9', date: '2026-10-11', endDate: '', name: 'Wickford Art Festival', town: 'Wickford' } });
    expect(db.insert).toHaveBeenCalledWith({ tenant_id: 't1', event_date: '2026-10-11', end_date: null, name: 'Wickford Art Festival', location: 'Wickford' });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/dates');
  });

  it('checks the date before writing anything', async () => {
    expect(await addMarketDate({ ...form, date: '' })).toEqual({ ok: false, error: 'Pick the day of the market.' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('refuses a twenty-first date', async () => {
    db.existing = Array.from({ length: 20 }, (_, i) => ({ id: `d${i}` }));
    expect(await addMarketDate(form)).toEqual({ ok: false, error: 'You can list up to 20 dates. Remove a past one to add another.' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('refuses when dates are switched off, can’t be counted, or the write fails', async () => {
    features.on = new Set();
    expect(await addMarketDate(form)).toEqual({ ok: false, error: 'Market dates aren’t switched on for this site.' });
    features.on = new Set(['market_dates']);
    db.readError = { message: 'down' };
    expect(await addMarketDate(form)).toEqual({ ok: false, error: 'Your dates couldn’t be checked. Try again in a moment.' });
    db.readError = null;
    db.insert.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    expect(await addMarketDate(form)).toEqual({ ok: false, error: 'The date couldn’t be added. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('updateMarketDate', () => {
  it('writes the checked date and reports a failed write in plain words', async () => {
    expect(await updateMarketDate('d1', { ...form, town: '' })).toEqual({ ok: true, item: { id: 'd1', date: '2026-10-11', endDate: '', name: 'Wickford Art Festival', town: '' } });
    expect(db.update).toHaveBeenCalledWith('d1', { event_date: '2026-10-11', end_date: null, name: 'Wickford Art Festival', location: null });
    db.update.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await updateMarketDate('d1', form)).toEqual({ ok: false, error: 'The date couldn’t be saved. Try again in a moment.' });
  });
});

describe('removeMarketDate', () => {
  it('removes the date and reports failure in plain words', async () => {
    expect(await removeMarketDate('d1')).toEqual({ ok: true });
    expect(db.del).toHaveBeenCalledWith('d1');
    db.del.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await removeMarketDate('d1')).toEqual({ ok: false, error: 'The date couldn’t be removed. Try again in a moment.' });
  });
});
