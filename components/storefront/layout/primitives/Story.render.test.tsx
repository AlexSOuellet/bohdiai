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
});

describe('Story — tone (mood-driven)', () => {
  it('dark tone reads with light text', () => {
    const { container } = render(<Story node={makeStory({ tone: 'dark' })} ctx={{}} />);
    const line = container.querySelector('[data-story-line]') as HTMLElement;
    // #f6f1ea → rgb(246, 241, 234)
    expect(line.style.color).toBe('rgb(246, 241, 234)');
  });

  it('light tone reads with dark text', () => {
    const { container } = render(<Story node={makeStory({ tone: 'light' })} ctx={{}} />);
    const line = container.querySelector('[data-story-line]') as HTMLElement;
    // #15110d → rgb(21, 17, 13)
    expect(line.style.color).toBe('rgb(21, 17, 13)');
  });
});
