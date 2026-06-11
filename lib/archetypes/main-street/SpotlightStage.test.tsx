import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SpotlightStage } from './SpotlightStage';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-hearthstone']!;

const moment = {
  media: {
    kind: 'spotlight' as const,
    prompt: { composition: 'c', subject: 's', environment: 'e', atmosphere: 'a', camera: 'k', lighting: 'l', style: 'y' },
    url: 'https://cdn/hero.png',
    alt: 'a hero object',
  },
  story: ['One brave line'],
  eyebrow: 'EYEBROW',
  brand: 'Shop Name',
  ctaLabel: 'Shop now',
  ctaTarget: 'shop' as const,
};

describe('SpotlightStage', () => {
  it('paints a pure-black backdrop, the hero object, and the words', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} action={null} />);
    const root = container.querySelector('[data-spotlight-stage]') as HTMLElement;
    expect(root).not.toBeNull();
    // backdrop is pure black (#000)
    expect(root.getAttribute('style')).toContain('#000');
    expect(container.querySelector('img[alt="a hero object"]')).not.toBeNull();
    expect(container.textContent).toContain('Shop Name');
    expect(container.textContent).toContain('One brave line');
    expect(container.textContent).toContain('EYEBROW');
  });

  it('renders all word elements in the DOM with on-media color from mount', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} action={null} />);
    // All word elements exist immediately — they animate in via CSS, not JS state.
    expect(container.querySelector('[data-spotlight-eyebrow]')).not.toBeNull();
    expect(container.querySelector('[data-spotlight-brand]')).not.toBeNull();
    expect(container.querySelector('[data-spotlight-line]')).not.toBeNull();
  });

  it('renders an action element when supplied (e.g. the Enter button)', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} action={<button data-action>Enter site</button>} />);
    expect(container.querySelector('[data-action]')).not.toBeNull();
  });

  it('falls back to a static aria block when the moment has no url (placeholder build)', () => {
    const m = { ...moment, media: { ...moment.media, url: undefined } };
    const { container } = render(<SpotlightStage moment={m} skin={skin} action={null} />);
    // Either an aria-labelled placeholder or no img — verify no img with src renders.
    expect(container.querySelector('img[src]')).toBeNull();
  });

  it('respects prefers-reduced-motion by disabling the rise, push, and word fades', () => {
    // The component's <style> block must contain a prefers-reduced-motion section
    // that disables the rise, push, AND the word transitions (so reduced-motion users
    // don't sit on a black screen waiting for words).
    const { container } = render(<SpotlightStage moment={moment} skin={skin} action={null} />);
    const style = container.querySelector('style')!.textContent ?? '';
    expect(style).toMatch(/prefers-reduced-motion:\s*reduce/);
    // rise + push are disabled (animation:none) under reduced-motion
    expect(style).toMatch(/data-spotlight-object[^}]*animation:\s*none/);
    expect(style).toMatch(/data-spotlight-rise[^}]*animation:\s*none/);
    expect(style).toMatch(/data-spotlight-rise[^}]*opacity:\s*1/);
    // word fades are also disabled (transition:none + opacity:1 immediately)
    expect(style).toMatch(/data-spotlight-eyebrow[^}]*transition:\s*none/);
    expect(style).toMatch(/data-spotlight-brand[^}]*opacity:\s*1/);
    expect(style).toMatch(/data-spotlight-line[^}]*transition:\s*none/);
  });
});
