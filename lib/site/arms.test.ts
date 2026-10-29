import { describe, it, expect } from 'vitest';
import { armForHost, armRoute } from './arms';
import { isReservedSubdomain } from '@/lib/reserved-subdomains';

describe('bohdiai.com as the maker site (Session 117)', () => {
  it('knows the old arm hosts, live and on this computer', () => {
    expect(armForHost('makers.bohdiai.com')).toBe('makers');
    expect(armForHost('service.bohdiai.com')).toBe('service');
    expect(armForHost('makers.localhost:3000')).toBe('makers');
    expect(armForHost('bohdiai.com')).toBeNull();
    expect(armForHost('classic-loafs.bohdiai.com')).toBeNull();
    expect(armForHost('makers.example.com')).toBeNull();
  });

  it('forwards both arms’ homes to bohdiai.com', () => {
    expect(armRoute('makers.bohdiai.com', new URL('https://makers.bohdiai.com/'))).toEqual({ kind: 'redirect', url: 'https://bohdiai.com/' });
    expect(armRoute('service.bohdiai.com', new URL('https://service.bohdiai.com/'))).toEqual({ kind: 'redirect', url: 'https://bohdiai.com/' });
    expect(armRoute('makers.localhost:3000', new URL('http://makers.localhost:3000/'))).toEqual({ kind: 'redirect', url: 'http://localhost:3000/' });
  });

  it('keeps the path and the query when an arm forwards (the form, the looks, the questions)', () => {
    for (const p of ['/start', '/looks', '/faq', '/privacy']) {
      expect(armRoute('makers.bohdiai.com', new URL(`https://makers.bohdiai.com${p}`))).toEqual({ kind: 'redirect', url: `https://bohdiai.com${p}` });
    }
    expect(armRoute('makers.bohdiai.com', new URL('https://makers.bohdiai.com/start?plan=maker-lite&billing=yearly'))).toEqual({
      kind: 'redirect',
      url: 'https://bohdiai.com/start?plan=maker-lite&billing=yearly',
    });
    expect(armRoute('service.bohdiai.com', new URL('https://service.bohdiai.com/contractors?plan=contractor-full'))).toEqual({
      kind: 'redirect',
      url: 'https://bohdiai.com/?plan=contractor-full',
    });
  });

  it('sends the old /makers and /contractors pages home, so the service page is switched off', () => {
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/makers'))).toEqual({ kind: 'redirect', url: 'https://bohdiai.com/' });
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/contractors?plan=contractor-full'))).toEqual({
      kind: 'redirect',
      url: 'https://bohdiai.com/?plan=contractor-full',
    });
    expect(armRoute('localhost:3000', new URL('http://localhost:3000/makers'))).toEqual({ kind: 'redirect', url: 'http://localhost:3000/' });
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/'))).toBeNull();
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/start'))).toBeNull();
  });

  it('sends the retired samples page to the looks', () => {
    expect(armRoute('bohdiai.com', new URL('https://bohdiai.com/samples'))).toEqual({ kind: 'redirect', url: 'https://bohdiai.com/looks' });
    expect(armRoute('service.bohdiai.com', new URL('https://service.bohdiai.com/samples'))).toEqual({ kind: 'redirect', url: 'https://bohdiai.com/looks' });
    expect(armRoute('localhost:3000', new URL('http://localhost:3000/samples'))).toEqual({ kind: 'redirect', url: 'http://localhost:3000/looks' });
  });

  it('never routes a shop', () => {
    expect(armRoute('classic-loafs.bohdiai.com', new URL('https://classic-loafs.bohdiai.com/makers'))).toBeNull();
    expect(armRoute('classic-loafs.bohdiai.com', new URL('https://classic-loafs.bohdiai.com/samples'))).toBeNull();
  });

  it('keeps both arm names reserved so no shop can take them', () => {
    expect(isReservedSubdomain('makers')).toBe(true);
    expect(isReservedSubdomain('Service')).toBe(true);
    expect(isReservedSubdomain('classic-loafs')).toBe(false);
  });
});
