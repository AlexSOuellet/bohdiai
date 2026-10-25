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

const s = vi.hoisted(() => ({ queue: [] as unknown[], calls: [] as string[], features: new Set<string>(['try_on']) }));
const revalidatePath = vi.hoisted(() => vi.fn());
const fakeDb = () => ({
  from: (t: string) => {
    s.calls.push(`from(${t})`);
    return chain(() => s.queue.shift() ?? { data: null, error: null }, s.calls);
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => s.features }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => fakeDb() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath }));

const { canWear, currentLook, keepLook, lookFor } = await import('./looks');
const { keepThisLook } = await import('./actions');

const page = (root: unknown) => ({ data: { id: 'p1', layout_tree: { root, other: 1 } }, error: null });
const rustic = { kind: 'archetype', archetypeKey: 'main-street', mood: 'rustic', lookKey: 'main-street-tannery', content: {} };
const db = () => fakeDb() as never;

beforeEach(() => {
  s.queue = [];
  s.calls = [];
  s.features = new Set(['try_on']);
  revalidatePath.mockReset();
});

describe('the looks', () => {
  it('finds a mood’s look, in its family’s own skin', () => {
    expect(lookFor('rustic')).toMatchObject({ mood: 'rustic', skin: 'main-street-tannery' });
    expect(lookFor('elegant')?.family).toBe('luxury');
    expect(lookFor('nope')).toBeNull();
  });
  it('wears Scenic only with her own photo behind the page', () => {
    expect(canWear({ mood: 'scenic' }, { hasScene: false })).toBe(false);
    expect(canWear({ mood: 'scenic' }, { hasScene: true })).toBe(true);
    expect(canWear({ mood: 'cozy' }, { hasScene: false })).toBe(true);
  });
});

describe('currentLook', () => {
  it('reads her mood, her look and whether she has a background photo', async () => {
    s.queue.push(page(rustic), { data: { tenant_id: 't1' }, error: null });
    expect(await currentLook(db(), 't1')).toEqual({ mood: 'rustic', skin: 'main-street-tannery', hasScene: true });
    s.queue.push(page({ archetypeKey: 'main-street' }), { data: null, error: null });
    expect(await currentLook(db(), 't1')).toEqual({ mood: null, skin: null, hasScene: false });
  });
  it('is null for a custom design or no page', async () => {
    s.queue.push(page({ archetypeKey: 'boutique' }));
    expect(await currentLook(db(), 't1')).toBeNull();
    s.queue.push({ data: null, error: null });
    expect(await currentLook(db(), 't1')).toBeNull();
    s.queue.push({ data: { id: 'p1', layout_tree: null }, error: null });
    expect(await currentLook(db(), 't1')).toBeNull();
  });
  it('fails loudly when it can’t read', async () => {
    s.queue.push({ data: null, error: { message: 'down' } });
    await expect(currentLook(db(), 't1')).rejects.toThrow('look');
    s.queue.push(page(rustic), { data: null, error: { message: 'down' } });
    await expect(currentLook(db(), 't1')).rejects.toThrow('background photo');
  });
});

describe('keepLook', () => {
  it('changes only the page record’s mood and look', async () => {
    s.queue.push(page(rustic), { data: null, error: null });
    await keepLook(db(), 't1', 'cozy', 'main-street-ember');
    const update = s.calls.find((c) => c.startsWith('update('));
    expect(JSON.parse(update?.slice(7, -1) ?? '{}')).toEqual({ layout_tree: { root: { ...rustic, mood: 'cozy', lookKey: 'main-street-ember' }, other: 1 } });
  });
  it('refuses a custom design, and fails loudly when it can’t save', async () => {
    s.queue.push(page({ archetypeKey: 'boutique' }));
    await expect(keepLook(db(), 't1', 'cozy', 'x')).rejects.toThrow('Not a standard site');
    s.queue.push(page(rustic), { data: null, error: { message: 'trigger said no' } });
    await expect(keepLook(db(), 't1', 'cozy', 'x')).rejects.toThrow('keep the look');
  });
});

describe('keepThisLook', () => {
  it('keeps a look she can wear', async () => {
    s.queue.push(page(rustic), { data: null, error: null }, page(rustic), { data: null, error: null });
    expect(await keepThisLook('cozy')).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/looks');
  });
  it('refuses without the plan, an unknown mood, a custom design, or Scenic without her photo', async () => {
    s.features = new Set();
    expect((await keepThisLook('cozy')).ok).toBe(false);
    s.features = new Set(['try_on']);
    expect(await keepThisLook('nope')).toEqual({ ok: false, error: 'That isn’t one of the looks.' });
    s.queue.push(page({ archetypeKey: 'boutique' }));
    expect((await keepThisLook('cozy')).ok).toBe(false);
    s.queue.push(page(rustic), { data: null, error: null });
    expect(await keepThisLook('scenic')).toMatchObject({ ok: false, error: expect.stringContaining('Scenic shows your own photo') });
  });
  it('says so when it can’t be kept', async () => {
    s.queue.push({ data: null, error: { message: 'down' } });
    expect(await keepThisLook('cozy')).toEqual({ ok: false, error: 'The look couldn’t be kept. Try again in a moment.' });
  });
});
