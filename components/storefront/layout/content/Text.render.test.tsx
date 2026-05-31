import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { TextNode } from '@/lib/layout';
import { TextContent } from './Text';

afterEach(() => {
  cleanup();
});

function makeText(role: TextNode['role'], content = 'Hello'): TextNode {
  return { type: 'text', role, content } as TextNode;
}

describe('TextContent — tag selection', () => {
  it('renders eyebrow as a span', () => {
    render(<TextContent node={makeText('eyebrow', 'Handmade')} ctx={{}} />);
    expect(screen.getByText('Handmade').tagName).toBe('SPAN');
  });

  it('renders headline as h1', () => {
    render(<TextContent node={makeText('headline', 'Welcome')} ctx={{}} />);
    expect(screen.getByText('Welcome').tagName).toBe('H1');
  });

  it('renders sub as h2', () => {
    render(<TextContent node={makeText('sub', 'Sub')} ctx={{}} />);
    expect(screen.getByText('Sub').tagName).toBe('H2');
  });

  it('renders body as p', () => {
    render(<TextContent node={makeText('body', 'Body text')} ctx={{}} />);
    expect(screen.getByText('Body text').tagName).toBe('P');
  });

  it('renders caption as span', () => {
    render(<TextContent node={makeText('caption', 'Note')} ctx={{}} />);
    expect(screen.getByText('Note').tagName).toBe('SPAN');
  });
});

describe('TextContent — type scale CSS variables', () => {
  it('references the type scale CSS variable for font-size', () => {
    render(<TextContent node={makeText('headline')} ctx={{}} />);
    const el = screen.getByText('Hello');
    expect(el.style.fontSize).toBe('var(--type-headline-size)');
  });

  it('references the correct role var for eyebrow', () => {
    render(<TextContent node={makeText('eyebrow', 'Label')} ctx={{}} />);
    const el = screen.getByText('Label');
    expect(el.style.fontSize).toBe('var(--type-eyebrow-size)');
    expect(el.style.fontFamily).toContain('var(--type-eyebrow-font)');
  });

  it('references the text-transform var', () => {
    render(<TextContent node={makeText('eyebrow', 'Up')} ctx={{}} />);
    const el = screen.getByText('Up');
    expect(el.style.textTransform).toBe('var(--type-eyebrow-transform, none)');
  });
});

describe('TextContent — alignment class', () => {
  it('applies text-center class for center align', () => {
    const node: TextNode = { ...makeText('body', 'Centered'), align: 'center' } as TextNode;
    render(<TextContent node={node} ctx={{}} />);
    expect(screen.getByText('Centered').className).toContain('text-center');
  });

  it('applies text-right class for end align', () => {
    const node: TextNode = { ...makeText('body', 'Right'), align: 'end' } as TextNode;
    render(<TextContent node={node} ctx={{}} />);
    expect(screen.getByText('Right').className).toContain('text-right');
  });
});

describe('TextContent — data attributes', () => {
  it('sets data-node-type and data-node-role attributes', () => {
    render(<TextContent node={makeText('headline', 'Title')} ctx={{}} />);
    const el = screen.getByText('Title');
    expect(el.getAttribute('data-node-type')).toBe('text');
    expect(el.getAttribute('data-node-role')).toBe('headline');
  });
});
