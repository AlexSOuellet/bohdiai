import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreet } from './MainStreet';
import { MAIN_STREET_SKINS } from './skins';
import { FAMILIES } from './families';
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
    expect(container.querySelector('#find-us')).toBeTruthy();
  });

  it('shows no find-us beat when the maker has no dates', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('#find-us')).toBeNull();
  });
});

describe('MainStreet — marquee band composition', () => {
  it('shows the marquee band with content assembled from the store itself', () => {
    // Every family ships marquee-on at onboarding; Cozy (the default stack) has
    // it near the bottom of the page but always renders when the store has copy
    // to fill it (the marquee never carries hardcoded lines).
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('.ms-mq-band')).toBeTruthy();
    // The voice line is assembled from base's own authored copy.
    expect(container.textContent).toContain(base.moment.eyebrow);
  });

  it('skips the marquee when the section is off in the family stack', () => {
    // The family layer owns on/off — pass a stack with marquee explicitly off
    // to prove the walk respects it (the maker's editor toggle will use the
    // same mechanism in Phase 3).
    const withoutMarquee = FAMILIES.cozy.sectionStack.map((e) =>
      e.section === 'marquee' ? { ...e, on: false } : e,
    );
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} sectionStack={withoutMarquee} />);
    expect(container.querySelector('.ms-mq-band')).toBeNull();
  });

  it("places the marquee where the family stack says (Rustic → up top, between hero and about)", () => {
    // Rustic's opens-with is the workbench (About), but a scrolling marquee band
    // sits at position 2 — market energy, right after the hero. Verify the walk
    // renders in stack order, not a fixed slot.
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} sectionStack={FAMILIES.rustic.sectionStack} />);
    const hero = container.querySelector('[data-ms-hero]');
    const marquee = container.querySelector('.ms-mq-band');
    const goods = container.querySelector('#goods');
    expect(hero && marquee && goods).toBeTruthy();
    // Document order: hero → marquee → (about) → goods.
    expect(hero!.compareDocumentPosition(marquee!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(marquee!.compareDocumentPosition(goods!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('MainStreet — section stack walking (§1.4)', () => {
  it('renders sections in the family order the stack declares', () => {
    // Cozy opens with the maker (About Letter as the lead, position 2 after
    // hero). The founder beat should render before the goods beat, unlike a
    // family that leads with goods.
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} sectionStack={FAMILIES.cozy.sectionStack} />);
    const founder = container.querySelector('[data-ms-founder]');
    const goods = container.querySelector('#goods');
    expect(founder && goods).toBeTruthy();
    expect(founder!.compareDocumentPosition(goods!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders Dark with goods as the lead (position 2), before the About beat', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} sectionStack={FAMILIES.dark.sectionStack} />);
    const goods = container.querySelector('#goods');
    const founder = container.querySelector('[data-ms-founder]');
    expect(goods && founder).toBeTruthy();
    expect(goods!.compareDocumentPosition(founder!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('MainStreet — reviews beat composition', () => {
  const withReviews: MainStreetContent = {
    ...base,
    reviews: {
      title: 'Kind words',
      items: [
        { quote: 'These belts are the real thing.', author: 'Dana R.' },
        { quote: 'Worth every penny.', author: 'Marcus T.' },
      ],
    },
  };

  it('shows the reviews beat when the store has testimonials', () => {
    const { container } = render(<MainStreet content={withReviews} skin={skin} products={[]} />);
    expect(container.querySelector('#reviews')).toBeTruthy();
    expect(container.textContent).toContain('Dana R.');
  });

  it('shows no reviews beat when the store has none', () => {
    const { container } = render(<MainStreet content={base} skin={skin} products={[]} />);
    expect(container.querySelector('#reviews')).toBeNull();
  });

  it('places the reviews beat after the goods and before the footer', () => {
    const { container } = render(<MainStreet content={withReviews} skin={skin} products={[]} />);
    const goods = container.querySelector('#goods');
    const reviews = container.querySelector('#reviews');
    const footer = container.querySelector('footer');
    expect(goods && reviews && footer).toBeTruthy();
    // Document order: goods → reviews → footer (reviews sits just before the close).
    expect(goods!.compareDocumentPosition(reviews!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reviews!.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('honors a forced treatment (the ?reviews= preview)', () => {
    const { container } = render(<MainStreet content={withReviews} skin={skin} products={[]} reviewsTreatment="guestbook" />);
    expect(container.querySelector('.ms-rev-book')).toBeTruthy();
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
