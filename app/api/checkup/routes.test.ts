// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OPENING } from '@/lib/checkup/transcript';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
const checkupLimitResponse = vi.fn();
vi.mock('@/lib/checkup/limit', () => ({ checkupLimitResponse: (...a: unknown[]) => checkupLimitResponse(...a) }));
const nextStep = vi.fn();
const writeUp = vi.fn();
vi.mock('@/lib/checkup/ai', () => ({
  nextStep: (...a: unknown[]) => nextStep(...a),
  writeUp: (...a: unknown[]) => writeUp(...a),
}));

const { POST: next } = await import('./next/route');
const { POST: write } = await import('./writeup/route');

const call = (handler: (r: Request) => Promise<Response>, body: unknown) =>
  handler(
    new Request('https://bohdiai.com/api/checkup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const turns = [
  { question: OPENING[0], answer: 'Trays' },
  { question: OPENING[1], answer: 'Pay for itself, maybe a little extra' },
];

beforeEach(() => {
  checkupLimitResponse.mockReset().mockResolvedValue(null);
  nextStep.mockReset();
  writeUp.mockReset();
});

describe('POST /api/checkup/next', () => {
  it('answers with the next step for the cleaned transcript', async () => {
    nextStep.mockResolvedValue({ done: true });
    const res = await call(next, { transcript: [...turns, 'junk'] });
    expect(await res.json()).toEqual({ done: true });
    expect(nextStep).toHaveBeenCalledWith(turns);
  });

  it('starts from nothing on an empty or missing transcript', async () => {
    nextStep.mockResolvedValue({ done: false, question: OPENING[0] });
    expect((await call(next, {})).status).toBe(200);
    expect(nextStep).toHaveBeenCalledWith([]);
  });

  it('reports bad bodies, failures and the rate limit', async () => {
    expect((await call(next, 'not json')).status).toBe(400);
    nextStep.mockRejectedValue(new Error('timeout'));
    const failed = await call(next, { transcript: turns });
    expect(failed.status).toBe(502);
    expect(((await failed.json()) as { error: string }).error).toMatch(/Try again/);
    checkupLimitResponse.mockResolvedValue(Response.json({ error: 'slow' }, { status: 429 }));
    expect((await call(next, { transcript: turns })).status).toBe(429);
  });
});

describe('POST /api/checkup/writeup', () => {
  it('writes up a finished conversation', async () => {
    writeUp.mockResolvedValue({ summary: ['a'], first_steps: [], paths: [] });
    expect((await call(write, { transcript: turns })).status).toBe(200);
    expect(writeUp).toHaveBeenCalledWith(turns);
  });

  it('needs at least the opening answered', async () => {
    const res = await call(write, { transcript: turns.slice(0, 1) });
    expect(res.status).toBe(400);
    expect(writeUp).not.toHaveBeenCalled();
  });

  it('reports bad bodies, failures and the rate limit', async () => {
    expect((await call(write, 'not json')).status).toBe(400);
    writeUp.mockRejectedValue(new Error('refused'));
    expect((await call(write, { transcript: turns })).status).toBe(502);
    checkupLimitResponse.mockResolvedValue(Response.json({ error: 'slow' }, { status: 429 }));
    expect((await call(write, { transcript: turns })).status).toBe(429);
  });
});
