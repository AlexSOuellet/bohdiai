import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { StoryNode } from '@/lib/layout';
import { Story } from './Story';

afterEach(() => {
  cleanup();
});

// Placeholder media (no assetUrl) so the test doesn't pull in next/image.
const media = { type: 'image', brief: 'held', alt: 'held', fill: true } as const;

function makeStory(overrides: Partial<StoryNode> = {}): StoryNode {
  return {
    type: 'story',
    media,
    story: ['It starts with the wax', 'Poured by hand, one at a time'],
    eyebrow: 'Hand-poured in Providence',
    brand: 'Ember and Oak',
    cta: { label: 'Step inside', href: '/shop' },
    ...overrides,
  } as StoryNode;
}

describe('Story — structure', () => {
  it('renders a full-screen held section', () => {
    const { container } = render(<Story node={makeStory()} ctx={{}} />);
    const section = container.querySelector('[data-node-type="story"]') as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.className).toContain('min-h-screen');
    expect(section.className).toContain('overflow-hidden');
  });

  it('holds the media as a full-bleed backdrop layer', () => {
    const { container } = render(<Story node={makeStory()} ctx={{}} />);
    const fill = container.querySelector('[data-image-fill]') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.className).toContain('inset-0');
  });
});

describe('Story — the cross-fading lines', () => {
  it('renders one cross-fade frame per story line', () => {
    const { container } = render(
      <Story node={makeStory({ story: ['one', 'two', 'three'] })} ctx={{}} />,
    );
    expect(container.querySelectorAll('[data-story-line]').length).toBe(3);
  });

  it('each line is a reduced-motion-safe linear cross-fade (opacity, duration in a var)', () => {
    const { container } = render(<Story node={makeStory()} ctx={{}} />);
    const line = container.querySelector('[data-story-line]') as HTMLElement;
    expect(line.getAttribute('data-meld-fade')).not.toBeNull();
    expect(line.style.transition).toContain('opacity');
    expect(line.style.transition).toContain('linear');
    expect(line.style.getPropertyValue('--meld-fade-duration')).not.toBe('');
  });
});

describe('Story — the brand frame', () => {
  it('renders a brand frame with the brand name in the wordmark type role', () => {
    const { container, getByText } = render(<Story node={makeStory()} ctx={{}} />);
    const brandFrame = container.querySelector('[data-story-brand]') as HTMLElement;
    expect(brandFrame).toBeTruthy();
    const wordmark = getByText('Ember and Oak');
    expect(wordmark.style.fontFamily).toContain('var(--type-wordmark-font)');
  });

  it('renders the eyebrow and the CTA when provided', () => {
    const { getByText } = render(<Story node={makeStory()} ctx={{}} />);
    expect(getByText('Hand-poured in Providence')).toBeTruthy();
    const cta = getByText('Step inside') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/shop');
  });

  // Type comes entirely from the design system's roles — no hardcoded size,
  // weight, or letter-spacing in the renderer.
  it('renders the brand from the wordmark role of the design system', () => {
    const { getByText } = render(<Story node={makeStory()} ctx={{}} />);
    const wordmark = getByText('Ember and Oak');
    expect(wordmark.style.fontFamily).toContain('var(--type-wordmark-font)');
    expect(wordmark.style.fontSize).toContain('var(--type-wordmark-size)');
    expect(wordmark.style.fontWeight).toContain('var(--type-wordmark-weight)');
  });

  it('renders the story lines from the headline role of the design system', () => {
    const { container } = render(<Story node={makeStory()} ctx={{}} />);
    const p = container.querySelector('[data-story-line] p') as HTMLElement;
    expect(p.style.fontFamily).toContain('var(--type-headline-font)');
    expect(p.style.fontSize).toContain('var(--type-headline-size)');
  });

  it('renders the eyebrow from the eyebrow role (no hardcoded type)', () => {
    const { getByText } = render(<Story node={makeStory()} ctx={{}} />);
    const eyebrow = getByText('Hand-poured in Providence');
    expect(eyebrow.style.fontFamily).toContain('var(--type-eyebrow-font)');
    expect(eyebrow.style.fontSize).toContain('var(--type-eyebrow-size)');
  });
});

describe('Story — tone (mood-driven, sourced from the design system)', () => {
  it('dark tone pairs with the inverse-surface foreground token', () => {
    const { container } = render(<Story node={makeStory({ tone: 'dark' })} ctx={{}} />);
    const line = container.querySelector('[data-story-line]') as HTMLElement;
    expect(line.style.color).toBe('var(--color-inverse-on-surface)');
  });

  it('light tone pairs with the surface foreground token', () => {
    const { container } = render(<Story node={makeStory({ tone: 'light' })} ctx={{}} />);
    const line = container.querySelector('[data-story-line]') as HTMLElement;
    expect(line.style.color).toBe('var(--color-on-surface)');
  });
});
