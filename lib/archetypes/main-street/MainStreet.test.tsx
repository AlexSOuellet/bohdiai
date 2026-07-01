import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreet } from './MainStreet';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const base: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    media: {
      kind: 'still',
      prompt: { composition: 'bench', subject: 'a wallet', environment: 'a workshop', atmosphere: 'warm', camera: 'still', lighting: 'amber', style: 'photographic' },
      alt: 'the bench',
    },
    story: ['cut by hand', 'stitched to last'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench' },
  founder: {
    quote: 'I would rather make one belt that lasts thirty years than ten that do not at all.',
    attribution: 'Sam, founder',
    photo: { prompt: 'the maker at the bench', alt: 'the maker' },
  },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
};

afterEach(cleanup);

describe('MainStreet — find-us beat composition', () => {
  it('shows a find-us beat when the maker has dates', () => {
    const withDates: MainStreetContent = {
      ...base,
      founder: { ...base.founder, findUs: { label: 'Find us', rows: [{ day: 'Sat', where: 'Market', time: '9am' }] } },
    };
    const { container } = render(<MainStreet content={withDates} skin={skin} products={[]} />);
    expect(container.querySelector('[data-ms-findus]')).toBeTruthy();
  });

  it('shows no find-us beat when the maker has no dates', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('[data-ms-findus]')).toBeNull();
  });
});

describe('MainStreet — marquee band composition', () => {
  it('shows the marquee band when turned on, with content from the store itself', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} showMarquee />);
    expect(container.querySelector('.ms-mq-band')).toBeTruthy();
    // The voice line is assembled from base's own authored copy.
    expect(container.textContent).toContain(base.moment.eyebrow);
  });

  it('shows no marquee band when it is off (no toggle)', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('.ms-mq-band')).toBeNull();
  });

  it('places the marquee between the hero and the goods beat (the handoff slot)', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} showMarquee />);
    const hero = container.querySelector('[data-ms-hero]');
    const marquee = container.querySelector('.ms-mq-band');
    const goods = container.querySelector('#goods');
    expect(hero && marquee && goods).toBeTruthy();
    // Document order: hero → marquee → goods.
    expect(hero!.compareDocumentPosition(marquee!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(marquee!.compareDocumentPosition(goods!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('MainStreet — hero slot resolves through the catalog (the swap)', () => {
  it('renders the Story hero by default (unchanged from before the catalog)', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero="split"]')).toBeNull();
  });

  it('renders the Split hero when the recipe names heroVariant "split"', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} heroVariant="split" />);
    expect(container.querySelector('[data-ms-hero="split"]')).toBeTruthy();
  });

  it('keeps the rest of the page (close beat) regardless of which hero the recipe picks', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} heroVariant="split" />);
    expect(container.textContent).toContain(base.close.headline);
  });
});
