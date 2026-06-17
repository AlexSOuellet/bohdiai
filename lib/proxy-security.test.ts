import { describe, it, expect } from 'vitest';
import { sanitizeTenantHeaders, isUnreachableStorefrontPath } from './proxy-security';

describe('sanitizeTenantHeaders', () => {
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
