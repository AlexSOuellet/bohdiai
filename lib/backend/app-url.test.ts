import { describe, it, expect } from 'vitest';
import { appOrigin } from './app-url';

describe('appOrigin', () => {
  it('puts app. in front of the site host', () => {
    expect(appOrigin('https://bohdiai.com')).toBe('https://app.bohdiai.com');
    expect(appOrigin('https://bohdiai.com/')).toBe('https://app.bohdiai.com');
  });
  it('keeps the port and scheme for local dev', () => {
    expect(appOrigin('http://localhost:3000')).toBe('http://app.localhost:3000');
  });
  it('does not double the prefix', () => {
    expect(appOrigin('https://app.bohdiai.com')).toBe('https://app.bohdiai.com');
  });
});
