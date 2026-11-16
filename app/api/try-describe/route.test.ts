// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ limited: null as Response | null, result: { ok: true, text: { short: 'A mug.', description: 'A stoneware mug.' } } as unknown, throws: false, asked: [] as unknown[] }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => state.limited }));
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({}) }));
vi.mock('@/lib/tools/describe', () => ({
  writeDescription: async (_c: unknown, input: unknown) => {
    state.asked.push(input);
    if (state.throws) throw new Error('api down');
    return state.result;
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const { POST } = await import('./route');
const post = (body: unknown): Request => new Request('https://bohdiai.com/api/try-describe', { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  state.limited = null;
  state.result = { ok: true, text: { short: 'A mug.', description: 'A stoneware mug.' } };
  state.throws = false;
  state.asked = [];
});

describe('POST /api/try-describe', () => {
  it('writes the description from what the visitor gave', async () => {
    const res = await POST(post({ name: 'Mug', madeOf: 'stoneware', photo: 'data:image/jpeg;base64,QUJD' }));
    expect(await res.json()).toEqual({ ok: true, text: { short: 'A mug.', description: 'A stoneware mug.' } });
    expect(state.asked[0]).toMatchObject({ name: 'Mug', materials: ['stoneware'], photoData: { mediaType: 'image/jpeg', data: 'QUJD' } });
  });
  it('turns a flood away before the AI is asked', async () => {
    state.limited = Response.json({ error: 'slow down' }, { status: 429 });
    expect((await POST(post({ name: 'Mug' }))).status).toBe(429);
    expect(state.asked).toEqual([]);
  });
  it('says what to fix, and asks nothing', async () => {
    const res = await POST(post({ name: '' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Give the piece a name first.' });
    expect(state.asked).toEqual([]);
    expect((await POST(new Request('https://bohdiai.com/api/try-describe', { method: 'POST', body: '{' }))).status).toBe(400);
  });
  it('passes on the writer’s own message, and says so when it fails', async () => {
    state.result = { ok: false, error: 'The description ran long. Try again.' };
    expect(await (await POST(post({ name: 'Mug' }))).json()).toEqual({ error: 'The description ran long. Try again.' });
    state.throws = true;
    const res = await POST(post({ name: 'Mug' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'The description couldn’t be written just now. Please try again in a moment.' });
  });
});
