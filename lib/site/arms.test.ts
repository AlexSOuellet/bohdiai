import { describe, it, expect } from 'vitest';
import { armForHost, armRoute, siteOrigin } from './arms';
import { isReservedSubdomain } from '@/lib/reserved-subdomains';

describe('the marketing arms', () => {
  it('knows which arm a host serves, live and on this computer', () => {
    expect(armForHost('makers.bohdiai.com')).toBe('makers');
    expect(armForHost('service.bohdiai.com')).toBe('service');
    expect(armForHost('makers.localhost:3000')).toBe('makers');
    expect(armForHost('bohdiai.com')).toBeNull();
    expect(armForHost('classic-loafs.bohdiai.com')).toBeNull();
    expect(armForHost('makers.example.com')).toBeNull();
  });

  it('shows the arm’s page at its home and folds the page’s own path back to it', () => {
    expect(armRoute('makers.bohdiai.com', new URL('https://makers.bohdiai.com/'))).toEqual({ kind: 'rewrite', pathname: '/makers' });
    expect(armRoute('service.bohdiai.com', new URL('https://service.bohdiai.com/'))).toEqual({ kind: 'rewrite', pathname: '/contractors' });
    expect(armRoute('makers.bohdiai.com', new URL('https://makers.bohdiai.com/makers?plan=x'))).toEqual({ kind: 'redirect', url: 'https://makers.bohdiai.com/?plan=x' });
  });

  it('leaves every other path on an arm alone (the form, the looks, the questions)', () => {
    for (const p of ['/start', '/looks', '/faq', '/privacy', '/api/contact']) {
      expect(armRoute('makers.bohdiai.com', new URL(`https://makers.bohdiai.com${p}`))).toBeNull();
    }
  });

  it('moves the parent’s old /makers and /contractors pages to their arm, keeping the query', () => {
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/makers'))).toEqual({ kind: 'redirect', url: 'https://makers.bohdiai.com/' });
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/contractors?plan=contractor-full'))).toEqual({
      kind: 'redirect',
      url: 'https://service.bohdiai.com/?plan=contractor-full',
    });
    expect(armRoute('localhost:3000', new URL('http://localhost:3000/makers'))).toEqual({ kind: 'redirect', url: 'http://makers.localhost:3000/' });
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/'))).toBeNull();
  });

  it('sends the retired samples page to the makers arm’s looks page', () => {
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/samples'))).toEqual({ kind: 'redirect', url: 'https://makers.bohdiai.com/looks' });
    expect(armRoute('service.bohdiai.com', new URL('https://service.bohdiai.com/samples'))).toEqual({ kind: 'redirect', url: 'https://makers.bohdiai.com/looks' });
    expect(armRoute('localhost:3000', new URL('http://localhost:3000/samples'))).toEqual({ kind: 'redirect', url: 'http://makers.localhost:3000/looks' });
    expect(armRoute('classic-loafs.bohdiai.com', new URL('https://classic-loafs.bohdiai.com/samples'))).toBeNull();
  });

  it('never routes a shop', () => {
    expect(armRoute('classic-loafs.bohdiai.com', new URL('https://classic-loafs.bohdiai.com/makers'))).toBeNull();
  });

  it('links to the live addresses, or to this computer when the visitor is on it', () => {
    expect(siteOrigin('makers')).toBe('https://makers.bohdiai.com');
    expect(siteOrigin('parent')).toBe('https://bohdiai.com');
    expect(siteOrigin('service', { protocol: 'https:', hostname: 'bohdiai.com', port: '' })).toBe('https://service.bohdiai.com');
    expect(siteOrigin('makers', { protocol: 'http:', hostname: 'localhost', port: '3000' })).toBe('http://makers.localhost:3000');
    expect(siteOrigin('parent', { protocol: 'http:', hostname: 'makers.localhost', port: '3000' })).toBe('http://localhost:3000');
  });

  it('reserves both arm names so no shop can take them', () => {
    expect(isReservedSubdomain('makers')).toBe(true);
    expect(isReservedSubdomain('Service')).toBe(true);
    expect(isReservedSubdomain('classic-loafs')).toBe(false);
  });
});
