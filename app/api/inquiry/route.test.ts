// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
const formLimitResponse = vi.fn();
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: (...a: unknown[]) => formLimitResponse(...a) }));

const { POST } = await import('./route');

const good = { name: 'Pat', email: 'pat@example.com', kind: 'charity', message: 'We run a dog rescue.' };
const post = (body: unknown) =>
  POST(
    new Request('https://bohdiai.com/api/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

describe('POST /api/inquiry', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    formLimitResponse.mockReset().mockResolvedValue(null);
  });

  it('emails Alex with the visitor as reply-to', async () => {
    const res = await post(good);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const msg = send.mock.calls[0]?.[0] as { to: string; replyTo: string; subject: string; from: string };
    expect(msg.to).toBe('alex@bohdiai.com');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.from).toBe('BohdiAI <site@example.com>');
    expect(msg.subject).toBe('New project: Pat (Charity or cause)');
  });

  it('answers ok to a bot and sends nothing', async () => {
    expect((await post({ ...good, company: 'x' })).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('returns the first problem for a bad form', async () => {
    const res = await post({ ...good, email: 'nope' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'That email doesn’t look right.' });
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
  });

  it('reports a failed send with the address to write to instead', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });
    const a = await post(good);
    expect(a.status).toBe(502);
    expect(((await a.json()) as { error: string }).error).toContain('alex@bohdiai.com');
    send.mockRejectedValue(new Error('network'));
    const b = await post(good);
    expect(b.status).toBe(502);
    expect(((await b.json()) as { error: string }).error).toContain('alex@bohdiai.com');
  });
});
