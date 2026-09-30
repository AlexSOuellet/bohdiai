import { describe, it, expect } from 'vitest';
import { isBackendPath, backendRedirect } from './backend-paths';

describe('isBackendPath', () => {
  it.each(['/signin', '/forgot-password', '/auth/confirm', '/auth/error', '/manage', '/manage/set-password'])('%s is a backend path', (p) => {
    expect(isBackendPath(p)).toBe(true);
  });
  it.each(['/', '/shop', '/manager', '/signing', '/authors', '/dashboard'])('%s is not', (p) => {
    expect(isBackendPath(p)).toBe(false);
  });
});

describe('backendRedirect', () => {
  const url = (s: string) => new URL(s);
  const base = 'https://app.bohdiai.com';
  it.each(['yourshop.com', 'example.co.uk', 'bohdiai.xyz.workers.dev', 'shop.bohdiai.com.'])('sends %s to the configured app origin', (h) => {
    expect(backendRedirect(h, url(`https://${h}/signin`), base)).toBe('https://app.bohdiai.com/signin');
  });
  it('sends a backend path on a shop host to the app host, keeping path and query', () => {
    expect(backendRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/signin?next=%2Fmanage'), base)).toBe(
      'https://app.bohdiai.com/signin?next=%2Fmanage',
    );
  });
  it('does the same from the marketing apex', () => {
    expect(backendRedirect('bohdiai.com', url('https://bohdiai.com/manage'), base)).toBe('https://app.bohdiai.com/manage');
  });
  it('works for local dev hosts', () => {
    expect(backendRedirect('classic-loafs.localhost:3000', url('http://classic-loafs.localhost:3000/signin'), base)).toBe(
      'http://app.localhost:3000/signin',
    );
  });
  it('leaves the app host alone', () => {
    expect(backendRedirect('app.bohdiai.com', url('https://app.bohdiai.com/signin'), base)).toBeNull();
  });
  it('leaves non-backend paths alone', () => {
    expect(backendRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/shop'), base)).toBeNull();
  });
});
