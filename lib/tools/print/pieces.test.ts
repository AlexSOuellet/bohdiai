import { describe, it, expect, vi, beforeEach } from 'vitest';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives the next
 *  queued result (or the default). Every call is recorded. */
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

const state = vi.hoisted(() => ({ queue: [] as unknown[], calls: [] as string[] }));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
const fakeDb = () => ({
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

const { checkPiece, loadPieces, PIECES_MAX } = await import('./pieces');
const { savePiece, renamePiece, deletePiece } = await import('./actions');

beforeEach(() => {
  state.queue = [];
  state.calls = [];
  vi.clearAllMocks();
});

const TRAY = { name: '  Round tray ', shape: 'round', widthIn: 12, heightIn: 9, wrapIn: 0.5 };
const ROW = { id: 'p1', name: 'Box lid', shape: 'rect', width_in: 8, height_in: 6.5, wrap_in: 0.25, position: 0 };

describe('checkPiece', () => {
  it('refuses anything that isn’t a piece, without throwing', () => {
    expect(checkPiece({ name: 5, shape: 'rect', widthIn: 8, heightIn: 8, wrapIn: 0 } as never)).toEqual({ ok: false, error: 'Give the piece a name.' });
    expect(checkPiece({ ...TRAY, shape: 'rect', widthIn: '8' } as never)).toEqual({ ok: false, error: 'The size has to be more than 0 and up to 200 inches.' });
  });
  it('trims the name and makes a round piece as tall as it is wide', () => {
    expect(checkPiece(TRAY)).toEqual({ ok: true, piece: { name: 'Round tray', shape: 'round', widthIn: 12, heightIn: 12, wrapIn: 0.5 } });
  });
  it('keeps an oval or a rectangle as typed', () => {
    expect(checkPiece({ ...TRAY, shape: 'oval' })).toMatchObject({ ok: true, piece: { widthIn: 12, heightIn: 9 } });
  });
  it.each([
    [{ ...TRAY, name: '   ' }, 'Give the piece a name.'],
    [{ ...TRAY, name: 'x'.repeat(61) }, 'Keep the name to 60 letters or fewer.'],
    [{ ...TRAY, shape: 'star' }, 'Pick a shape for the piece.'],
    [{ ...TRAY, shape: 'rect', widthIn: 0 }, 'The size has to be more than 0 and up to 200 inches.'],
    [{ ...TRAY, shape: 'rect', heightIn: 201 }, 'The size has to be more than 0 and up to 200 inches.'],
    [{ ...TRAY, widthIn: Number.NaN }, 'The size has to be more than 0 and up to 200 inches.'],
    [{ ...TRAY, wrapIn: -1 }, 'The wrap has to be between 0 and 6 inches.'],
    [{ ...TRAY, wrapIn: 7 }, 'The wrap has to be between 0 and 6 inches.'],
  ])('refuses %o', (input, error) => {
    expect(checkPiece(input)).toEqual({ ok: false, error });
  });
});

describe('loadPieces', () => {
  it('reads the site’s pieces in order', async () => {
    state.queue.push({ data: [ROW], error: null });
    const db = fakeDb() as never;
    expect(await loadPieces(db, 't1')).toEqual([{ id: 'p1', name: 'Box lid', shape: 'rect', widthIn: 8, heightIn: 6.5, wrapIn: 0.25 }]);
    expect(state.calls).toContain('eq("tenant_id","t1")');
  });
  it('treats an unknown shape as a rectangle and a failed read as no pieces', async () => {
    state.queue.push({ data: [{ ...ROW, shape: 'blob' }], error: null });
    expect((await loadPieces(fakeDb() as never, 't1'))[0]?.shape).toBe('rect');
    state.queue.push({ data: null, error: { message: 'down' } });
    expect(await loadPieces(fakeDb() as never, 't1')).toEqual([]);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('savePiece', () => {
  it('saves a checked piece at the end of the list', async () => {
    state.queue.push({ count: 2, error: null }, { data: { ...ROW, id: 'p9', name: 'Round tray', shape: 'round', width_in: 12, height_in: 12, wrap_in: 0.5 }, error: null });
    expect(await savePiece(TRAY)).toEqual({ ok: true, piece: { id: 'p9', name: 'Round tray', shape: 'round', widthIn: 12, heightIn: 12, wrapIn: 0.5 } });
    expect(state.calls.some((c) => c.startsWith('insert(') && c.includes('"tenant_id":"t1"') && c.includes('"position":2'))).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/manage/tools/print');
  });
  it('refuses a bad piece before touching the database', async () => {
    expect(await savePiece({ ...TRAY, name: '' })).toEqual({ ok: false, error: 'Give the piece a name.' });
    expect(state.calls).toEqual([]);
  });
  it('stops at the limit', async () => {
    state.queue.push({ count: PIECES_MAX, error: null });
    expect(await savePiece(TRAY)).toEqual({ ok: false, error: `You can keep up to ${PIECES_MAX} pieces.` });
  });
  it('says so when the save fails', async () => {
    state.queue.push({ count: 0, error: null }, { data: null, error: { message: 'down' } });
    expect(await savePiece(TRAY)).toEqual({ ok: false, error: 'The piece couldn’t be saved. Try again in a moment.' });
    state.queue.push({ count: null, error: { message: 'down' } });
    expect(await savePiece(TRAY)).toMatchObject({ ok: false });
  });
});

describe('renamePiece and deletePiece', () => {
  it('rename changes only the site’s own piece', async () => {
    state.queue.push({ error: null, count: 1 });
    expect(await renamePiece('p1', ' Lid ')).toEqual({ ok: true });
    expect(state.calls).toContain('update({"name":"Lid"})');
    expect(state.calls).toContain('eq("tenant_id","t1")');
  });
  it('rename refuses a blank name and reports a failure', async () => {
    expect(await renamePiece('p1', ' ')).toEqual({ ok: false, error: 'Give the piece a name.' });
    state.queue.push({ error: { message: 'down' } });
    expect(await renamePiece('p1', 'Lid')).toMatchObject({ ok: false });
  });
  it('delete removes the site’s own piece and reports a failure', async () => {
    state.queue.push({ error: null });
    expect(await deletePiece('p1')).toEqual({ ok: true });
    expect(state.calls).toContain('delete()');
    state.queue.push({ error: { message: 'down' } });
    expect(await deletePiece('p1')).toEqual({ ok: false, error: 'The piece couldn’t be removed. Try again in a moment.' });
  });
});
