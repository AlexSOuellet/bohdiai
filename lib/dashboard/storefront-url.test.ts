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

  it('appends an encoded texture-url override when given one (blend path kept for a future library)', () => {
    expect(
      previewUrl('https://ember.bohdiai.com', 'main-street-studio', '/textures/lib/example.png'),
    ).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewTexture=%2Ftextures%2Flib%2Fexample.png',
    );
  });

  it('appends the opacity override at two decimals when a real texture is set', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio', '/t.png', 0.35)).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewTexture=%2Ft.png&previewTextureOpacity=0.35',
    );
  });

  it('carries the previewed feeling as previewMood, right after the look', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio', undefined, undefined, 'modern')).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewMood=modern',
    );
  });

  it('orders previewMood before the texture params', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio', 'default', 0.4, 'cozy')).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewMood=cozy&previewTexture=default&previewTextureOpacity=0.40',
    );
  });

  it('carries the "none" sentinel through as previewTexture=none', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio', 'none')).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewTexture=none',
    );
  });

  it('appends opacity independently of the texture url (the caller pairs them)', () => {
    expect(previewUrl('https://ember.bohdiai.com', 'main-street-studio', undefined, 0.4)).toBe(
      'https://ember.bohdiai.com/?previewLook=main-street-studio&previewTextureOpacity=0.40',
    );
  });
});
