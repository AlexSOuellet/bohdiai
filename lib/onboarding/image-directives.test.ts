import { describe, it, expect } from 'vitest';
import { withImageDirectives } from './image-directives';

describe('withImageDirectives', () => {
  it('appends a photorealism directive to every prompt', () => {
    const out = withImageDirectives('a leather belt on oak', { isPerson: false });
    expect(out).toMatch(/a leather belt on oak/);
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toContain('a woman');
    expect(out.toLowerCase()).not.toContain('a man');
  });

  it('adds a female phrase for a person image when the maker name reads female', () => {
    const out = withImageDirectives('portrait at the bench', { isPerson: true, makerName: 'Abigail Stone' });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).toContain('a woman');
  });

  it('adds a male phrase for a person image when the maker name reads male', () => {
    const out = withImageDirectives('portrait at the bench', { isPerson: true, makerName: 'Samuel Reed' });
    expect(out.toLowerCase()).toContain('a man');
    expect(out.toLowerCase()).not.toContain('a woman');
  });

  it('still renders a person directive with no name (helper defaults), never crashes', () => {
    const out = withImageDirectives('portrait', { isPerson: true });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.length).toBeGreaterThan('portrait'.length);
  });
});
