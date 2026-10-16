// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
const saveIntake = vi.fn();
const getIntakeWords = vi.fn();
const logError = vi.fn();

vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: () => Promise.resolve(null) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/images/shrink', () => ({ shrinkImage: vi.fn() }));
vi.mock('@/lib/intake/save', () => ({ saveIntake: (...a: unknown[]) => saveIntake(...a) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: () => getIntakeWords() }));

import { POST } from './route';
import { FIELD, MIN_PIECES, MOOD_PICK } from '@/lib/intake/request';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';

function body(extra: Record<string, string> = {}): FormData {
  const f = new FormData();
  f.set(FIELD.plan, 'full');
  f.set(FIELD.billing, 'yearly');
  f.set(FIELD.name, 'Lena');
  f.set(FIELD.business, 'Saltmarsh');
  f.set(FIELD.email, 'lena@example.com');
  f.set(FIELD.makes, 'Lace');
  f.set(FIELD.about, 'Porch');
  f.set(FIELD.family, MOOD_PICK);
  for (let i = 0; i < MIN_PIECES; i += 1) {
    f.append(FIELD.pieceName, `P${i}`);
    f.append(FIELD.piecePrice, '10');
    f.append(FIELD.pieceAbout, '');
    f.append(FIELD.piecePhoto, new File([new Uint8Array(3)], 'p.jpg', { type: 'image/jpeg' }));
  }
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  return f;
}
const post = (f: FormData | string): Promise<Response> => POST(new Request('https://bohdiai.com/api/intake', { method: 'POST', body: f }));

describe('POST /api/intake', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ error: null });
    saveIntake.mockReset().mockResolvedValue({ ok: true, id: 'i1' });
    getIntakeWords.mockReset().mockResolvedValue(keyWords(INTAKE_WORD_SPOTS, 'intake'));
    logError.mockReset();
  });

  it('saves it, emails Alex with the maker as Reply-To, and says it arrived', async () => {
    const res = await post(body());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(saveIntake).toHaveBeenCalledWith(expect.objectContaining({ fields: expect.objectContaining({ plan: 'full', billing: 'yearly', makerName: 'Lena', family: null }), portrait: null }));
    expect(saveIntake.mock.calls[0]?.[0].pieces).toHaveLength(MIN_PIECES);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'alex@bohdiai.com', replyTo: 'lena@example.com', subject: 'intake.email.subject' }));
  });

  it('spam is answered as sent and saved nowhere', async () => {
    const res = await post(body({ [FIELD.honeypot]: 'Acme' }));
    expect(await res.json()).toEqual({ ok: true });
    expect(saveIntake).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('names what’s wrong as a spot in the form’s words', async () => {
    const res = await post(body({ [FIELD.email]: 'nope' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ problem: { spot: 'email', values: {} } });
    expect(saveIntake).not.toHaveBeenCalled();
  });

  it('a body that isn’t a form didn’t send', async () => {
    const res = await POST(new Request('https://bohdiai.com/api/intake', { method: 'POST', body: '{"x":1}', headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ failed: true });
  });

  it('an unreadable photo is named; a failed save didn’t send', async () => {
    saveIntake.mockResolvedValueOnce({ ok: false, reason: 'photoUnread' });
    let res = await post(body());
    expect(await res.json()).toEqual({ problem: { spot: 'photoUnread', values: {} } });
    saveIntake.mockResolvedValueOnce({ ok: false, reason: 'failed' });
    res = await post(body());
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ failed: true });
    expect(send).not.toHaveBeenCalled();
  });

  it('once saved, a failed email is logged and the maker is still told it arrived', async () => {
    send.mockResolvedValueOnce({ error: { message: 'resend down' } });
    expect(await (await post(body())).json()).toEqual({ ok: true });
    send.mockRejectedValueOnce(new Error('boom'));
    expect(await (await post(body())).json()).toEqual({ ok: true });
    getIntakeWords.mockRejectedValueOnce('words down');
    expect(await (await post(body())).json()).toEqual({ ok: true });
    expect(logError).toHaveBeenCalledTimes(3);
  });

  it('anything unexpected didn’t send', async () => {
    saveIntake.mockRejectedValueOnce(new Error('boom'));
    const res = await post(body());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ failed: true });
  });
});
