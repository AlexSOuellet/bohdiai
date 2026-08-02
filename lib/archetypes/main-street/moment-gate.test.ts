import { describe, it, expect } from 'vitest';
import {
  momentSeenCookieName,
  hasSeenMoment,
  isColdFrontDoorEntry,
  shouldPlayMoment,
  resolveMomentPlayMode,
} from './moment-gate';

describe('momentSeenCookieName', () => {
  it('keys the cookie per shop', () => {
    expect(momentSeenCookieName('tn_123')).toBe('bohdi_moment_seen_tn_123');
  });
});

describe('hasSeenMoment', () => {
  it('detects the shop cookie among others', () => {
    expect(hasSeenMoment('tn_123', 'a=1; bohdi_moment_seen_tn_123=1; b=2')).toBe(true);
  });
  it('is false when absent, and not fooled by another shop', () => {
    expect(hasSeenMoment('tn_123', 'a=1')).toBe(false);
    expect(hasSeenMoment('tn_123', 'bohdi_moment_seen_tn_999=1')).toBe(false);
  });
});

describe('isColdFrontDoorEntry', () => {
  it('is true only when the loaded document was the home page', () => {
    expect(isColdFrontDoorEntry('/')).toBe(true);
    expect(isColdFrontDoorEntry('/product/belt')).toBe(false);
    expect(isColdFrontDoorEntry(null)).toBe(false);
  });
});

describe('shouldPlayMoment', () => {
  const key = 'tn_123';
  const noCookie = '';

  it('plays for a cold front-door arrival that has not entered before', () => {
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: noCookie })).toBe(true);
  });

  it('does NOT play for a side-door arrival, even when the current route is home', () => {
    expect(shouldPlayMoment({ initialPath: '/product/belt', key, cookieString: noCookie })).toBe(false);
  });

  it('does NOT play once the shop has been entered (cookie set)', () => {
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: 'bohdi_moment_seen_tn_123=1' })).toBe(false);
  });

  it('does NOT play without a shop key (e.g. preview)', () => {
    expect(shouldPlayMoment({ initialPath: '/', key: null, cookieString: noCookie })).toBe(false);
  });

  it('always plays on a deliberate replay, ignoring cold/seen/key', () => {
    expect(shouldPlayMoment({ initialPath: '/product/belt', key, cookieString: 'bohdi_moment_seen_tn_123=1', forceReplay: true })).toBe(true);
  });

  it('never plays when the Moment is set off, overriding even a forced replay', () => {
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: noCookie, playMode: 'off' })).toBe(false);
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: noCookie, forceReplay: true, playMode: 'off' })).toBe(false);
  });

  it('replays on every cold front-door visit when set to "always", ignoring the seen-cookie', () => {
    expect(
      shouldPlayMoment({ initialPath: '/', key, cookieString: 'bohdi_moment_seen_tn_123=1', playMode: 'always' }),
    ).toBe(true);
  });

  it('still respects the cold-front-door gate when set to "always" — a side door gets no Moment', () => {
    expect(shouldPlayMoment({ initialPath: '/product/belt', key, cookieString: noCookie, playMode: 'always' })).toBe(false);
  });

  it('plays once per visitor by default when playMode is omitted (prior content stays on)', () => {
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: noCookie })).toBe(true);
    expect(shouldPlayMoment({ initialPath: '/', key, cookieString: 'bohdi_moment_seen_tn_123=1' })).toBe(false);
  });
});

describe('resolveMomentPlayMode', () => {
  it('defaults to "once" when nothing is set', () => {
    expect(resolveMomentPlayMode({})).toBe('once');
  });

  it('reads the explicit playMode when present', () => {
    expect(resolveMomentPlayMode({ playMode: 'once' })).toBe('once');
    expect(resolveMomentPlayMode({ playMode: 'always' })).toBe('always');
    expect(resolveMomentPlayMode({ playMode: 'off' })).toBe('off');
  });

  it('maps a legacy playIntro=false to "off" and playIntro=true to "once"', () => {
    expect(resolveMomentPlayMode({ playIntro: false })).toBe('off');
    expect(resolveMomentPlayMode({ playIntro: true })).toBe('once');
  });

  it('prefers an explicit playMode over a legacy playIntro', () => {
    expect(resolveMomentPlayMode({ playMode: 'always', playIntro: false })).toBe('always');
  });

  it('falls back to "once" for an unknown playMode value', () => {
    expect(resolveMomentPlayMode({ playMode: 'weekly' })).toBe('once');
  });
});
