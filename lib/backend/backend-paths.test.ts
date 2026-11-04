import { describe, it, expect } from 'vitest';
import { isBackendPath, isManagePath, backendRedirect, founderEntryRedirect, ownerEntryRedirect } from './backend-paths';

describe('isManagePath', () => {
  it('covers the backend and its pages', () => {
    expect(isManagePath('/manage')).toBe(true);
    expect(isManagePath('/manage/set-password')).toBe(true);
  });
  it('leaves sign-in, links and look-alikes alone', () => {
    for (const p of ['/signin', '/forgot-password', '/auth/confirm', '/manager', '/']) expect(isManagePath(p)).toBe(false);
  });
});

describe("Alex's admin", () => {
  const app = 'https://app.bohdiai.com';
  it('counts as the signed-in backend, so it keeps the auto sign-out and the app host', () => {
    for (const p of ['/founder', '/founder/messages']) {
      expect(isManagePath(p)).toBe(true);
      expect(isBackendPath(p)).toBe(true);
    }
    expect(isBackendPath('/founders')).toBe(false);
    expect(backendRedirect('rustic-flags.bohdiai.com', new URL('https://rustic-flags.bohdiai.com/founder'), app)).toBe('https://app.bohdiai.com/founder');
  });
  it('is reached from admin.bohdiai.com, and only from there', () => {
    expect(founderEntryRedirect('admin.bohdiai.com', app)).toBe('https://app.bohdiai.com/founder');
    expect(founderEntryRedirect('admin.localhost:3000', app)).toBe('http://app.localhost:3000/founder');
    expect(founderEntryRedirect('app.bohdiai.com', app)).toBeNull();
    expect(founderEntryRedirect('bohdiai.com', app)).toBeNull();
  });
});

describe('isBackendPath', () => {
  it.each(['/signin', '/forgot-password', '/auth/confirm', '/auth/continue', '/auth/error', '/manage', '/manage/set-password', '/welcome'])('%s is a backend path', (p) => {
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

describe('ownerEntryRedirect', () => {
  const url = (s: string) => new URL(s);
  const APP = 'https://app.bohdiai.com';
  it('sends /admin on a shop to the backend', () => {
    expect(ownerEntryRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/admin'), APP, true)).toBe('https://app.bohdiai.com/manage');
    expect(ownerEntryRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/admin/'), APP, true)).toBe('https://app.bohdiai.com/manage');
  });
  it('works on a local shop host', () => {
    expect(ownerEntryRedirect('classic-loafs.localhost:3000', url('http://classic-loafs.localhost:3000/admin'), APP, true)).toBe('http://app.localhost:3000/manage');
  });
  it('leaves other paths alone', () => {
    expect(ownerEntryRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/administrator'), APP, true)).toBeNull();
    expect(ownerEntryRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/shop'), APP, true)).toBeNull();
  });
  it('leaves non-shop hosts alone', () => {
    expect(ownerEntryRedirect('bohdiai.com', url('https://bohdiai.com/admin'), APP, false)).toBeNull();
  });
});
