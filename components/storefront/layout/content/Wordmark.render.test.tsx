import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { WordmarkNode } from '@/lib/layout';
import { WordmarkContent } from './Wordmark';

afterEach(() => {
  cleanup();
});

describe('WordmarkContent — type scale', () => {
  it('sizes a text wordmark from the wordmark type-scale role', () => {
    const node = { type: 'wordmark', kind: 'text', content: 'Acme' } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    const el = screen.getByText('Acme');
    expect(el.style.fontSize).toBe('var(--type-wordmark-size)');
    expect(el.style.fontFamily).toContain('var(--type-wordmark-font)');
    expect(el.style.fontWeight).toBe('var(--type-wordmark-weight)');
  });
});

describe('WordmarkContent — color', () => {
  it('inherits the surface color by default (no explicit color)', () => {
    const node = { type: 'wordmark', kind: 'text', content: 'Plain' } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    expect(screen.getByText('Plain').style.color).toBe('');
  });

  it('uses the palette accent when intent.palette is set', () => {
    const node = {
      type: 'wordmark',
      kind: 'text',
      content: 'Tinted',
      intent: { palette: 'Honey Gold' },
    } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    expect(screen.getByText('Tinted').style.color).toBe('var(--node-palette)');
  });
});

describe('WordmarkContent — gradient', () => {
  it('paints a clipped gradient fill from named palette colors when set', () => {
    const node = {
      type: 'wordmark',
      kind: 'text',
      content: 'Gradient',
      gradient: { from: 'Honey Gold', to: 'Ink', angle: 120 },
    } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    const el = screen.getByText('Gradient');
    expect(el.style.backgroundImage).toBe(
      'linear-gradient(120deg, var(--palette-honey-gold), var(--palette-ink))',
    );
    expect(el.style.color).toBe('transparent');
    expect(el.style.backgroundClip).toBe('text');
  });

  it('defaults the gradient angle to 90deg', () => {
    const node = {
      type: 'wordmark',
      kind: 'text',
      content: 'Default',
      gradient: { from: 'Honey Gold', to: 'Ink' },
    } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    expect(screen.getByText('Default').style.backgroundImage).toContain('90deg');
  });
});

describe('WordmarkContent — image kind', () => {
  it('renders an image when kind is image', () => {
    const node = {
      type: 'wordmark',
      kind: 'image',
      content: 'https://example.com/logo.png',
    } as unknown as WordmarkNode;
    render(<WordmarkContent node={node} ctx={{}} />);
    expect(screen.getByAltText('Logo')).toBeTruthy();
  });
});
