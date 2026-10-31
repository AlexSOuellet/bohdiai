import { describe, it, expect } from 'vitest';
import { freeSubdomain, subdomainFrom } from './subdomain';

describe('subdomainFrom', () => {
  it('makes a web address from the business name', () => {
    expect(subdomainFrom('Rustic Charm & More')).toBe('rustic-charm-and-more');
    expect(subdomainFrom('Renée’s Pottery')).toBe('renees-pottery');
    expect(subdomainFrom("  Juniper Hollow Candles!! ")).toBe('juniper-hollow-candles');
  });

  it('keeps it short enough for a web address', () => {
    const made = subdomainFrom('A really very extremely long business name that goes on and on forever');
    expect(made.length).toBeLessThanOrEqual(40);
    expect(made.endsWith('-')).toBe(false);
  });

  it('has a fallback for a name with no letters or numbers', () => {
    expect(subdomainFrom('★★★')).toBe('shop');
  });
});

describe('freeSubdomain', () => {
  it('adds a number when the name is taken', async () => {
    const taken = new Set(['saltmarsh', 'saltmarsh-2']);
    expect(await freeSubdomain('Saltmarsh', async (s) => taken.has(s))).toBe('saltmarsh-3');
  });

  it('never gives one of BohdiAI’s own hosts', async () => {
    expect(await freeSubdomain('Makers', async () => false)).toBe('makers-2');
    expect(await freeSubdomain('App', async () => false)).toBe('app-2');
  });

  it('gives up rather than looping forever', async () => {
    await expect(freeSubdomain('Busy', async () => true)).rejects.toThrow(/No free web address/);
  });
});
