import { describe, it, expect } from 'vitest';
import { ownerSignInUrl } from './owner-sign-in-url';

describe('ownerSignInUrl', () => {
  it('is the app host sign-in page for the site origin', () => {
    expect(ownerSignInUrl('https://bohdiai.com')).toBe('https://app.bohdiai.com/signin');
    expect(ownerSignInUrl('http://localhost:3000')).toBe('http://app.localhost:3000/signin');
  });
});
