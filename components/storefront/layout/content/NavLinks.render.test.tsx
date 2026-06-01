import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { NavLinksNode } from '@/lib/layout';
import { NavLinksContent } from './NavLinks';

afterEach(() => {
  cleanup();
});

describe('NavLinksContent — color', () => {
  it('inherits the surface color by default (no more browser-blue links)', () => {
    const node = { type: 'navLinks' } as unknown as NavLinksNode;
    render(<NavLinksContent node={node} ctx={{}} />);
    const link = screen.getByText('Shop') as HTMLAnchorElement;
    expect(link.style.color).toBe('inherit');
  });

  it('tints links with the palette accent when intent.palette is set', () => {
    const node = { type: 'navLinks', intent: { palette: 'Honey Gold' } } as unknown as NavLinksNode;
    render(<NavLinksContent node={node} ctx={{}} />);
    const link = screen.getByText('Shop') as HTMLAnchorElement;
    expect(link.style.color).toBe('var(--node-palette)');
  });
});

describe('NavLinksContent — type scale', () => {
  it('sizes links from the body type role', () => {
    const node = { type: 'navLinks' } as unknown as NavLinksNode;
    render(<NavLinksContent node={node} ctx={{}} />);
    const link = screen.getByText('Shop') as HTMLAnchorElement;
    expect(link.style.fontSize).toBe('var(--type-body-size)');
  });
});
