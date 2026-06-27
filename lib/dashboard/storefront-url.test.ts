import { describe, it, expect } from 'vitest';
import { storefrontOrigin, previewUrl } from './storefront-url';

describe('storefrontOrigin', () => {
  it('builds an https apex origin from the production app host', () => {
    expect(storefrontOrigin('soul-splatter', 'app.bohdiai.com')).toBe(
      'https://soul-splatter.bohdiai.com',
    );
  });

  it('builds an http localhost origin with the dev port', () => {
    expect(storefrontOrigin('ember', 'localhost:3000')).toBe('http://ember.localhost:3000');
    expect(storefrontOrigin('ember', 'app.localhost:3000')).toBe('http://ember.localhost:3000');
  });

  it('handles a preview-deploy host by stripping the leading app label', () => {
    expect(storefrontOrigin('myshop', 'app.bohdiai.dev')).toBe('https://myshop.bohdiai.dev');
  });

  it('uses an apex host as-is when there is no leading app label', () => {
    expect(storefrontOrigin('myshop', 'bohdiai.com')).toBe('https://myshop.bohdiai.com');
  });

  it('drops the port suffix for a bare localhost host', () => {
    expect(storefrontOrigin('ember', 'localhost')).toBe('http://ember.localhost');
  });

  it('treats a null dashboard host as empty rather than throwing', () => {
    expect(storefrontOrigin('x', null)).toBe('https://x.');
  });
});

describe('previewUrl', () => {
  it('appends the skin override to the home route', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio')).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio',
    );
  });
});
