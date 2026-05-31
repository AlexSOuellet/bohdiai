import { describe, expect, test } from 'vitest';
import { roleClass, mobileRoleClass, desktopMdClass } from './Text';

describe('text role classes — script-aware eyebrow', () => {
  test('a non-script eyebrow keeps uppercase and wide tracking (unchanged look)', () => {
    const cls = roleClass('eyebrow', false);
    expect(cls).toContain('uppercase');
    expect(cls).toContain('tracking-[0.2em]');
  });

  test('a script eyebrow drops uppercase and wide tracking so the script can flow', () => {
    const cls = roleClass('eyebrow', true);
    expect(cls).not.toContain('uppercase');
    expect(cls).not.toContain('tracking-[0.2em]');
  });

  test('the mobile eyebrow class also drops uppercase for a script font', () => {
    expect(mobileRoleClass('eyebrow', false)).toContain('uppercase');
    expect(mobileRoleClass('eyebrow', true)).not.toContain('uppercase');
  });

  test('the md eyebrow class drops the wide tracking for a script font', () => {
    expect(desktopMdClass('eyebrow', false)).toContain('tracking-[0.2em]');
    expect(desktopMdClass('eyebrow', true)).not.toContain('tracking-[0.2em]');
  });

  test('a script eyebrow is rendered at a readable size, not the tiny label size', () => {
    // A thin connected script at text-xs / text-[0.65rem] is unreadable.
    expect(roleClass('eyebrow', true)).not.toContain('text-xs');
    expect(mobileRoleClass('eyebrow', true)).not.toContain('text-[0.65rem]');
    expect(desktopMdClass('eyebrow', true)).not.toContain('md:text-xs');
  });

  test('a script eyebrow is not faded down (full strength so a thin script reads)', () => {
    expect(roleClass('eyebrow', true)).not.toContain('opacity-80');
  });

  test('non-eyebrow roles are unaffected by script-ness', () => {
    expect(roleClass('headline', true)).toBe(roleClass('headline', false));
    expect(roleClass('body', true)).toBe(roleClass('body', false));
    expect(mobileRoleClass('sub', true)).toBe(mobileRoleClass('sub', false));
  });
});
