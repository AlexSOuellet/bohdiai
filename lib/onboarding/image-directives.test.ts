import { describe, it, expect } from 'vitest';
import { withImageDirectives } from './image-directives';

describe('withImageDirectives', () => {
  it('frames a person gender-neutrally, never by name', () => {
    const out = withImageDirectives('at the workbench', { isPerson: true, makerName: 'Wally' });
    expect(out.toLowerCase()).not.toContain('a woman');
    expect(out.toLowerCase()).not.toContain('a man');
    expect(out.toLowerCase()).not.toContain('she');
    expect(out.toLowerCase()).not.toContain('his');
    expect(out).toContain('at the workbench');
    expect(out.toLowerCase()).toContain('photorealistic');
  });

  it('leaves a non-person prompt photorealistic', () => {
    const out = withImageDirectives('a walnut slab', { isPerson: false });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out).toContain('a walnut slab');
  });

  it('steers realism with positive cues, never a counterproductive negation', () => {
    const out = withImageDirectives('a leather belt on oak', { isPerson: false }).toLowerCase();
    expect(out).not.toContain('no illustration');
    expect(out).not.toContain('3d render');
    expect(out).toContain('camera');
  });
});
