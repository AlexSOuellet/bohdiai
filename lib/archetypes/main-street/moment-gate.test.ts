import { describe, it, expect } from 'vitest';
import { momentSeenCookieName, hasSeenMoment, isColdFrontDoorEntry, shouldPlayMoment } from './moment-gate';

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
    // The visit loaded on a product page; the customer later walked to home.
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
});
