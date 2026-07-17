import { describe, it, expect } from 'vitest';
import { isLookDirty, type LookSelection } from './look-dirty';

const base: LookSelection = {
  skin: 'main-street-ember',
  feeling: 'cozy',
  texture: { mode: 'default', opacity: null },
};

describe('isLookDirty', () => {
  it('is not dirty when nothing changed', () => {
    expect(isLookDirty(base, base)).toBe(false);
  });

  it('is dirty when the skin changed', () => {
    expect(isLookDirty({ ...base, skin: 'main-street-studio' }, base)).toBe(true);
  });

  it('is dirty when the feeling changed even though the skin is shared', () => {
    // Ember belongs to both Cozy and Rustic — the exact case where the button used
    // to stay disabled because only the skin was checked.
    expect(isLookDirty({ ...base, feeling: 'rustic' }, base)).toBe(true);
  });

  it('is dirty when the texture mode changed', () => {
    expect(isLookDirty({ ...base, texture: { mode: 'none', opacity: null } }, base)).toBe(true);
  });

  it('is dirty when only the texture opacity changed', () => {
    expect(isLookDirty({ ...base, texture: { mode: 'default', opacity: 0.4 } }, base)).toBe(true);
  });
});
