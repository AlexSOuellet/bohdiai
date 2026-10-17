import { describe, it, expect } from 'vitest';
import { getSiteScene, saveSiteScene } from './queries';

type Result = { data: unknown; error: { message: string } | null };

/** A stand-in client: reads end at maybeSingle(); saves record what was upserted. */
function fakeDb(read: Result, write: { error: { message: string } | null } = { error: null }) {
  const saved: unknown[] = [];
  const db = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => read }) }),
      upsert: async (row: unknown) => {
        saved.push(row);
        return write;
      },
    }),
  } as unknown as Parameters<typeof getSiteScene>[0];
  return { db, saved };
}

describe('getSiteScene', () => {
  it('a library scene paints the library photo at its focus', async () => {
    const { db } = fakeDb({ data: { scene_key: 'marsh', upload: null }, error: null });
    expect(await getSiteScene(db, 't1')).toEqual({ url: '/scenes/marsh.webp', focus: 'center 62%' });
  });
  it('the maker’s own photo paints from its upload', async () => {
    const { db } = fakeDb({ data: { scene_key: null, upload: { public_url: 'https://cdn/bay.webp' } }, error: null });
    expect(await getSiteScene(db, 't1')).toEqual({ url: 'https://cdn/bay.webp', focus: 'center' });
  });
  it('a site with no row (any family but Scenic) has none', async () => {
    const { db } = fakeDb({ data: null, error: null });
    expect(await getSiteScene(db, 't1')).toBeNull();
  });
  it('says so when the read fails', async () => {
    const { db } = fakeDb({ data: null, error: { message: 'down' } });
    await expect(getSiteScene(db, 't1')).rejects.toThrow('Could not load the background photo: down');
  });
});

describe('saveSiteScene', () => {
  it('saves a library scene or an upload, never both', async () => {
    const { db, saved } = fakeDb({ data: null, error: null });
    await saveSiteScene(db, 't1', { kind: 'library', key: 'marsh' });
    await saveSiteScene(db, 't1', { kind: 'own', uploadId: 'u1' });
    expect(saved).toEqual([
      { tenant_id: 't1', scene_key: 'marsh', upload_id: null },
      { tenant_id: 't1', scene_key: null, upload_id: 'u1' },
    ]);
  });
  it('refuses a scene that isn’t in the library, and says when the save fails', async () => {
    const { db } = fakeDb({ data: null, error: null });
    await expect(saveSiteScene(db, 't1', { kind: 'library', key: 'moon' })).rejects.toThrow('No scene called "moon" in the library');
    const failing = fakeDb({ data: null, error: null }, { error: { message: 'nope' } });
    await expect(saveSiteScene(failing.db, 't1', { kind: 'library', key: 'marsh' })).rejects.toThrow('Could not save the background photo: nope');
  });
});
