import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Type } from './Type';

afterEach(cleanup);

describe('Type — the single typed-text component (role → data-type, fonts via CSS)', () => {
  it('sets data-type to the role name so the skin CSS can style it', () => {
    const { container } = render(<Type role="brand">June&apos;s</Type>);
    const el = container.querySelector('[data-type="brand"]');
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("June's");
  });

  it('defaults to a <span> when no element is given', () => {
    const { container } = render(<Type role="body">hi</Type>);
    expect(container.querySelector('span[data-type="body"]')).toBeTruthy();
  });

  it('renders the element named by `as`', () => {
    const { container } = render(
      <Type as="h1" role="brand">
        Title
      </Type>,
    );
    expect(container.querySelector('h1[data-type="brand"]')).toBeTruthy();
  });

  it('does NOT spread any inline font properties — type comes from CSS, not inline style', () => {
    const { container } = render(
      <Type as="h1" role="brand">
        Title
      </Type>,
    );
    const el = container.querySelector('h1')! as HTMLElement;
    expect(el.style.fontFamily).toBe('');
    expect(el.style.fontSize).toBe('');
    expect(el.style.fontWeight).toBe('');
    expect(el.style.letterSpacing).toBe('');
  });

  it('passes through non-type props (className, style, href) verbatim', () => {
    const { container } = render(
      <Type as="a" role="navLabel" href="/shop" className="cta" style={{ color: 'var(--ms-accent)' }}>
        Shop
      </Type>,
    );
    const a = container.querySelector('a')! as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('/shop');
    expect(a.className).toBe('cta');
    expect(a.style.color).toBe('var(--ms-accent)');
    expect(a.getAttribute('data-type')).toBe('navLabel');
  });
});
