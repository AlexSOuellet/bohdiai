import { describe, it, expect } from 'vitest';
import { pickSite, SITE_COOKIE } from './current-site';

const shops = [
  { tenantId: 'a', subdomain: 'alpha', businessName: 'Alpha' },
  { tenantId: 'b', subdomain: 'beta', businessName: 'Beta' },
];

describe('pickSite', () => {
  it('uses the cookie when it names a site the person administers', () => {
    expect(pickSite(shops, 'b')?.tenantId).toBe('b');
  });
  it('ignores a cookie naming someone else’s site and falls back to the first', () => {
    expect(pickSite(shops, 'zzz')?.tenantId).toBe('a');
  });
  it('falls back to the first site with no cookie', () => {
    expect(pickSite(shops, null)?.tenantId).toBe('a');
  });
  it('is null for someone who administers no site', () => {
    expect(pickSite([], 'a')).toBeNull();
  });
  it('names its cookie', () => {
    expect(SITE_COOKIE).toBe('bohdi_site');
  });
});
