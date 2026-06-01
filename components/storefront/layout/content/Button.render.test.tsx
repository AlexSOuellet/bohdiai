import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { ButtonNode } from '@/lib/layout';
import { ButtonContent } from './Button';

afterEach(() => {
  cleanup();
});

function makeButton(extra: Partial<ButtonNode> = {}): ButtonNode {
  return { type: 'button', label: 'Buy', href: '/shop', ...extra } as unknown as ButtonNode;
}

describe('ButtonContent — semantic colors', () => {
  it('primary uses the brand primary with its paired on-color', () => {
    render(<ButtonContent node={makeButton({ variant: 'primary' })} ctx={{}} />);
    const el = screen.getByText('Buy') as HTMLAnchorElement;
    expect(el.style.background).toBe('var(--color-primary)');
    expect(el.style.color).toBe('var(--color-on-primary)');
  });

  it('secondary takes the primary as ink and the outline token for its border', () => {
    render(<ButtonContent node={makeButton({ variant: 'secondary' })} ctx={{}} />);
    const el = screen.getByText('Buy') as HTMLAnchorElement;
    expect(el.style.color).toBe('var(--color-primary)');
    expect(el.style.borderColor).toBe('var(--color-outline)');
  });

  it('a palette accent overrides the ink on text variants', () => {
    render(
      <ButtonContent node={makeButton({ variant: 'ghost', intent: { palette: 'Honey Gold' } })} ctx={{}} />,
    );
    expect((screen.getByText('Buy') as HTMLAnchorElement).style.color).toBe('var(--node-palette)');
  });
});

describe('ButtonContent — type scale', () => {
  it('sizes the label from the body type role, not a hardcoded size', () => {
    render(<ButtonContent node={makeButton()} ctx={{}} />);
    expect((screen.getByText('Buy') as HTMLAnchorElement).style.fontSize).toBe('var(--type-body-size)');
  });
});
