import { describe, it, expect, vi, beforeEach } from 'vitest';

function chain(next: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(next()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const s = vi.hoisted(() => ({ queue: [] as unknown[], calls: [] as string[], features: new Set<string>(['background']), stored: null as unknown, sceneFails: false }));
const revalidatePath = vi.hoisted(() => vi.fn());
const fakeDb = () => ({
  from: (t: string) => {
    s.calls.push(`from(${t})`);
    return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => s.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('@/lib/backend/site-photo', () => ({ storeSitePhoto: async () => s.stored }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('./queries', () => ({
  saveSiteScene: async (...a: unknown[]) => {
    if (s.sceneFails) throw new Error('down');
    s.calls.push(`saveSiteScene(${JSON.stringify(a.slice(1))})`);
  },
}));

const { getBackgroundView } = await import('./background');
const { setOwnBackground, removeOwnBackground, chooseScene, setOwnScene } = await import('./background-actions');

const fd = (extra: Record<string, string> = {}): FormData => {
  const d = new FormData();
  d.set('file', new File(['x'], 'p.jpg', { type: 'image/jpeg' }));
  for (const [k, v] of Object.entries(extra)) d.set(k, v);
  return d;
};
const fail = { data: null, error: { message: 'down' } };

beforeEach(() => {
  s.queue = [];
  s.calls = [];
  s.features = new Set(['background']);
  s.stored = { ok: true, uploadId: 'u9', url: 'https://cdn/new.webp' };
  s.sceneFails = false;
  revalidatePath.mockReset();
});

describe('getBackgroundView', () => {
  it('reads her own background, Scenic’s scene and the scenes made for her', async () => {
    s.queue.push(
      { data: { upload: { public_url: 'https://cdn/wood.jpg' } }, error: null },
      { data: { scene_key: 'rustic-charm-1', scene: { url: 'https://cdn/s1.webp' }, upload: null }, error: null },
      { data: [{ key: 'rustic-charm-1', url: 'https://cdn/s1.webp', description: 'barn' }], error: null },
    );
    expect(await getBackgroundView(fakeDb() as never, 't1')).toEqual({
      own: 'https://cdn/wood.jpg',
      scenic: { key: 'rustic-charm-1', url: 'https://cdn/s1.webp' },
      scenes: [{ key: 'rustic-charm-1', url: 'https://cdn/s1.webp', description: 'barn' }],
    });
  });
  it('reads her own Scenic photo, and nothing at all', async () => {
    s.queue.push({ data: null, error: null }, { data: { scene_key: null, scene: null, upload: { public_url: 'https://cdn/mine.webp' } }, error: null }, { data: null, error: null });
    expect(await getBackgroundView(fakeDb() as never, 't1')).toEqual({ own: null, scenic: { key: null, url: 'https://cdn/mine.webp' }, scenes: [] });
    s.queue.push({ data: null, error: null }, { data: { scene_key: 'gone', scene: null, upload: null }, error: null }, { data: [], error: null });
    expect((await getBackgroundView(fakeDb() as never, 't1')).scenic).toBeNull();
  });
  it('fails loudly when any part can’t be read', async () => {
    s.queue.push(fail, { data: null, error: null }, { data: [], error: null });
    await expect(getBackgroundView(fakeDb() as never, 't1')).rejects.toThrow('background photo');
    s.queue.push({ data: null, error: null }, fail, { data: [], error: null });
    await expect(getBackgroundView(fakeDb() as never, 't1')).rejects.toThrow('Scenic photo');
    s.queue.push({ data: null, error: null }, { data: null, error: null }, fail);
    await expect(getBackgroundView(fakeDb() as never, 't1')).rejects.toThrow('scenes');
  });
});

describe('her own background', () => {
  it('saves a new photo, and removes it', async () => {
    expect(await setOwnBackground(fd())).toEqual({ ok: true, url: 'https://cdn/new.webp' });
    expect(s.calls.join(' ')).toContain('"upload_id":"u9"');
    expect(await removeOwnBackground()).toEqual({ ok: true });
    expect(s.calls).toContain('delete()');
  });
  it('passes on a refused photo, and says so when saving fails', async () => {
    s.stored = { ok: false, error: 'Use a JPG, PNG or WebP photo.' };
    expect(await setOwnBackground(fd())).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    s.stored = { ok: true, uploadId: 'u9', url: 'u' };
    s.queue.push(fail);
    expect((await setOwnBackground(fd())).ok).toBe(false);
    s.queue.push(fail);
    expect((await removeOwnBackground()).ok).toBe(false);
  });
});

describe('Scenic’s photo', () => {
  it('picks a scene made for her site', async () => {
    s.queue.push({ data: { key: 'rustic-charm-2' }, error: null });
    expect(await chooseScene('rustic-charm-2')).toEqual({ ok: true });
    expect(s.calls.join(' ')).toContain('saveSiteScene(["t1",{"kind":"library","key":"rustic-charm-2"}])');
  });
  it('refuses a scene made for someone else, and says so when it can’t save', async () => {
    s.queue.push({ data: null, error: null });
    expect(await chooseScene('classic-loafs-1')).toEqual({ ok: false, error: 'That scene isn’t one made for your site.' });
    s.queue.push(fail);
    expect((await chooseScene('x')).ok).toBe(false);
    s.sceneFails = true;
    s.queue.push({ data: { key: 'rustic-charm-2' }, error: null });
    expect(await chooseScene('rustic-charm-2')).toEqual({ ok: false, error: 'The scene couldn’t be saved. Try again in a moment.' });
  });
  it('uses her own photo, light or dark', async () => {
    expect(await setOwnScene(fd({ tone: 'dark' }))).toEqual({ ok: true, url: 'https://cdn/new.webp' });
    expect(s.calls.join(' ')).toContain('"kind":"own","uploadId":"u9","tone":"dark"');
    expect((await setOwnScene(fd())).ok).toBe(true);
    expect(s.calls.at(-1)).toContain('"tone":"light"');
    s.stored = { ok: false, error: 'Too big.' };
    expect(await setOwnScene(fd())).toEqual({ ok: false, error: 'Too big.' });
    s.stored = { ok: true, uploadId: 'u9', url: 'u' };
    s.sceneFails = true;
    expect((await setOwnScene(fd())).ok).toBe(false);
  });
});

describe('the switch', () => {
  it('refuses everything when Background is off', async () => {
    s.features = new Set();
    for (const r of [await setOwnBackground(fd()), await removeOwnBackground(), await chooseScene('x'), await setOwnScene(fd())]) expect(r.ok).toBe(false);
  });
});
