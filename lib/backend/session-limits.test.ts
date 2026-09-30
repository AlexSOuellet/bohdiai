import { describe, it, expect, vi } from 'vitest';
import {
  IDLE_SECONDS,
  MAX_SECONDS,
  signedInAt,
  signActivity,
  readActivity,
  sessionVerdict,
  checkBackendSession,
  endedReason,
  sessionSecret,
} from './session-limits';

describe('sessionSecret', () => {
  it('passes a long enough secret through', () => {
    expect(sessionSecret('x'.repeat(32))).toBe('x'.repeat(32));
  });
  it('refuses a missing or short secret, and says so', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(sessionSecret(undefined)).toBeUndefined();
    expect(sessionSecret('short')).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});

describe('endedReason', () => {
  it('accepts only the two known reasons', () => {
    expect(endedReason('idle')).toBe('idle');
    expect(endedReason('max')).toBe('max');
    expect(endedReason('other')).toBeNull();
    expect(endedReason(undefined)).toBeNull();
    expect(endedReason(['idle'])).toBeNull();
  });
});

const SECRET = 'test-secret-that-is-long-enough-000000';
const SESSION = '8c1f0a52-3b7e-4c1a-9d1e-2f6b5a4c3d21';
const T0 = 1_790_000_000; // a sign-in time, in seconds

describe('signedInAt', () => {
  it('reads the sign-in time from the token’s auth methods', () => {
    expect(signedInAt({ amr: [{ method: 'password', timestamp: T0 }] })).toBe(T0);
  });
  it('takes the earliest when there are several', () => {
    expect(signedInAt({ amr: [{ method: 'otp', timestamp: T0 + 50 }, { method: 'password', timestamp: T0 }] })).toBe(T0);
  });
  it('is null when the token carries no sign-in time', () => {
    expect(signedInAt({})).toBeNull();
    expect(signedInAt({ amr: [] })).toBeNull();
    expect(signedInAt({ amr: [{ method: 'password' }] })).toBeNull();
    expect(signedInAt({ amr: 'password' })).toBeNull();
  });
});

describe('activity cookie', () => {
  it('round-trips for the same session and secret', async () => {
    const value = await signActivity(SESSION, T0 + 100, SECRET);
    expect(await readActivity(value, SESSION, SECRET)).toBe(T0 + 100);
  });
  it('is refused for another session', async () => {
    const value = await signActivity(SESSION, T0 + 100, SECRET);
    expect(await readActivity(value, 'another-session', SECRET)).toBeNull();
  });
  it('is refused under another secret', async () => {
    const value = await signActivity(SESSION, T0 + 100, SECRET);
    expect(await readActivity(value, SESSION, 'a-different-secret-000000000000000')).toBeNull();
  });
  it('is refused when the time is edited', async () => {
    const value = await signActivity(SESSION, T0 + 100, SECRET);
    const [, , mac] = value.split('.');
    expect(await readActivity(`${SESSION}.${T0 + 99_999}.${mac}`, SESSION, SECRET)).toBeNull();
  });
  it('is refused when hand-made or malformed', async () => {
    expect(await readActivity(`${SESSION}.${T0}.forged`, SESSION, SECRET)).toBeNull();
    expect(await readActivity('junk', SESSION, SECRET)).toBeNull();
    expect(await readActivity('', SESSION, SECRET)).toBeNull();
    expect(await readActivity(`${SESSION}.notanumber.x`, SESSION, SECRET)).toBeNull();
  });
});

describe('sessionVerdict', () => {
  it('is fine while active', () => {
    expect(sessionVerdict({ signedInAt: T0, lastSeen: T0 + 60, now: T0 + 120 })).toBe('ok');
  });
  it('ends after 8 hours with no activity', () => {
    expect(sessionVerdict({ signedInAt: T0, lastSeen: T0, now: T0 + IDLE_SECONDS })).toBe('ok');
    expect(sessionVerdict({ signedInAt: T0, lastSeen: T0, now: T0 + IDLE_SECONDS + 1 })).toBe('idle');
  });
  it('ends after 7 days even when active', () => {
    const now = T0 + MAX_SECONDS + 1;
    expect(sessionVerdict({ signedInAt: T0, lastSeen: now - 5, now })).toBe('max');
  });
  it('never lets activity from before sign-in count', () => {
    expect(sessionVerdict({ signedInAt: T0, lastSeen: T0 - 10_000, now: T0 + IDLE_SECONDS + 1 })).toBe('idle');
  });
  it('treats an activity time in the future as no activity', () => {
    expect(sessionVerdict({ signedInAt: T0, lastSeen: T0 + 999_999, now: T0 + IDLE_SECONDS + 1 })).toBe('idle');
  });
});

describe('checkBackendSession', () => {
  const claims = { session_id: SESSION, amr: [{ method: 'password', timestamp: T0 }] };

  it('without a cookie, counts idle time from sign-in', async () => {
    expect((await checkBackendSession({ claims, cookie: undefined, now: T0 + 60, secret: SECRET })).verdict).toBe('ok');
    expect((await checkBackendSession({ claims, cookie: undefined, now: T0 + IDLE_SECONDS + 1, secret: SECRET })).verdict).toBe('idle');
  });
  it('a valid cookie keeps the session alive past 8 hours from sign-in', async () => {
    const cookie = await signActivity(SESSION, T0 + IDLE_SECONDS, SECRET);
    const result = await checkBackendSession({ claims, cookie, now: T0 + IDLE_SECONDS + 60, secret: SECRET });
    expect(result.verdict).toBe('ok');
    expect(await readActivity(result.nextCookie ?? '', SESSION, SECRET)).toBe(T0 + IDLE_SECONDS + 60);
  });
  it('a forged cookie is ignored', async () => {
    const result = await checkBackendSession({ claims, cookie: `${SESSION}.${T0 + IDLE_SECONDS}.forged`, now: T0 + IDLE_SECONDS + 60, secret: SECRET });
    expect(result.verdict).toBe('idle');
  });
  it('with no secret, ignores the cookie and issues none (strictest)', async () => {
    const cookie = await signActivity(SESSION, T0 + IDLE_SECONDS, SECRET);
    const late = await checkBackendSession({ claims, cookie, now: T0 + IDLE_SECONDS + 60, secret: undefined });
    expect(late.verdict).toBe('idle');
    const early = await checkBackendSession({ claims, cookie: undefined, now: T0 + 60, secret: undefined });
    expect(early).toEqual({ verdict: 'ok', nextCookie: null });
  });
  it('a token with no sign-in time or session is ended', async () => {
    expect((await checkBackendSession({ claims: { session_id: SESSION }, cookie: undefined, now: T0, secret: SECRET })).verdict).toBe('max');
    expect((await checkBackendSession({ claims: { amr: claims.amr }, cookie: undefined, now: T0, secret: SECRET })).verdict).toBe('max');
  });
  it('issues no cookie once the session has ended', async () => {
    const result = await checkBackendSession({ claims, cookie: undefined, now: T0 + MAX_SECONDS + 1, secret: SECRET });
    expect(result).toEqual({ verdict: 'max', nextCookie: null });
  });
});
