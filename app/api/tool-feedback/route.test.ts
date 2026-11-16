// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ inserted: [] as unknown[], error: null as null | { message: string }, limited: null as Response | null }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => state.limited }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (t: string) => ({
      insert: async (row: unknown) => {
        state.inserted.push({ t, row });
        return { error: state.error };
      },
    }),
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const { POST } = await import('./route');
const post = (body: unknown): Request => new Request('https://bohdiai.com/api/tool-feedback', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  state.inserted = [];
  state.error = null;
  state.limited = null;
});

describe('POST /api/tool-feedback', () => {
  it('saves a response and says thanks', async () => {
    const res = await POST(post({ message: 'Love it', wants: ['tags'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(state.inserted).toEqual([{ t: 'tool_feedback', row: { message: 'Love it', wants: ['tags'], name: '', email: '', makes: '' } }]);
  });
  it('says what to fix, and saves nothing', async () => {
    const res = await POST(post({ message: '' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Tell us what you think, or tick a tool you’d use.' });
    expect(state.inserted).toEqual([]);
  });
  it('answers a bot as if it worked, and saves nothing', async () => {
    const res = await POST(post({ message: 'Buy', company: 'x' }));
    expect(res.status).toBe(200);
    expect(state.inserted).toEqual([]);
  });
  it('turns a flood away before reading anything', async () => {
    state.limited = Response.json({ error: 'slow down' }, { status: 429 });
    const res = await POST(post({ message: 'Hi' }));
    expect(res.status).toBe(429);
    expect(state.inserted).toEqual([]);
  });
  it('says so when the save fails, or the body is broken', async () => {
    state.error = { message: 'down' };
    const res = await POST(post({ message: 'Hi' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'That didn’t send. Please try again in a moment.' });
    const bad = await POST(new Request('https://bohdiai.com/api/tool-feedback', { method: 'POST', body: '{nope' }));
    expect(bad.status).toBe(400);
  });
});
