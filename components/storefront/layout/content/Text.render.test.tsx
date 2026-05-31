import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { TextNode } from '@/lib/layout';
import { TextContent } from './Text';

afterEach(() => {
  cleanup();
});

function eyebrow(font?: string): TextNode {
  return {
    type: 'text',
    role: 'eyebrow',
    content: 'Small Batch',
    ...(font !== undefined ? { intent: { type: font } } : {}),
  } as TextNode;
}

describe('TextContent — script-aware eyebrow (rendered)', () => {
  it('renders a script-font eyebrow without forced uppercase', () => {
    render(<TextContent node={eyebrow('Sacramento')} ctx={{ scriptFonts: new Set(['Sacramento']) }} />);
    const el = screen.getByText('Small Batch');
    expect(el.className).not.toContain('uppercase');
  });

  it('keeps uppercase for the same font when it is NOT marked a script', () => {
    render(<TextContent node={eyebrow('Sacramento')} ctx={{}} />);
    const el = screen.getByText('Small Batch');
    expect(el.className).toContain('uppercase');
  });
});
