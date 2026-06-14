import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetRoot, MainStreetFooter, skinVarsCss, linkHref, LINK_TARGETS, resolveNav, MAIN_STREET_NAV } from './chrome';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
afterEach(cleanup);

describe('linkHref', () => {
  it('maps each real-page target to a route that exists', () => {
    expect(linkHref('home')).toBe('/');
    expect(linkHref('shop')).toBe('/shop');
    expect(linkHref('about')).toBe('/about');
    expect(linkHref('events')).toBe('/events');
    expect(linkHref('contact')).toBe('/contact');
  });

  it('every target is a real route — no in-page scroll target (the home is a sampling; the shop is the catalog)', () => {
    for (const t of LINK_TARGETS) {
      expect(linkHref(t)).toMatch(/^\//);
    }
  });
});

describe('skinVarsCss', () => {
  it('emits both surfaces and the three font voices as CSS vars', () => {
    const css = skinVarsCss(skin);
    expect(css).toContain('--ms-bg:');
    expect(css).toContain('--ms-contrast-bg:');
    expect(css).toContain('--ms-contrast-fg:');
    expect(css).toContain('--ms-accent:');
    expect(css).toContain('--ms-disp:');
    expect(css).toContain('--ms-body:');
    expect(css).toContain('--ms-mono:');
  });
});

describe('resolveNav', () => {
  it('uses the authored nav, pointing each label at its target route', () => {
    const resolved = resolveNav([
      { label: 'Breads', target: 'shop' },
      { label: 'Our story', target: 'about' },
    ]);
    expect(resolved).toEqual([
      { href: '/shop', label: 'Breads' },
      { href: '/about', label: 'Our story' },
    ]);
  });

  it('falls back to the fixed nav for legacy string entries (labels never had targets)', () => {
    expect(resolveNav(['Shop', 'About', 'Find us'])).toEqual(MAIN_STREET_NAV);
  });

  it('falls back to the fixed nav when nav is empty', () => {
    expect(resolveNav([])).toEqual(MAIN_STREET_NAV);
  });
});

describe('MainStreetRoot', () => {
  it('renders the scoped container and grain layer', () => {
    const { container } = render(
      <MainStreetRoot skin={skin}>
        <div>child</div>
      </MainStreetRoot>,
    );
    expect(container.querySelector('.arch-main-street')).toBeTruthy();
    expect(container.querySelector('.ms-grain')).toBeTruthy();
  });
});

describe('MainStreetFooter', () => {
  it('renders the shop name and the platform-guaranteed legal links', () => {
    const { getByText, container } = render(<MainStreetFooter shopName="June's Sourdough" skin={skin} />);
    expect(getByText("June's Sourdough")).toBeTruthy();
    const links = Array.from(container.querySelectorAll('a')).map((a) => a.textContent);
    expect(links).toEqual(expect.arrayContaining(['Home', 'Privacy', 'Terms']));
  });
});
