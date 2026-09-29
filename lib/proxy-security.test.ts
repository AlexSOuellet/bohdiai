import { describe, it, expect } from 'vitest';
import { sanitizeTenantHeaders, isUnreachableStorefrontPath, requestHost, isAppHost, isAppSurfacePath, isDormantPath, tenantLookupUrl, apexRedirect } from './proxy-security';

describe('requestHost', () => {
  it('resolves from the real Host header', () => {
    expect(requestHost(new Headers({ host: 'cut-pro-lawncare.bohdiai.com' }))).toBe('cut-pro-lawncare.bohdiai.com');
  });

  it('ignores x-bohdi-shop — a visitor could write it to pose as any shop', () => {
    const headers = new Headers({ host: 'bohdiai.com', 'x-bohdi-shop': 'cut-pro-lawncare.bohdiai.com' });
    expect(requestHost(headers)).toBe('bohdiai.com');
  });

  it('returns an empty string when there is no Host header', () => {
    expect(requestHost(new Headers())).toBe('');
  });
});

describe('sanitizeTenantHeaders', () => {
  it('drops the retired x-bohdi-shop header so nothing downstream can read it', () => {
    const headers = new Headers({ 'x-bohdi-shop': 'someone-else.bohdiai.com' });
    sanitizeTenantHeaders(headers);
    expect(headers.get('x-bohdi-shop')).toBeNull();
  });

  it('drops a forged x-tenant-id arriving on an inbound request', () => {
    const headers = new Headers({ 'x-tenant-id': 'forged-tenant-uuid' });
    sanitizeTenantHeaders(headers);
    expect(headers.get('x-tenant-id')).toBeNull();
  });

  it('drops a forged x-tenant-subdomain arriving on an inbound request', () => {
    const headers = new Headers({ 'x-tenant-subdomain': 'someone-else' });
    sanitizeTenantHeaders(headers);
    expect(headers.get('x-tenant-subdomain')).toBeNull();
  });

  it('drops both headers when both are forged', () => {
    const headers = new Headers({
      'x-tenant-id': 'forged-uuid',
      'x-tenant-subdomain': 'forged-sub',
    });
    sanitizeTenantHeaders(headers);
    expect(headers.get('x-tenant-id')).toBeNull();
    expect(headers.get('x-tenant-subdomain')).toBeNull();
  });

  it('leaves unrelated headers intact', () => {
    const headers = new Headers({
      'x-tenant-id': 'forged',
      'user-agent': 'test-agent',
      'accept-language': 'en',
    });
    sanitizeTenantHeaders(headers);
    expect(headers.get('user-agent')).toBe('test-agent');
    expect(headers.get('accept-language')).toBe('en');
  });

  it('is a no-op when no forgeable headers are present', () => {
    const headers = new Headers({ 'user-agent': 'test-agent' });
    sanitizeTenantHeaders(headers);
    expect(headers.get('user-agent')).toBe('test-agent');
  });

  it('lets the proxy still set the headers after sanitizing (round-trip)', () => {
    const headers = new Headers({ 'x-tenant-id': 'forged' });
    sanitizeTenantHeaders(headers);
    headers.set('x-tenant-id', 'real-tenant-uuid');
    expect(headers.get('x-tenant-id')).toBe('real-tenant-uuid');
  });
});

describe('isUnreachableStorefrontPath', () => {
  it('returns true for /storefront on the apex (no subdomain)', () => {
    expect(isUnreachableStorefrontPath('/storefront', null)).toBe(true);
  });

  it('returns true for nested /storefront/* on the apex', () => {
    expect(isUnreachableStorefrontPath('/storefront/shop', null)).toBe(true);
    expect(isUnreachableStorefrontPath('/storefront/listings/foo', null)).toBe(true);
  });

  it('returns false for /storefront on a resolved subdomain', () => {
    expect(isUnreachableStorefrontPath('/storefront/shop', 'myshop')).toBe(false);
  });

  it('returns false for non-storefront paths on the apex', () => {
    expect(isUnreachableStorefrontPath('/', null)).toBe(false);
    expect(isUnreachableStorefrontPath('/about', null)).toBe(false);
    expect(isUnreachableStorefrontPath('/api/contact', null)).toBe(false);
  });

  it('returns false for paths that merely contain "storefront" but do not start with /storefront', () => {
    expect(isUnreachableStorefrontPath('/blog/storefront-tips', null)).toBe(false);
  });
});

