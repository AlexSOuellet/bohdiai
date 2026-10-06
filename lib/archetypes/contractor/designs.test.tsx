import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CONTRACTOR_SPEC } from './builder';
import { CONTRACTOR_FIXTURE } from './fixture.test-data';
import type { ContractorContent } from './schemas';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const DESIGNS = ['atelier', 'harbor', 'ridge'] as const;
const still = (n: string) => ({ kind: 'still' as const, url: `https://example.com/${n}.webp`, alt: `${n} photo` });

/** Every optional part missing: no reviews, badges, tags, places, colors or promises, and no form (no tenant). */
function bare(design: (typeof DESIGNS)[number]): ContractorContent {
  return {
    ...CONTRACTOR_FIXTURE,
    reviews: undefined,
    proof: undefined,
    design,
    services: { eyebrow: 'What we do', title: 'Services', items: [{ name: 'Repairs', detail: 'Small jobs.' }] },
    work: { eyebrow: 'Work', title: 'The work', items: [{ media: still('job'), caption: 'A job' }] },
    estimate: { eyebrow: 'Estimate', title: 'Ask us', intro: 'Tell us.' },
  };
}

/** Every optional part filled in. */
function full(design: (typeof DESIGNS)[number]): ContractorContent {
  const scopes = [{ key: 'a', name: 'Inside', detail: 'Walls', icon: 'weekend' }, { key: 'b', name: 'Outside', detail: 'Siding' }];
  const sizes = [{ key: 's', name: 'Small' }, { key: 'l', name: 'Large' }];
  const grades = [{ key: 'x', name: 'Standard', detail: 'Two coats', note: 'Base' }, { key: 'y', name: 'Premium', detail: 'Top paint', note: '+25%' }];
  const ranges: Record<string, string> = {};
  for (const s of scopes) for (const z of sizes) for (const g of grades) ranges[`${s.key}|${z.key}|${g.key}`] = '$1 – $2';
  return {
    ...CONTRACTOR_FIXTURE,
    design,
    notice: 'Now booking',
    hero: {
      ...CONTRACTOR_FIXTURE.hero,
      badges: [{ icon: 'star', label: '4.5 on Google', sub: 'From customers' }, { icon: 'home', label: 'Local' }],
      feature: { label: 'Featured', title: 'A room', tag: 'Two coats' },
      cutout: still('owner'),
    },
    services: {
      eyebrow: 'What we do',
      title: 'Services',
      note: 'Prep first.',
      items: [
        { name: 'Kitchens', detail: 'Cabinets.', icon: 'countertops', photo: still('kitchen'), label: 'Inside', tags: ['Cabinets', 'Counters'] },
        { name: 'Repairs', detail: 'Small jobs.', icon: 'handyman' },
      ],
    },
    work: {
      eyebrow: 'Work',
      title: 'The work',
      intro: 'Some jobs.',
      items: [
        { media: still('a'), caption: 'Job A', tag: 'Exterior', place: 'Warwick', detail: 'Two coats.', swatch: { color: '#b6a7d8', name: 'Lavender' } },
        { media: still('b'), caption: 'Job B', tag: 'Interior' },
      ],
    },
    estimator: { eyebrow: 'Ballpark', title: 'What would it cost', intro: 'Pick.', scopes, sizes, grades, ranges, rangeNote: 'Includes prep' },
    comparison: { eyebrow: 'Why us', title: 'Why it lasts', intro: 'Steps.', themLabel: 'Typical', usLabel: 'Us', rows: [{ topic: 'Prep', them: 'Skipped', us: 'Done' }] },
    reviews: { ...CONTRACTOR_FIXTURE.reviews!, note: 'Sample reviews.', rating: { score: '4.9', label: 'On Google' } },
    crew: { ...CONTRACTOR_FIXTURE.crew, promises: [{ icon: 'person', title: 'You get the owner', text: 'He comes out himself.' }] },
    calendar: { eyebrow: 'Booked', title: 'Our calendar', intro: 'Dark days are booked.', months: [{ year: 2026, month: 10, booked: [1, 2] }] },
    faq: { eyebrow: 'Questions', title: 'Ask us', items: [{ q: 'Do you move furniture?', a: 'Yes.' }] },
    banner: { label: 'Booking now', text: 'Spring', tag: 'Sample' },
    estimate: { ...CONTRACTOR_FIXTURE.estimate, detailsHint: 'What and when.', states: ['Rhode Island'] },
  };
}

const page = (content: ContractorContent, tenantId: string | undefined) =>
  render(CONTRACTOR_SPEC.render({ content, lookKey: 'contractor', products: [], tenantId, brandPalette: { base: '#0f1b2d', accent: '#d9a441' } }));

describe.each(DESIGNS)('the %s design', (design) => {
  it('renders with every optional part missing, and shows no form without a tenant', () => {
    const { container } = page(bare(design), undefined);
    expect(container.querySelector('h1')?.textContent).toContain(CONTRACTOR_FIXTURE.hero.headline);
    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toContain('A job');
    expect(container.textContent).toContain('Repairs');
  });

  it('renders every optional part when the content has it', () => {
    const { container } = page(full(design), TENANT);
    expect(container.textContent).toContain('Job A');
    expect(container.textContent).toContain('Cabinets');
    expect(container.querySelector('#estimate form')).not.toBeNull();
    expect(container.innerHTML).toContain('kitchen.webp');
  });

  it('wraps a legal page and a plain content page in its own chrome', () => {
    const legal = render(CONTRACTOR_SPEC.renderContentPage!({ content: full(design), brandPalette: undefined, html: '<h1>Privacy</h1>' } as never));
    expect(legal.container.querySelector('h1')?.textContent).toBe('Privacy');
    legal.unmount();
    const plain = render(CONTRACTOR_SPEC.renderContentPage!({ content: bare(design), brandPalette: undefined, title: 'Terms', body: ['First.', 'Second.'] } as never));
    expect(plain.container.querySelector('h1')?.textContent).toBe('Terms');
    expect(plain.container.textContent).toContain('Second.');
  });
});
