import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetRoot, MainStreetFooter, skinVarsCss } from './chrome';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
afterEach(cleanup);

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
