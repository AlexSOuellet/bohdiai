import { describe, it, expect } from 'vitest';
import { previewCode, isPreviewCode, previewLink, draftGate, PREVIEW_PARAM } from './draft-preview';

const SECRET = 'x'.repeat(40);

describe('draft preview codes', () => {
  it('gives each site its own stable code', async () => {
    const a = await previewCode(SECRET, 'mazzone-home-improvement');
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(await previewCode(SECRET, 'mazzone-home-improvement')).toBe(a);
    expect(await previewCode(SECRET, 'MAZZONE-home-improvement')).toBe(a);
    expect(await previewCode(SECRET, 'cut-pro-lawncare')).not.toBe(a);
    expect(await previewCode('y'.repeat(40), 'mazzone-home-improvement')).not.toBe(a);
  });

  it('accepts only the right code for the right site', async () => {
    const code = await previewCode(SECRET, 'mazzone-home-improvement');
    expect(await isPreviewCode(SECRET, 'mazzone-home-improvement', code)).toBe(true);
    expect(await isPreviewCode(SECRET, 'cut-pro-lawncare', code)).toBe(false);
    expect(await isPreviewCode(SECRET, 'mazzone-home-improvement', `${code}x`)).toBe(false);
    expect(await isPreviewCode(SECRET, 'mazzone-home-improvement', '')).toBe(false);
    expect(await isPreviewCode(SECRET, 'mazzone-home-improvement', undefined)).toBe(false);
  });

  it('fails closed when the secret is missing or short', async () => {
    expect(await previewCode(undefined, 'a')).toBeNull();
    expect(await previewCode('short', 'a')).toBeNull();
    const code = await previewCode(SECRET, 'a');
    expect(await isPreviewCode(undefined, 'a', code)).toBe(false);
  });

  it('builds the link on the site’s own address', () => {
    expect(previewLink('mazzone-home-improvement', 'abc')).toBe(`https://mazzone-home-improvement.bohdiai.com/?${PREVIEW_PARAM}=abc`);
  });
});

describe('draftGate', () => {
  it('lets the link in first, then the remembered cookie, and nobody else', async () => {
    const code = await previewCode(SECRET, 'joe');
    const other = await previewCode(SECRET, 'someone-else');
    expect(await draftGate(SECRET, 'joe', code, undefined)).toBe('link');
    expect(await draftGate(SECRET, 'joe', code, code ?? undefined)).toBe('link');
    expect(await draftGate(SECRET, 'joe', null, code ?? undefined)).toBe('cookie');
    expect(await draftGate(SECRET, 'joe', 'wrong', code ?? undefined)).toBe('cookie');
    expect(await draftGate(SECRET, 'joe', null, undefined)).toBe('deny');
    expect(await draftGate(SECRET, 'joe', other, other ?? undefined)).toBe('deny');
    expect(await draftGate(undefined, 'joe', code, code ?? undefined)).toBe('deny');
  });
});
