import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { BandNode, PaneNode } from '@/lib/layout';
import { surfaceStyleVars } from './intent';
import { Band } from './primitives/Band';
import { Pane } from './primitives/Pane';

afterEach(() => {
  cleanup();
});

describe('surfaceStyleVars', () => {
  it('returns an empty object when no surface is set', () => {
    expect(surfaceStyleVars(undefined)).toEqual({});
  });

  it('maps a surface to its background and paired on-color', () => {
    expect(surfaceStyleVars('surface')).toEqual({
      background: 'var(--color-surface)',
      color: 'var(--color-on-surface)',
    });
  });

  it('maps inverse-surface to its inverse paired foreground', () => {
    expect(surfaceStyleVars('inverse-surface')).toEqual({
      background: 'var(--color-inverse-surface)',
      color: 'var(--color-inverse-on-surface)',
    });
  });

  it('maps primary-container to on-primary-container', () => {
    expect(surfaceStyleVars('primary-container')).toEqual({
      background: 'var(--color-primary-container)',
      color: 'var(--color-on-primary-container)',
    });
  });
});

describe('Band — surface', () => {
  it('paints background and paired text color from the surface role', () => {
    const node = {
      type: 'band',
      children: [],
      intent: { surface: 'inverse-surface' },
    } as unknown as BandNode;
    const { container } = render(<Band node={node} ctx={{}} />);
    const el = container.querySelector('[data-node-type="band"]') as HTMLElement;
    expect(el.style.background).toBe('var(--color-inverse-surface)');
    expect(el.style.color).toBe('var(--color-inverse-on-surface)');
  });

  it('paints no background when no surface is set', () => {
    const node = { type: 'band', children: [] } as unknown as BandNode;
    const { container } = render(<Band node={node} ctx={{}} />);
    const el = container.querySelector('[data-node-type="band"]') as HTMLElement;
    expect(el.style.background).toBe('');
    expect(el.style.color).toBe('');
  });
});

describe('Pane — surface', () => {
  it('paints surface background and paired text color', () => {
    const node = {
      type: 'pane',
      child: { type: 'text', role: 'body', content: 'x' },
      intent: { surface: 'primary-container' },
    } as unknown as PaneNode;
    const { container } = render(<Pane node={node} ctx={{}} />);
    const el = container.querySelector('[data-node-type="pane"]') as HTMLElement;
    expect(el.style.background).toBe('var(--color-primary-container)');
    expect(el.style.color).toBe('var(--color-on-primary-container)');
  });

  it('falls back to a palette fill only when no surface is set', () => {
    const node = {
      type: 'pane',
      child: { type: 'text', role: 'body', content: 'x' },
      fill: true,
      intent: { palette: 'Honey Gold' },
    } as unknown as PaneNode;
    const { container } = render(<Pane node={node} ctx={{}} />);
    const el = container.querySelector('[data-node-type="pane"]') as HTMLElement;
    expect(el.style.background).toBe('var(--node-palette)');
  });
});
