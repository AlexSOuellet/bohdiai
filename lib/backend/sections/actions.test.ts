import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_SECTION } from './sections-form';

const upsert = vi.hoisted(() => vi.fn());
const select = vi.hoisted(() => ({ result: { data: [] as unknown[] | null, error: null as { message: string } | null } }));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ from: () => ({ upsert }) }),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveSection } from './actions';
import { getSiteSections } from './queries';

beforeEach(() => {
  upsert.mockReset().mockResolvedValue({ error: null });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('saveSection', () => {
  it('saves the checked row for the acting site', async () => {
    expect(await saveSection('markets', { ...EMPTY_SECTION, title: ' Find me at ' })).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ tenant_id: 't1', section: 'markets', title: 'Find me at', lede: null }));
    expect(revalidatePath).toHaveBeenCalledWith('/manage/sections');
  });
  it('refuses a section no design shares', async () => {
    expect(await saveSection('footer', EMPTY_SECTION)).toEqual({ ok: false, error: 'That section isn’t one this site has.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('returns the validation message without saving', async () => {
    const r = await saveSection('work', { ...EMPTY_SECTION, moreTarget: 'shop' });
    expect(r).toEqual({ ok: false, error: 'Add the link’s words, or clear where it goes.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('names a permission failure and logs any other failure', async () => {
    upsert.mockResolvedValueOnce({ error: { code: '42501', message: 'rls' } });
    expect(await saveSection('work', EMPTY_SECTION)).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    upsert.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await saveSection('work', EMPTY_SECTION)).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('sections: save failed', expect.objectContaining({ error: 'boom', section: 'work' }));
  });
});

describe('getSiteSections', () => {
  const db = () => ({ from: () => ({ select: () => ({ eq: async () => select.result }) }) }) as unknown as Parameters<typeof getSiteSections>[0];

  it('reads the site’s rows into every shared section', async () => {
    select.result = { data: [{ section: 'close', kicker: null, title: 'Come find us', lede: null, more_label: null, more_target: null, empty_text: null, nav_label: null, page_title: null }], error: null };
    const s = await getSiteSections(db(), 't1');
    expect(s.close.title).toBe('Come find us');
    expect(s.work).toEqual(EMPTY_SECTION);
  });
  it('treats no rows as all empty', async () => {
    select.result = { data: null, error: null };
    expect((await getSiteSections(db(), 't1')).about).toEqual(EMPTY_SECTION);
  });
  it('throws a plain error when the read fails', async () => {
    select.result = { data: null, error: { message: 'down' } };
    await expect(getSiteSections(db(), 't1')).rejects.toThrow('Could not load the section words: down');
  });
});