describe('isAppHost', () => {
  it('is true for the production dashboard host', () => {
    expect(isAppHost('app.bohdiai.com')).toBe(true);
  });

  it('is true for the dev dashboard host with a port', () => {
    expect(isAppHost('app.localhost:3000')).toBe(true);
  });

  it('is false for the marketing apex and storefront subdomains', () => {
    expect(isAppHost('bohdiai.com')).toBe(false);
    expect(isAppHost('www.bohdiai.com')).toBe(false);
    expect(isAppHost('myshop.bohdiai.com')).toBe(false);
    expect(isAppHost('admin.bohdiai.com')).toBe(false);
  });

  it('is false for bare localhost and null', () => {
    expect(isAppHost('localhost:3000')).toBe(false);
    expect(isAppHost(null)).toBe(false);
  });
});

describe('isAppSurfacePath', () => {
  it('keeps auth and dashboard on the app even on a shop subdomain', () => {
    expect(isAppSurfacePath('/signin')).toBe(true);
    expect(isAppSurfacePath('/signin/reset')).toBe(true);
    expect(isAppSurfacePath('/auth/callback')).toBe(true);
    expect(isAppSurfacePath('/dashboard')).toBe(true);
    expect(isAppSurfacePath('/dashboard/website')).toBe(true);
    // the Make It Yours walk lives outside /dashboard but is still an app surface
    expect(isAppSurfacePath('/make-it-yours')).toBe(true);
  });

  it('lets the storefront paint everything else', () => {
    expect(isAppSurfacePath('/')).toBe(false);
    expect(isAppSurfacePath('/shop')).toBe(false);
    expect(isAppSurfacePath('/about')).toBe(false);
    // a product slug that merely contains the word is still a storefront path
    expect(isAppSurfacePath('/listings/signing-kit')).toBe(false);
  });
});

describe('isDormantPath', () => {
  it('switches off the automated builder and everything behind a maker login', () => {
    for (const path of [
      '/onboarding',
      '/api/onboarding/start',
      '/api/onboarding/builds/0b1c',
      '/make-it-yours',
      '/dashboard',
      '/dashboard/website',
      '/signin',
      '/auth/callback',
      '/auth/error',
      '/api/library/ingest',
      '/archetype-test/main-street',
      '/archetype-test/main-street/shop',
    ]) {
      expect(isDormantPath(path), path).toBe(true);
    }
  });

  it('leaves the live sites, their forms, and the marketing site running', () => {
    for (const path of [
      '/',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/api/estimate',
      '/api/contact',
      '/api/inquiry',
      '/api/notify-interest',
      '/opengraph-image',
      '/storefront',
      '/storefront/shop',
    ]) {
      expect(isDormantPath(path), path).toBe(false);
    }
  });

  it('matches whole path segments, so a shop page that merely starts with the word stays live', () => {
    expect(isDormantPath('/dashboards-and-desks')).toBe(false);
    expect(isDormantPath('/onboarding-kit')).toBe(false);
    expect(isDormantPath('/signing-kit')).toBe(false);
    expect(isDormantPath('/authentic-oak')).toBe(false);
  });
});

describe('tenantLookupUrl', () => {
  const url = new URL(tenantLookupUrl('https://db.example.co', 'Cut-Pro-Lawncare'));

  it('asks only for active shops that have not been deleted', () => {
    expect(url.searchParams.get('status')).toBe('eq.active');
    expect(url.searchParams.get('deleted_at')).toBe('is.null');
  });

  it('matches the subdomain lowercased, one row, id only', () => {
    expect(url.pathname).toBe('/rest/v1/tenants');
    expect(url.searchParams.get('subdomain')).toBe('eq.cut-pro-lawncare');
    expect(url.searchParams.get('select')).toBe('id');
    expect(url.searchParams.get('limit')).toBe('1');
  });

  it('encodes the subdomain so it cannot add its own filters', () => {
    const sneaky = new URL(tenantLookupUrl('https://db.example.co', 'x&status=eq.suspended'));
    expect(sneaky.searchParams.getAll('status')).toEqual(['eq.active']);
  });
});

describe('apexRedirect', () => {
  it('sends www to the bare domain, keeping the path and query', () => {
    expect(apexRedirect('www.bohdiai.com', new URL('https://www.bohdiai.com/privacy?x=1'))).toBe('https://bohdiai.com/privacy?x=1');
  });

  it('leaves the bare domain, shops, and local dev alone', () => {
    expect(apexRedirect('bohdiai.com', new URL('https://bohdiai.com/'))).toBeNull();
    expect(apexRedirect('cut-pro-lawncare.bohdiai.com', new URL('https://cut-pro-lawncare.bohdiai.com/'))).toBeNull();
    expect(apexRedirect('localhost:3000', new URL('http://localhost:3000/'))).toBeNull();
  });
});
