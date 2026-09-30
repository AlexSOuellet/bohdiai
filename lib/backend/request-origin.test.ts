import { describe, it, expect } from 'vitest';
import { requestOrigin, isSameOriginPost } from './request-origin';

const req = (url: string, headers: Record<string, string>) => new Request(url, { method: 'POST', headers });

describe('requestOrigin', () => {
  it('uses the Host header, not the server’s own address', () => {
    expect(requestOrigin(req('http://localhost:3000/auth/confirm', { host: 'app.localhost:3000' }))).toBe('http://app.localhost:3000');
  });
  it('honours the forwarded scheme', () => {
    expect(requestOrigin(req('http://internal/auth/confirm', { host: 'app.bohdiai.com', 'x-forwarded-proto': 'https' }))).toBe('https://app.bohdiai.com');
  });
  it('ignores a junk forwarded scheme', () => {
    expect(requestOrigin(req('https://app.bohdiai.com/x', { host: 'app.bohdiai.com', 'x-forwarded-proto': 'javascript' }))).toBe('https://app.bohdiai.com');
  });
});

describe('isSameOriginPost', () => {
  it('accepts a post from the page the visitor is on', () => {
    expect(isSameOriginPost(req('http://localhost:3000/auth/confirm', { host: 'app.localhost:3000', origin: 'http://app.localhost:3000' }))).toBe(true);
  });
  it('refuses a post from another site', () => {
    expect(isSameOriginPost(req('https://app.bohdiai.com/auth/confirm', { host: 'app.bohdiai.com', origin: 'https://evil.example' }))).toBe(false);
  });
  it('refuses a null origin', () => {
    expect(isSameOriginPost(req('https://app.bohdiai.com/auth/confirm', { host: 'app.bohdiai.com', origin: 'null' }))).toBe(false);
  });
  it('allows a post with no Origin header', () => {
    expect(isSameOriginPost(req('https://app.bohdiai.com/auth/confirm', { host: 'app.bohdiai.com' }))).toBe(true);
  });
});
