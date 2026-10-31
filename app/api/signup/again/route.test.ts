// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendAgain = vi.fn();
const fixEmail = vi.fn();
const logError = vi.fn();

vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: () => Promise.resolve(null) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/signup/after-paid', () => ({ sendAgain: (...a: unknown[]) => sendAgain(...a), fixEmail: (...a: unknown[]) => fixEmail(...a) }));

import { POST } from './route';

const post = (body: unknown): Promise<Response> =>
  POST(new Request('https://bohdiai.com/api/signup/again', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));

describe('POST /api/signup/again', () => {
  beforeEach(() => {
    for (const f of [sendAgain, fixEmail, logError]) f.mockReset();
  });

  it('sends the link again and says where', async () => {
    sendAgain.mockResolvedValue({ ok: true, email: 'lena@example.com' });
    const res = await post({ session: 'cs_1' });
    expect(await res.json()).toEqual({ email: 'lena@example.com' });
    expect(sendAgain).toHaveBeenCalledWith({}, {}, 'cs_1');
    expect(fixEmail).not.toHaveBeenCalled();
  });

  it('moves to a new email when one is given', async () => {
    fixEmail.mockResolvedValue({ ok: true, email: 'new@example.com' });
    const res = await post({ session: 'cs_1', email: 'new@example.com' });
    expect(await res.json()).toEqual({ email: 'new@example.com' });
    expect(fixEmail).toHaveBeenCalledWith({}, {}, 'cs_1', 'new@example.com');
  });

  it.each(['email', 'accountExists'])('names the problem (%s) in the form’s words', async (reason) => {
    fixEmail.mockResolvedValue({ ok: false, reason });
    const res = await post({ session: 'cs_1', email: 'x' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ problem: { spot: reason, values: {} } });
  });

  it('sends nothing for a checkout that isn’t a paid sign-up', async () => {
    sendAgain.mockResolvedValue({ ok: false, reason: 'notFound' });
    const res = await post({ session: 'nope' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ failed: true });
  });

  it('says it failed, and logs why, when sending breaks', async () => {
    sendAgain.mockRejectedValue(new Error('resend down'));
    const res = await post({ session: 'cs_1' });
    expect(res.status).toBe(502);
    expect(logError).toHaveBeenCalled();
  });

  it('turns away a body that isn’t JSON', async () => {
    expect((await post('nope')).status).toBe(400);
  });
});
