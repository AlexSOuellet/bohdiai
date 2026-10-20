import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = {
  features: new Set<string>(['testimonials']),
  rows: [] as { id: string; position: number }[],
  error: null as string | null,
  updated: { id: 't1', quote: 'q', name: 'n', detail: null } as { id: string; quote: string; name: string; detail: string | null } | null,
};
const writes: { op: string; arg?: unknown }[] = [];
const revalidatePath = vi.fn();

function chain(final: () => Promise<unknown>) {
  const c: Record<string, unknown> = {};
  for (const k of ['eq', 'select', 'order']) c[k] = () => c;
  c['maybeSingle'] = final;
  c['single'] = final;
  c['then'] = (f: (v: unknown) => unknown) => final().then(f);
  return c;
}

const db = {
  from: () => ({
    select: () => chain(() => Promise.resolve({ data: state.rows, error: state.error === null ? null : { message: state.error } })),
    insert: (arg: unknown) => {
      writes.push({ op: 'insert', arg });
      return chain(() => Promise.resolve({ data: { id: 'new', quote: 'So pretty', name: 'Maria', detail: null }, error: state.error === null ? null : { message: state.error } }));
    },
    update: (arg: unknown) => {
      writes.push({ op: 'update', arg });
      return chain(() => Promise.resolve({ data: state.updated, error: state.error === null ? null : { message: state.error } }));
    },
    delete: () => {
      writes.push({ op: 'delete' });
      return chain(() => Promise.resolve({ error: state.error === null ? null : { message: state.error } }));
    },
  }),
};

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => db }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const { saveTestimonial, removeTestimonial, orderTestimonials, showTestimonial } = await import('./actions');

beforeEach(() => {
  state.features = new Set(['testimonials']);
  state.rows = [];
  state.error = null;
  state.updated = { id: 't1', quote: 'q', name: 'n', detail: null };
  writes.length = 0;
});

describe('showing testimonials on a Market site', () => {
  it('ticks one to show, up to three, and unticks any time', async () => {
    state.rows = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }];
    expect(await showTestimonial('c', true)).toEqual({ ok: true });
    expect(writes.at(-1)).toEqual({ op: 'update', arg: { shown: true } });
    state.rows = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }, { id: 'c', position: 2 }];
    expect(await showTestimonial('d', true)).toEqual({ ok: false, error: 'Your site shows up to 3. Untick one to show this one.' });
    expect((await showTestimonial('c', true)).ok).toBe(true);
    expect(await showTestimonial('a', false)).toEqual({ ok: true });
  });
  it('says so when it can’t', async () => {
    state.error = 'down';
    expect((await showTestimonial('a', true)).ok).toBe(false);
    expect((await showTestimonial('a', false)).ok).toBe(false);
    state.features = new Set();
    expect((await showTestimonial('a', false)).ok).toBe(false);
  });
});

describe('testimonial actions', () => {
  it('adds one at the end', async () => {
    state.rows = [{ id: 'a', position: 0 }, { id: 'b', position: 4 }];
    const r = await saveTestimonial({ id: null, quote: 'So pretty', name: 'Maria', detail: '' });
    expect(r).toEqual({ ok: true, item: { id: 'new', quote: 'So pretty', name: 'Maria', detail: '', shown: false } });
    expect(writes[0]).toEqual({ op: 'insert', arg: { tenant_id: 't1', position: 5, quote: 'So pretty', name: 'Maria', detail: null } });
  });

  it('changes one, and says so when it’s gone', async () => {
    expect((await saveTestimonial({ id: 't1', quote: 'q', name: 'n', detail: '' })).ok).toBe(true);
    state.updated = null;
    expect(await saveTestimonial({ id: 't1', quote: 'q', name: 'n', detail: '' })).toEqual({ ok: false, error: 'That testimonial no longer exists. Reload the page.' });
  });

  it('refuses when switched off, when the form is wrong, or when full', async () => {
    expect((await saveTestimonial({ id: null, quote: '', name: 'n', detail: '' })).ok).toBe(false);
    state.rows = Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, position: i }));
    expect((await saveTestimonial({ id: null, quote: 'q', name: 'n', detail: '' })).ok).toBe(false);
    state.features = new Set();
    expect(await removeTestimonial('t1')).toEqual({ ok: false, error: 'Testimonials aren’t switched on for this site.' });
    expect(writes).toEqual([]);
  });

  it('removes one, and reports a failure', async () => {
    expect(await removeTestimonial('t1')).toEqual({ ok: true });
    state.error = 'down';
    expect((await removeTestimonial('t1')).ok).toBe(false);
  });

  it('puts them in her order, only when the list matches', async () => {
    state.rows = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }];
    expect(await orderTestimonials(['b', 'a'])).toEqual({ ok: true });
    expect(writes.map((w) => w.arg)).toEqual([{ position: 0 }, { position: 1 }]);
    expect((await orderTestimonials(['a'])).ok).toBe(false);
  });

  it('says so when a save fails', async () => {
    state.error = 'down';
    expect((await saveTestimonial({ id: null, quote: 'q', name: 'n', detail: '' })).ok).toBe(false);
    expect((await orderTestimonials(['a'])).ok).toBe(false);
  });
});
