import { describe, it, expect } from 'vitest';
import { ownerSignInUrl, ownerSignInHref } from './owner-sign-in-url';

describe('ownerSignInUrl', () => {
  it('is the app host sign-in page for the site origin', () => {
    expect(ownerSignInUrl('https://bohdiai.com')).toBe('https://app.bohdiai.com/signin');
    expect(ownerSignInUrl('http://localhost:3000')).toBe('http://app.localhost:3000/signin');
  });
});

describe('ownerSignInHref', () => {
  it('uses the given site url', () => {
    expect(ownerSignInHref('http://localhost:3000')).toBe('http://app.localhost:3000/signin');
  });
  it('falls back to bohdiai.com when SITE_URL is missing, blank or malformed', () => {
    expect(ownerSignInHref(undefined)).toBe('https://app.bohdiai.com/signin');
    expect(ownerSignInHref('  ')).toBe('https://app.bohdiai.com/signin');
    expect(ownerSignInHref('not a url')).toBe('https://app.bohdiai.com/signin');
  });
});
