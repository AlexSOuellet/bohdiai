import { describe, it, expect, vi } from 'vitest';
import { countedPath, pageViewOf, recordPageView, sourceOf, type PageViewRequest } from './page-view';

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

function req(over: { method?: string; path?: string; search?: string; headers?: Record<string, string> } = {}): PageViewRequest {
  const headers = new Headers({ 'user-agent': BROWSER, accept: 'text/html,application/xhtml+xml', ...over.headers });
  return { method: over.method ?? 'GET', host: 'lena.bohdiai.com', path: over.path ?? '/', search: new URLSearchParams(over.search ?? ''), headers };
}

describe('sourceOf', () => {
  it('names where an arrival came from', () => {
    expect(sourceOf(null, false)).toBe('direct');
    expect(sourceOf(null, true)).toBe('qr');
    expect(sourceOf('www.google.com', false)).toBe('search');
    expect(sourceOf('duckduckgo.com', false)).toBe('search');
    expect(sourceOf('l.facebook.com', false)).toBe('facebook');
    expect(sourceOf('m.facebook.com', false)).toBe('facebook');
    expect(sourceOf('www.instagram.com', false)).toBe('instagram');
    expect(sourceOf('pin.it', false)).toBe('pinterest');
    expect(sourceOf('www.tiktok.com', false)).toBe('tiktok');
    expect(sourceOf('www.etsy.com', false)).toBe('etsy');
    expect(sourceOf('makers.bohdiai.com', false)).toBe('bohdiai');
    expect(sourceOf('WWW.Craftblog.example', false)).toBe('craftblog.example');
  });
  it('a QR flag wins over the referer', () => {
    expect(sourceOf('www.google.com', true)).toBe('qr');
  });
});

describe('countedPath', () => {
  it('drops a trailing slash and keeps the home page as /', () => {
    expect(countedPath('/')).toBe('/');
    expect(countedPath('/shop/')).toBe('/shop');
    expect(countedPath('//')).toBe('/');
    expect(countedPath(`/${'a'.repeat(300)}`)).toHaveLength(200);
  });
});

describe('pageViewOf', () => {
  it('counts a full page load from outside as a visit', () => {
    expect(pageViewOf(req({ headers: { referer: 'https://www.google.com/' } }))).toEqual({ path: '/', visit: true, source: 'search' });
  });
  it('counts a typed address or a QR code as a visit', () => {
    expect(pageViewOf(req({ path: '/listings/teapot' }))).toEqual({ path: '/listings/teapot', visit: true, source: 'direct' });
    expect(pageViewOf(req({ search: 'qr=1' }))).toEqual({ path: '/', visit: true, source: 'qr' });
  });
  it('counts a page reached from inside the site as a page view only', () => {
    expect(pageViewOf(req({ path: '/shop', headers: { referer: 'https://lena.bohdiai.com/' } }))).toEqual({ path: '/shop', visit: false, source: '' });
  });
  it('counts a click inside the site (a Next navigation) as a page view only', () => {
    expect(pageViewOf(req({ path: '/about', headers: { accept: '*/*', rsc: '1', referer: 'https://www.google.com/' } }))).toEqual({ path: '/about', visit: false, source: '' });
  });
  it('ignores a referer that is not an address', () => {
    expect(pageViewOf(req({ headers: { referer: 'not a url' } }))?.source).toBe('direct');
    expect(pageViewOf(req({ headers: { referer: '' } }))?.source).toBe('direct');
  });
  it('never counts prefetches, posts, API calls, files, data requests or bots', () => {
    expect(pageViewOf(req({ headers: { rsc: '1', accept: '*/*', 'next-router-prefetch': '1' } }))).toBeNull();
    expect(pageViewOf(req({ headers: { purpose: 'prefetch' } }))).toBeNull();
    expect(pageViewOf(req({ headers: { 'sec-purpose': 'prefetch;prerender' } }))).toBeNull();
    expect(pageViewOf(req({ method: 'POST' }))).toBeNull();
    expect(pageViewOf(req({ path: '/api/contact' }))).toBeNull();
    expect(pageViewOf(req({ path: '/_next/data/x' }))).toBeNull();
    expect(pageViewOf(req({ path: '/robots.txt' }))).toBeNull();
    expect(pageViewOf(req({ headers: { accept: 'application/json' } }))).toBeNull();
    expect(pageViewOf(req({ headers: { 'user-agent': 'Googlebot/2.1' } }))).toBeNull();
    expect(pageViewOf(req({ headers: { 'user-agent': 'facebookexternalhit/1.1' } }))).toBeNull();
    expect(pageViewOf(req({ headers: { 'user-agent': '' } }))).toBeNull();
  });
});

describe('recordPageView', () => {
  it('writes one data point: the site, the page, where from, and whether a visit', () => {
    const writeDataPoint = vi.fn();
    recordPageView({ writeDataPoint }, 't1', { path: '/', visit: true, source: 'qr' });
    expect(writeDataPoint).toHaveBeenCalledWith({ indexes: ['t1'], blobs: ['t1', '/', 'qr'], doubles: [1] });
    recordPageView({ writeDataPoint }, 't1', { path: '/shop', visit: false, source: '' });
    expect(writeDataPoint).toHaveBeenLastCalledWith({ indexes: ['t1'], blobs: ['t1', '/shop', ''], doubles: [0] });
  });
  it('does nothing without the dataset, and never throws when writing fails', () => {
    expect(() => recordPageView(undefined, 't1', { path: '/', visit: true, source: 'direct' })).not.toThrow();
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = { writeDataPoint: () => { throw new Error('down'); } };
    expect(() => recordPageView(broken, 't1', { path: '/', visit: true, source: 'direct' })).not.toThrow();
    const odd = { writeDataPoint: () => { throw 'odd'; } };
    expect(() => recordPageView(odd, 't1', { path: '/', visit: true, source: 'direct' })).not.toThrow();
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
});
