import { describe, it, expect } from 'vitest';
import { EMPTY_MOMENT } from './moment-form';
import { getMoment } from './queries';
import { getPortraitUrl } from '../profile/queries';

type Result = { data: unknown; error: { message: string } | null };

/** A stand-in client: site_moments ends at maybeSingle(), site_moment_photos after two orders. */
function fakeDb(moment: Result, photos: Result) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'site_moments'
            ? { maybeSingle: async () => moment }
            : { order: () => ({ order: async () => photos }) },
      }),
    }),
  } as unknown as Parameters<typeof getMoment>[0];
}

const row = {
  story: ['The wick'], cta_label: 'Shop', cta_target: 'shop',
  second_cta_label: null, second_cta_target: null, play_mode: 'always',
  media: { public_url: 'https://cdn/m.webp', mime_type: 'image/webp', alt_text: 'Candles' }, poster: null,
};

describe('getMoment', () => {
  it('reads the words, the media and the photos with an address', async () => {
    const photos = [
      { id: 'p1', uploads: { public_url: 'https://cdn/1.webp', alt_text: 'One' } },
      { id: 'p2', uploads: { public_url: null, alt_text: null } },
      { id: 'p3', uploads: { public_url: 'https://cdn/3.webp', alt_text: null } },
    ];
    const m = await getMoment(fakeDb({ data: row, error: null }, { data: photos, error: null }), 't1');
    expect(m).toMatchObject({ story: ['The wick'], ctaTarget: 'shop', playMode: 'always' });
    expect(m.media).toEqual({ kind: 'image', url: 'https://cdn/m.webp', alt: 'Candles', posterUrl: '' });
    expect(m.photos).toEqual([{ id: 'p1', url: 'https://cdn/1.webp', alt: 'One' }, { id: 'p3', url: 'https://cdn/3.webp', alt: '' }]);
  });
  it('is empty when the site has no moment yet', async () => {
    expect(await getMoment(fakeDb({ data: null, error: null }, { data: null, error: null }), 't1')).toEqual({ ...EMPTY_MOMENT, media: null, photos: [] });
  });
  it('throws a plain error when either read fails', async () => {
    await expect(getMoment(fakeDb({ data: null, error: { message: 'down' } }, { data: [], error: null }), 't1')).rejects.toThrow('Could not load the moment: down');
    await expect(getMoment(fakeDb({ data: null, error: null }, { data: null, error: { message: 'gone' } }), 't1')).rejects.toThrow('Could not load the moment’s photos: gone');
  });
});

describe('getPortraitUrl', () => {
  const portraitDb = (r: Result) =>
    ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => r }) }) }) }) as unknown as Parameters<typeof getPortraitUrl>[0];
  it('gives the portrait’s address, or null without one', async () => {
    expect(await getPortraitUrl(portraitDb({ data: { uploads: { public_url: 'https://cdn/me.webp' } }, error: null }), 't1')).toBe('https://cdn/me.webp');
    expect(await getPortraitUrl(portraitDb({ data: { uploads: null }, error: null }), 't1')).toBeNull();
    expect(await getPortraitUrl(portraitDb({ data: null, error: null }), 't1')).toBeNull();
  });
  it('throws a plain error when the read fails', async () => {
    await expect(getPortraitUrl(portraitDb({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('Could not load the portrait: down');
  });
});
