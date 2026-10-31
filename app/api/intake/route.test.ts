// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
const saveIntake = vi.fn();
const getIntakeWords = vi.fn();
const logError = vi.fn();
const getCurrentUser = vi.fn();
const onboardingSite = vi.fn();

vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: () => Promise.resolve(null) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/images/shrink', () => ({ shrinkImage: vi.fn() }));
vi.mock('@/lib/intake/save', () => ({ saveIntake: (...a: unknown[]) => saveIntake(...a) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: () => getIntakeWords() }));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock('@/lib/signup/onboarding', () => ({ onboardingSite: (...a: unknown[]) => onboardingSite(...a) }));

import { POST } from './route';
import { FIELD, MIN_PIECES, MOOD_PICK } from '@/lib/intake/request';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';

function body(extra: Record<string, string> = {}): FormData {
  const f = new FormData();
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
const post = (f: FormData | string): Promise<Response> => POST(new Request('https://app.bohdiai.com/api/intake', { method: 'POST', body: f }));

const SITE = { tenantId: 't1', plan: 'full', billing: 'yearly', businessName: 'Saltmarsh' };

describe('POST /api/intake (onboarding)', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ error: null });
    saveIntake.mockReset().mockResolvedValue({ ok: true, id: 'i1' });
    getIntakeWords.mockReset().mockResolvedValue(keyWords(INTAKE_WORD_SPOTS, 'intake'));
    logError.mockReset();
    getCurrentUser.mockReset().mockResolvedValue({ id: 'u1', email: 'lena@example.com', user_metadata: { name: 'Lena' } });
    onboardingSite.mockReset().mockResolvedValue(SITE);
  });

  it('saves it against their own site, with who they are and their plan from sign-up, and emails Alex', async () => {
    const res = await post(body());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(onboardingSite).toHaveBeenCalledWith({}, 'u1');
    expect(saveIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tenantId: 't1',
        fields: { plan: 'full', billing: 'yearly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'lena@example.com', makes: 'Lace', about: 'Porch', family: null },
        portrait: null,
      }),
    );
    expect(saveIntake.mock.calls[0]?.[0].pieces).toHaveLength(MIN_PIECES);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'alex@bohdiai.com', replyTo: 'lena@example.com', subject: 'intake.email.subject' }));
  });

  it('never takes a plan or an email from the form', async () => {
    await post(body({ plan: 'showcase', email: 'someone@else.com' }));
    expect(saveIntake.mock.calls[0]?.[0].fields).toMatchObject({ plan: 'full', email: 'lena@example.com' });
  });

  it('turns away someone who isn’t signed in, before anything else', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await post(body());
    expect(res.status).toBe(401);
    expect(onboardingSite).not.toHaveBeenCalled();
    expect(saveIntake).not.toHaveBeenCalled();
  });

  it('turns away a maker with no site waiting (already sent, not paid, or Free)', async () => {
    onboardingSite.mockResolvedValue(null);
    const res = await post(body());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ failed: true });
    expect(saveIntake).not.toHaveBeenCalled();
  });

  it('spam is answered as sent and saved nowhere', async () => {
    const res = await post(body({ [FIELD.honeypot]: 'Acme' }));
    expect(await res.json()).toEqual({ ok: true });
    expect(saveIntake).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('names what’s wrong as a spot in the form’s words', async () => {
    const res = await post(body({ [FIELD.makes]: ' ' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ problem: { spot: 'makes', values: {} } });
    expect(saveIntake).not.toHaveBeenCalled();
  });

  it('a body that isn’t a form didn’t send', async () => {
    const res = await POST(new Request('https://app.bohdiai.com/api/intake', { method: 'POST', body: '{"x":1}', headers: { 'content-type': 'application/json' } }));
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
