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
  it('paints a pure-black backdrop, the hero object, and the words at the brand phase', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={null} />);
    const root = container.querySelector('[data-spotlight-stage]') as HTMLElement;
    expect(root).not.toBeNull();
    // backdrop is pure black (#000)
    expect(root.getAttribute('style')).toContain('#000');
    expect(container.querySelector('img[alt="a hero object"]')).not.toBeNull();
    expect(container.textContent).toContain('Shop Name');
    expect(container.textContent).toContain('One brave line');
    expect(container.textContent).toContain('EYEBROW');
  });

  it('hides the words while the object is still rising', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'rising' }} action={null} />);
    const brand = container.querySelector('[data-spotlight-brand]') as HTMLElement;
    expect(brand).not.toBeNull();
    expect(brand.getAttribute('style')).toMatch(/opacity:\s*0/);
  });

  it('renders an action element when supplied (e.g. the Enter button)', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={<button data-action>Enter site</button>} />);
    expect(container.querySelector('[data-action]')).not.toBeNull();
  });

  it('falls back to a static aria block when the moment has no url (placeholder build)', () => {
    const m = { ...moment, media: { ...moment.media, url: undefined } };
    const { container } = render(<SpotlightStage moment={m} skin={skin} phase={{ kind: 'brand' }} action={null} />);
    // Either an aria-labelled placeholder or no img — verify no img with src renders.
    expect(container.querySelector('img[src]')).toBeNull();
  });
});
