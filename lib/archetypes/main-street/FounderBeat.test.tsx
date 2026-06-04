import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FounderBeat } from './FounderBeat';
import { selectFounderTreatment } from './founder';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const baseFounder: MainStreetContent['founder'] = {
  quote: 'I started with one cast-iron oven and a starter named Frank',
  attribution: 'June Carter, founder and baker',
  photo: { prompt: 'baker in a kitchen', alt: 'June' },
};

function withRows(n: number): MainStreetContent['founder'] {
  return {
    ...baseFounder,
    findUs: {
      label: 'Find us this week',
      rows: Array.from({ length: n }, (_, i) => ({ day: `D${i}`, where: `Market ${i}`, time: '9-2' })),
    },
  };
}

afterEach(cleanup);

describe('selectFounderTreatment', () => {
  it('leads with the calendar when the maker is out a lot', () => {
    expect(selectFounderTreatment({ findUsRows: 3 })).toBe('findus');
    expect(selectFounderTreatment({ findUsRows: 5, mood: 'cozy' })).toBe('findus');
  });
  it('reads intimate moods as a letter', () => {
    expect(selectFounderTreatment({ findUsRows: 0, mood: 'cozy' })).toBe('letter');
    expect(selectFounderTreatment({ findUsRows: 1, mood: 'rustic' })).toBe('letter');
  });
  it('reads cinematic moods as a portrait', () => {
    expect(selectFounderTreatment({ findUsRows: 0, mood: 'dark' })).toBe('portrait');
  });
  it('defaults to the quote', () => {
    expect(selectFounderTreatment({ findUsRows: 0, mood: 'modern' })).toBe('quote');
    expect(selectFounderTreatment({ findUsRows: 0 })).toBe('quote');
  });
});

describe('FounderBeat — forced treatment renders on the contrast band', () => {
  for (const treatment of ['quote', 'portrait', 'letter'] as const) {
    it(`${treatment} renders the quote on the contrast surface`, () => {
      const { getByText, container } = render(<FounderBeat founder={baseFounder} skin={skin} treatment={treatment} />);
      expect(getByText(/cast-iron oven/)).toBeTruthy();
      const band = container.querySelector('[data-ms-founder]') as HTMLElement;
      expect(band.style.background).toContain('--ms-contrast-bg');
    });
  }

  it('findus leads with the calendar rows', () => {
    const { getByText } = render(<FounderBeat founder={withRows(3)} skin={skin} treatment="findus" />);
    expect(getByText('Market 0')).toBeTruthy();
    expect(getByText('Find us this week')).toBeTruthy();
  });

  it('falls back off findus when there is no calendar', () => {
    const { container } = render(<FounderBeat founder={baseFounder} skin={skin} treatment="findus" />);
    // No findus aside list; the quote band still renders.
    expect(container.querySelector('[data-ms-founder]')).toBeTruthy();
  });
});

describe('FounderBeat — the about teaser cue', () => {
  it('renders the about cue pointing at the bio page', () => {
    const { container } = render(<FounderBeat founder={baseFounder} skin={skin} treatment="quote" aboutHref="/about" />);
    const cue = container.querySelector('.ms-aboutcue') as HTMLAnchorElement;
    expect(cue.getAttribute('href')).toBe('/about');
    expect(cue.textContent).toContain('Read the full story');
  });
  it('uses the maker-authored about label when present', () => {
    const f = { ...baseFounder, aboutLabel: 'Meet the baker' };
    const { container } = render(<FounderBeat founder={f} skin={skin} treatment="quote" />);
    expect((container.querySelector('.ms-aboutcue') as HTMLElement).textContent).toContain('Meet the baker');
  });
});
