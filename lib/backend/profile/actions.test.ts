import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_PROFILE } from './profile-form';

const features = vi.hoisted(() => ({ on: new Set<string>(['profile']) }));
const upsert = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const insert = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
const storeSitePhoto = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => ({
      upsert: (row: unknown) => upsert(row, table),
      insert: (rows: unknown) => insert(rows, table),
      delete: () => ({ eq: async () => remove(table) }),
      update: (patch: unknown) => ({ eq: async (_c: string, id: string) => update(patch, id, table) }),
    }),
  }),
}));
vi.mock('@/lib/backend/site-photo', () => ({ storeSitePhoto }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveAbout, saveMarquee, saveContact, saveSocials, uploadPortrait, removePortrait } from './actions';
import { profileHomeData } from './home';

beforeEach(() => {
  features.on = new Set(['profile']);
  upsert.mockReset().mockResolvedValue({ error: null });
  update.mockReset().mockResolvedValue({ error: null });
  insert.mockReset().mockResolvedValue({ error: null });
  remove.mockReset().mockResolvedValue({ error: null });
  storeSitePhoto.mockReset().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://cdn/me.webp' });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

const about = { aboutTitle: '', bio: '', quote: '', quoteAttribution: '' };

describe('saveAbout', () => {
  it('saves the story and quote to About you, and the heading to the section words', async () => {
    expect(await saveAbout({ ...about, aboutTitle: ' Meet  June ', bio: 'Every board.', quote: 'Q', quoteAttribution: 'June' })).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', bio: 'Every board.', quote: 'Q', quote_attribution: 'June' }, 'site_profiles');
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', section: 'about', title: 'Meet June' }, 'site_sections');
    expect(revalidatePath).toHaveBeenCalledWith('/manage/profile');
  });
  it('never touches the headline, the scrolling line, contact information or socials', async () => {
    await saveAbout(about);
    for (const [row] of upsert.mock.calls) expect(Object.keys(row as object)).not.toEqual(expect.arrayContaining(['headline']));
    expect(upsert.mock.calls.map((c) => c[1])).toEqual(['site_profiles', 'site_sections']);
  });
  it('refuses when About you is switched off', async () => {
    features.on = new Set();
    expect(await saveAbout(about)).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('returns the validation message without saving', async () => {
    expect(await saveAbout({ ...about, quoteAttribution: 'June' })).toEqual({ ok: false, error: 'Add the quote, or clear who it’s from.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('names a permission failure and logs any other failure', async () => {
    upsert.mockResolvedValueOnce({ error: { code: '42501', message: 'rls' } });
    expect(await saveAbout(about)).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    upsert.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await saveAbout(about)).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('profile: about save failed', expect.objectContaining({ error: 'boom' }));
  });
});

describe('saveMarquee', () => {
  it('saves the phrases to the scrolling line’s own home, and none clears it', async () => {
    expect(await saveMarquee([' Small  batch ', 'Poured by hand'])).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', phrases: ['Small batch', 'Poured by hand'] }, 'site_marquees');
    expect(await saveMarquee([])).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith('site_marquees');
  });
  it('refuses too many phrases', async () => {
    expect((await saveMarquee(Array.from({ length: 13 }, (_, i) => `p${i}`))).ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('saveContact', () => {
  it('saves the phone to contact information and the email to the site', async () => {
    expect(await saveContact({ phone: '(401) 555-0100', email: ' lena@example.com ' })).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', phone: '(401) 555-0100' }, 'site_contacts');
    expect(update).toHaveBeenCalledWith({ contact_email: 'lena@example.com' }, 't1', 'tenants');
  });
  it('refuses a bad phone or email', async () => {
    expect((await saveContact({ phone: 'call me', email: '' })).ok).toBe(false);
    expect(await saveContact({ phone: '', email: 'nope' })).toEqual({ ok: false, error: 'That email address doesn’t look right. Use one like you@example.com.' });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('saveSocials', () => {
  it('replaces the accounts with full links, in order', async () => {
    expect(await saveSocials({ facebookUrl: 'facebook.com/june', instagramUrl: '@june' })).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith('site_socials');
    expect(insert).toHaveBeenCalledWith(
      [
        { tenant_id: 't1', network: 'facebook', url: 'https://facebook.com/june', position: 0 },
        { tenant_id: 't1', network: 'instagram', url: 'https://www.instagram.com/june', position: 1 },
      ],
      'site_socials',
    );
  });
  it('refuses a link to another site', async () => {
    expect((await saveSocials({ facebookUrl: 'https://evil.com/x', instagramUrl: '' })).ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('profileHomeData', () => {
  it('asks for a headline and a story until both are there', () => {
    expect(profileHomeData(EMPTY_PROFILE).attention).toEqual(['Your page has no story yet. Add a few lines in About you.']);
    expect(profileHomeData({ ...EMPTY_PROFILE, bio: 'y' })).toEqual({ tiles: [], attention: [] });
  });
});

const photo = (): FormData => {
  const f = new FormData();
  f.set('file', new File(['x'], 'me.jpg', { type: 'image/jpeg' }));
  return f;
};

describe('uploadPortrait', () => {
  it('stores the photo and links it from About you', async () => {
    expect(await uploadPortrait(photo())).toEqual({ ok: true, url: 'https://cdn/me.webp' });
    expect(storeSitePhoto).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', userId: 'u1', folder: 'portrait' }));
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', portrait_upload_id: 'up1' }, 'site_profiles');
  });
  it('refuses when About you is switched off, before storing anything', async () => {
    features.on = new Set();
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(storeSitePhoto).not.toHaveBeenCalled();
  });
  it('passes on a photo the store refused', async () => {
    storeSitePhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('says so when the photo stored but the link failed', async () => {
    upsert.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'The photo was uploaded but couldn’t be set as your portrait. Try again.' });
    expect(logger.error).toHaveBeenCalledWith('profile: portrait link failed', expect.objectContaining({ error: 'boom' }));
  });
});

describe('removePortrait', () => {
  it('clears the link for the acting site', async () => {
    expect(await removePortrait()).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ portrait_upload_id: null }, 't1', 'site_profiles');
  });
  it('refuses when About you is switched off', async () => {
    features.on = new Set();
    expect(await removePortrait()).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(update).not.toHaveBeenCalled();
  });
  it('says so when the remove failed', async () => {
    update.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await removePortrait()).toEqual({ ok: false, error: 'The portrait couldn’t be removed. Try again in a moment.' });
  });
});
