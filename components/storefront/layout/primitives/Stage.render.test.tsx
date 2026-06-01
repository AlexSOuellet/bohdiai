import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { StageNode } from '@/lib/layout';
import { Stage } from './Stage';

afterEach(() => {
  cleanup();
});

// Placeholder media (no assetUrl) so the test doesn't pull in next/image.
const media = { type: 'image', brief: 'held', alt: 'held', fill: true } as const;

function makeStage(overrides: Partial<StageNode> = {}): StageNode {
  return {
    type: 'stage',
    media,
    content: [
      { type: 'text', role: 'headline', content: 'Light' },
      { type: 'text', role: 'sub', content: 'A line' },
      { type: 'button', label: 'Enter', href: '/shop' },
    ],
    ...overrides,
  } as StageNode;
}

describe('Stage — structure', () => {
  it('renders a full-screen held section with default bottom-left placement', () => {
    const { container } = render(<Stage node={makeStage()} ctx={{}} />);
    const section = container.querySelector('[data-node-type="stage"]') as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.className).toContain('min-h-screen');
    expect(section.className).toContain('overflow-hidden');
    // bottom-left → justify-start (mobile) + items-end
    expect(section.className).toContain('items-end');
    expect(section.className).toContain('justify-start');
  });

  it('holds the media as a full-bleed backdrop layer', () => {
    const { container } = render(<Stage node={makeStage()} ctx={{}} />);
    const fill = container.querySelector('[data-image-fill]') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.className).toContain('inset-0');
  });
});

describe('Stage — scrim & contrast guarantee', () => {
  it('auto scrim resolves to dark with light overlay text', () => {
    const { container } = render(<Stage node={makeStage()} ctx={{}} />);
    const section = container.querySelector('[data-node-type="stage"]') as HTMLElement;
    expect(section.getAttribute('data-stage-scrim')).toBe('dark');
    expect(container.querySelector('[data-stage-scrim-layer]')).toBeTruthy();
    const overlay = container.querySelector('[data-stage-overlay]') as HTMLElement;
    // JSDOM normalizes the hex to rgb. #f6f1ea → rgb(246, 241, 234)
    expect(overlay.style.color).toBe('rgb(246, 241, 234)');
  });

  it('a light scrim pairs with dark overlay text', () => {
    const { container } = render(<Stage node={makeStage({ scrim: 'light' })} ctx={{}} />);
    const overlay = container.querySelector('[data-stage-overlay]') as HTMLElement;
    // #15110d → rgb(21, 17, 13)
    expect(overlay.style.color).toBe('rgb(21, 17, 13)');
  });

  it('scrim none omits the wash layer', () => {
    const { container } = render(<Stage node={makeStage({ scrim: 'none' })} ctx={{}} />);
    expect(container.querySelector('[data-stage-scrim-layer]')).toBeNull();
  });
});

describe('Stage — motion (content flows in)', () => {
  it('wraps every content node in a staged reveal', () => {
    const { container } = render(<Stage node={makeStage()} ctx={{}} />);
    const reveals = container.querySelectorAll('[data-stage-reveal]');
    expect(reveals.length).toBe(3);
  });

  it('staggers each node by an increasing animation-delay', () => {
    const { container } = render(
      <Stage node={makeStage({ reveal: { stagger: 'normal' } })} ctx={{}} />,
    );
    const reveals = Array.from(container.querySelectorAll('[data-stage-reveal]')) as HTMLElement[];
    expect(reveals[0]!.style.animation).toContain('stage-rise-fade');
    expect(reveals[0]!.style.animation).toContain('0ms');
    expect(reveals[1]!.style.animation).toContain('550ms');
    expect(reveals[2]!.style.animation).toContain('1100ms');
  });

  it('each beat is slow and deliberate, with the duration in a var so reduced-motion can keep the fade', () => {
    const { container } = render(<Stage node={makeStage()} ctx={{}} />);
    const first = container.querySelector('[data-stage-reveal]') as HTMLElement;
    expect(first.style.getPropertyValue('--stage-reveal-duration')).toBe('5s');
    expect(first.style.animation).toContain('var(--stage-reveal-duration)');
    // linear easing — an eased opacity fade front-loads and reads as a pop
    expect(first.style.animation).toContain('linear');
  });

  it('uses the chosen motion keyframe', () => {
    const { container } = render(
      <Stage node={makeStage({ reveal: { motion: 'fade' } })} ctx={{}} />,
    );
    const first = container.querySelector('[data-stage-reveal]') as HTMLElement;
    expect(first.style.animation).toContain('stage-fade');
  });
});
